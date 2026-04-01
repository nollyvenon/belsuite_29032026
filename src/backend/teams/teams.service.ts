import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTeamDto, UpdateTeamDto, InviteTeamMemberDto, UpdateTeamMemberRoleDto, CreateTeamWorkflowDto, SubmitForApprovalDto, RespondToApprovalDto, PaginationQueryDto } from './dto/team.dto';
import { generateSlug } from '../common/utils/slug.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new team
   */
  async createTeam(organizationId: string, userId: string, createDto: CreateTeamDto) {
    // Check if user is member of organization
    const orgMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!orgMember) {
      throw new ForbiddenException('User is not a member of this organization');
    }

    // Create team
    const team = await this.prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          organizationId,
          name: createDto.name,
          slug: await this.generateUniqueSlug(createDto.name, organizationId, tx),
          description: createDto.description,
          isPublic: createDto.isPublic || false,
          requiresApproval: createDto.requiresApproval !== false,
          maxMembers: createDto.maxMembers,
          createdById: userId,
          memberCount: 1,
        },
      });

      // Add creator as OWNER
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId,
          role: 'OWNER',
          permissions: this.getPermissionsForRole('OWNER'),
        },
      });

      return newTeam;
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, team.id, userId, 'team.created', 'team', team.id, null, {
      name: team.name,
      slug: team.slug,
    });

    return team;
  }

  /**
   * Get team details
   */
  async getTeam(organizationId: string, teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    if (!team || team.organizationId !== organizationId) {
      throw new NotFoundException('Team not found');
    }

    // Check access
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!membership && !team.isPublic) {
      throw new ForbiddenException('Access denied to this team');
    }

    return {
      ...team,
      members: team.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || m.user.email,
        userEmail: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt,
        lastActivityAt: m.lastActivityAt,
        permissions: m.permissions,
      })),
    };
  }

  /**
   * List teams for organization
   */
  async listTeams(organizationId: string, userId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Get user's teams
    const userTeams = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    const userTeamIds = userTeams.map((t) => t.teamId);

    const where: any = {
      organizationId,
      OR: [{ createdById: userId }, { id: { in: userTeamIds } }, { isPublic: true }],
    };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const teams = await this.prisma.team.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
    });

    const total = await this.prisma.team.count({ where });

    return {
      teams,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Update team
   */
  async updateTeam(organizationId: string, teamId: string, userId: string, updateDto: UpdateTeamDto) {
    const team = await this.getTeamOrThrow(organizationId, teamId);

    // Check permission
    await this.requireTeamRole(teamId, userId, ['OWNER', 'ADMIN']);

    const changes: Record<string, any> = {};
    const oldValues: Record<string, any> = {};

    if (updateDto.name && updateDto.name !== team.name) {
      changes.name = updateDto.name;
      oldValues.name = team.name;
      team.name = updateDto.name;
    }

    if (updateDto.description !== undefined) {
      changes.description = updateDto.description;
      oldValues.description = team.description;
      team.description = updateDto.description;
    }

    if (updateDto.isPublic !== undefined) {
      changes.isPublic = updateDto.isPublic;
      oldValues.isPublic = team.isPublic;
      team.isPublic = updateDto.isPublic;
    }

    if (updateDto.requiresApproval !== undefined) {
      changes.requiresApproval = updateDto.requiresApproval;
      oldValues.requiresApproval = team.requiresApproval;
      team.requiresApproval = updateDto.requiresApproval;
    }

    if (updateDto.maxMembers !== undefined) {
      changes.maxMembers = updateDto.maxMembers;
      oldValues.maxMembers = team.maxMembers;
      team.maxMembers = updateDto.maxMembers;
    }

    const updated = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        isPublic: updateDto.isPublic,
        requiresApproval: updateDto.requiresApproval,
        maxMembers: updateDto.maxMembers,
      },
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, teamId, userId, 'team.updated', 'team', teamId, {
      before: oldValues,
      after: changes,
    }, changes);

    return updated;
  }

  /**
   * Delete/Archive team
   */
  async archiveTeam(organizationId: string, teamId: string, userId: string) {
    const team = await this.getTeamOrThrow(organizationId, teamId);

    // Check permission
    await this.requireTeamRole(teamId, userId, ['OWNER']);

    const archived = await this.prisma.team.update({
      where: { id: teamId },
      data: { archivedAt: new Date() },
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, teamId, userId, 'team.archived', 'team', teamId, null, { archivedAt: archived.archivedAt });

    return archived;
  }

  /**
   * Invite member to team
   */
  async inviteMember(organizationId: string, teamId: string, userId: string, inviteDto: InviteTeamMemberDto) {
    const team = await this.getTeamOrThrow(organizationId, teamId);

    // Check permission
    await this.requireTeamRole(teamId, userId, ['OWNER', 'ADMIN']);

    // Check team member limit
    if (team.maxMembers && team.memberCount >= team.maxMembers) {
      throw new BadRequestException('Team has reached maximum member limit');
    }

    // Check if user already invited/member
    const existingInvite = await this.prisma.teamInvitation.findUnique({
      where: { teamId_invitedEmail: { teamId, invitedEmail: inviteDto.email } },
    });

    if (existingInvite) {
      throw new ConflictException('User already invited or is member of this team');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.teamInvitation.create({
      data: {
        teamId,
        invitedEmail: inviteDto.email,
        role: inviteDto.role,
        invitedBy: userId,
        token,
        expiresAt,
        message: inviteDto.message,
      },
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, teamId, userId, 'member.invited', 'invitation', invitation.id, null, {
      email: inviteDto.email,
      role: inviteDto.role,
    });

    return invitation;
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(organizationId: string, token: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or expired');
    }

    if (invitation.team.organizationId !== organizationId) {
      throw new ForbiddenException('Invalid invitation for this organization');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.invitedEmail !== user.email) {
      throw new ForbiddenException('This invitation is not for your email address');
    }

    // Add user to team
    const teamMember = await this.prisma.$transaction(async (tx) => {
      const member = await tx.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: invitation.role,
          permissions: this.getPermissionsForRole(invitation.role),
        },
      });

      // Update invitation status
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          acceptedByUserId: userId,
        },
      });

      // Increment team member count
      await tx.team.update({
        where: { id: invitation.teamId },
        data: { memberCount: { increment: 1 } },
      });

      return member;
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, invitation.teamId, userId, 'member.accepted', 'member', teamMember.id, null, {
      email: user.email,
      role: invitation.role,
    });

    return teamMember;
  }

  /**
   * Remove member from team
   */
  async removeMember(organizationId: string, teamId: string, memberId: string, userId: string) {
    const team = await this.getTeamOrThrow(organizationId, teamId);

    // Check permission
    await this.requireTeamRole(teamId, userId, ['OWNER', 'ADMIN']);

    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.teamId !== teamId) {
      throw new NotFoundException('Team member not found');
    }

    // Cannot remove owner unless they are removing themselves
    if (member.role === 'OWNER' && member.userId !== userId) {
      throw new ForbiddenException('Cannot remove team owner');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.teamMember.delete({ where: { id: memberId } });
      await tx.team.update({
        where: { id: teamId },
        data: { memberCount: { decrement: 1 } },
      });
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, teamId, userId, 'member.removed', 'member', memberId, null, {
      email: member.user.email,
      role: member.role,
    });

    return { success: true };
  }

  /**
   * Update member role
   */
  async updateMemberRole(organizationId: string, teamId: string, memberId: string, userId: string, updateDto: UpdateTeamMemberRoleDto) {
    const team = await this.getTeamOrThrow(organizationId, teamId);

    // Check permission
    await this.requireTeamRole(teamId, userId, ['OWNER', 'ADMIN']);

    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.teamId !== teamId) {
      throw new NotFoundException('Team member not found');
    }

    // Cannot downgrade owner unless owner is changing their own role
    if (member.role === 'OWNER' && member.userId !== userId) {
      throw new ForbiddenException('Cannot change owner role');
    }

    const oldRole = member.role;
    const updated = await this.prisma.teamMember.update({
      where: { id: memberId },
      data: {
        role: updateDto.role,
        permissions: this.getPermissionsForRole(updateDto.role),
      },
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, teamId, userId, 'member.role.updated', 'member', memberId, {
      oldRole,
      newRole: updateDto.role,
    }, { role: updateDto.role });

    return updated;
  }

  /**
   * Create approval workflow
   */
  async createWorkflow(organizationId: string, teamId: string, userId: string, createDto: CreateTeamWorkflowDto) {
    const team = await this.getTeamOrThrow(organizationId, teamId);

    // Check permission
    await this.requireTeamRole(teamId, userId, ['OWNER', 'ADMIN']);

    const workflow = await this.prisma.teamWorkflow.create({
      data: {
        teamId,
        name: createDto.name,
        description: createDto.description,
        requiresApprovals: createDto.requiresApprovals !== false,
        requiredApprovals: createDto.requiredApprovals || 1,
        allowRejectReason: createDto.allowRejectReason !== false,
        applicableContentTypes: createDto.applicableContentTypes || [],
        triggerConfig: createDto.triggerConfig ? JSON.stringify(createDto.triggerConfig) : null,
        notificationConfig: createDto.notificationConfig ? JSON.stringify(createDto.notificationConfig) : null,
      },
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, teamId, userId, 'workflow.created', 'workflow', workflow.id, null, {
      name: workflow.name,
      requiredApprovals: workflow.requiredApprovals,
    });

    return workflow;
  }

  /**
   * Submit content for approval
   */
  async submitForApproval(organizationId: string, teamId: string, userId: string, submitDto: SubmitForApprovalDto) {
    const team = await this.getTeamOrThrow(organizationId, teamId);

    // Check permission
    await this.requireTeamRole(teamId, userId, ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR']);

    // Get an active workflow for this content type
    const workflow = await this.prisma.teamWorkflow.findFirst({
      where: {
        teamId,
        isActive: true,
        applicableContentTypes: {
          has: submitDto.contentType,
        },
      },
    });

    if (!workflow) {
      throw new BadRequestException(`No active approval workflow for content type: ${submitDto.contentType}`);
    }

    // Create approval request
    const approval = await this.prisma.$transaction(async (tx) => {
      const newApproval = await tx.workflowApproval.create({
        data: {
          workflowId: workflow.id,
          contentId: submitDto.contentId,
          contentType: submitDto.contentType,
          submittedById: userId,
          status: 'PENDING',
          comments: submitDto.comments,
          requiredApprovals: workflow.requiredApprovals,
          version: submitDto.version || 1,
          contentSnapshot: submitDto.contentSnapshot ? JSON.stringify(submitDto.contentSnapshot) : null,
        },
      });

      // Increment workflow submissions
      await tx.teamWorkflow.update({
        where: { id: workflow.id },
        data: { totalSubmissions: { increment: 1 } },
      });

      return newApproval;
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, teamId, userId, 'approval.submitted', 'approval', approval.id, null, {
      contentId: submitDto.contentId,
      contentType: submitDto.contentType,
      requiredApprovals: workflow.requiredApprovals,
    });

    return approval;
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(organizationId: string, teamId: string, userId: string, query: PaginationQueryDto) {
    const team = await this.getTeamOrThrow(organizationId, teamId);

    // Check if user has approver role
    await this.requireTeamRole(teamId, userId, ['OWNER', 'ADMIN', 'APPROVER']);

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const approvals = await this.prisma.workflowApproval.findMany({
      where: {
        workflow: { teamId },
        status: 'PENDING',
      },
      include: {
        workflow: true,
        submittedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        approvals: {
          where: { approverId: userId },
        },
      },
      skip,
      take: pageSize,
      orderBy: { submittedAt: 'desc' },
    });

    const total = await this.prisma.workflowApproval.count({
      where: {
        workflow: { teamId },
        status: 'PENDING',
      },
    });

    return {
      approvals: approvals.map((a) => ({
        ...a,
        myDecision: a.approvals[0]?.decision || null,
        myResponse: a.approvals[0] || null,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Respond to approval request
   */
  async respondToApproval(organizationId: string, teamId: string, approvalId: string, userId: string, respondDto: RespondToApprovalDto) {
    const approval = await this.prisma.workflowApproval.findUnique({
      where: { id: approvalId },
      include: { workflow: true, approvals: true },
    });

    if (!approval) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.workflow.teamId !== teamId) {
      throw new ForbiddenException('Approval not in this team');
    }

    // Check if user has approver role
    await this.requireTeamRole(teamId, userId, ['OWNER', 'ADMIN', 'APPROVER']);

    // Check if already responded
    const existingResponse = await this.prisma.approval.findUnique({
      where: { approvalRequestId_approverId: { approvalRequestId: approvalId, approverId: userId } },
    });

    if (existingResponse) {
      throw new ConflictException('You have already responded to this approval request');
    }

    const decision = respondDto.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';

    const approverResponse = await this.prisma.$transaction(async (tx) => {
      const response = await tx.approval.create({
        data: {
          approvalRequestId: approvalId,
          approverId: userId,
          decision,
          decisionReason: respondDto.decisionReason,
          respondedAt: new Date(),
        },
      });

      // Get all responses to check if approval is complete
      const allResponses = await tx.approval.findMany({
        where: { approvalRequestId: approvalId },
      });

      const approvedCount = allResponses.filter((r) => r.decision === 'APPROVED').length;
      const rejectedCount = allResponses.filter((r) => r.decision === 'REJECTED').length;

      // Check for auto-approval/rejection
      const currentApproval = await tx.workflowApproval.findUnique({
        where: { id: approvalId },
      });

      if (!currentApproval) {
        throw new Error(`Approval not found: ${approvalId}`);
      }

      let newStatus = currentApproval.status;

      if (rejectedCount > 0) {
        newStatus = 'REJECTED';
      } else if (approvedCount >= approval.workflow.requiredApprovals) {
        newStatus = 'APPROVED';
      }

      await tx.workflowApproval.update({
        where: { id: approvalId },
        data: {
          status: newStatus,
          receivedApprovals: allResponses.length,
          ...(newStatus === 'APPROVED' && { approvedAt: new Date() }),
          ...(newStatus === 'REJECTED' && { rejectedAt: new Date() }),
        },
      });

      // Update workflow stats
      if (newStatus === 'APPROVED') {
        await tx.teamWorkflow.update({
          where: { id: approval.workflow.id },
          data: { approvedCount: { increment: 1 } },
        });
      } else if (newStatus === 'REJECTED') {
        await tx.teamWorkflow.update({
          where: { id: approval.workflow.id },
          data: { rejectedCount: { increment: 1 } },
        });
      }

      return response;
    });

    // Record audit log
    await this.recordTeamAuditLog(organizationId, teamId, userId, `approval.${decision.toLowerCase()}`, 'approval', approvalId, null, {
      decision,
      reason: respondDto.decisionReason,
    });

    return approverResponse;
  }

  /**
   * Helper: Get team or throw error
   */
  private async getTeamOrThrow(organizationId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.organizationId !== organizationId) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  /**
   * Helper: Require team role
   */
  private async requireTeamRole(teamId: string, userId: string, allowedRoles: string[]) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this team');
    }

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException(`This action requires one of these roles: ${allowedRoles.join(', ')}`);
    }

    return member;
  }

  /**
   * Helper: Get permissions for role
   */
  private getPermissionsForRole(role: string): string[] {
    const permissions: Record<string, string[]> = {
      OWNER: [
        'team:create',
        'team:read',
        'team:update',
        'team:delete',
        'team:manage_members',
        'team:manage_workflows',
        'team:manage_approvals',
        'team:view_audit',
        'content:create',
        'content:update',
        'content:delete',
        'content:publish',
        'approval:submit',
        'approval:approve',
      ],
      ADMIN: [
        'team:read',
        'team:update',
        'team:manage_members',
        'team:manage_workflows',
        'team:manage_approvals',
        'team:view_audit',
        'content:create',
        'content:update',
        'content:delete',
        'content:publish',
        'approval:submit',
        'approval:approve',
      ],
      EDITOR: [
        'team:read',
        'content:create',
        'content:update',
        'content:delete',
        'content:publish',
        'approval:submit',
      ],
      CONTRIBUTOR: [
        'team:read',
        'content:create',
        'content:update',
        'approval:submit',
      ],
      APPROVER: [
        'team:read',
        'approval:approve',
        'approval:view',
      ],
      VIEWER: ['team:read', 'content:read'],
    };

    return permissions[role] || [];
  }

  /**
   * Helper: Generate unique slug
   */
  private async generateUniqueSlug(name: string, organizationId: string, tx: any): Promise<string> {
    let slug = generateSlug(name);
    let count = 1;

    while (true) {
      const existing = await tx.team.findFirst({
        where: { organizationId, slug },
      });

      if (!existing) break;

      slug = `${generateSlug(name)}-${count}`;
      count++;
    }

    return slug;
  }

  /**
   * Helper: Record audit log
   */
  private async recordTeamAuditLog(
    organizationId: string,
    teamId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string | null,
    changes: Record<string, any> | null,
    details: Record<string, any> | null,
  ) {
    try {
      await this.prisma.teamAuditLog.create({
        data: {
          teamId,
          userId,
          action,
          resourceType,
          resourceId,
          changes: changes ? JSON.stringify(changes) : null,
          details: details ? JSON.stringify(details) : null,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Log audit failures but don't throw
      console.error('Failed to record team audit log:', error);
    }
  }
}
