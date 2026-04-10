import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/organization.dto';
import { PaginationUtil } from '../common/utils/pagination.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create new organization
   */
  async createOrganization(
    userId: string,
    createDto: CreateOrganizationDto,
  ) {
    const org = await this.prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: createDto.name,
          slug: this.generateSlug(createDto.name),
          description: createDto.description,
          website: createDto.website,
          status: 'ACTIVE',
          tier: 'FREE',
        },
      });

      // Create admin role
      const adminRole = await tx.role.create({
        data: {
          organizationId: organization.id,
          name: 'Admin',
          isSystem: true,
        },
      });

      // Create permissions
      const permissions = [
        'create:content',
        'read:content',
        'update:content',
        'delete:content',
        'manage:users',
        'manage:organization',
        'manage:billing',
      ];

      await Promise.all(
        permissions.map((action) =>
          tx.permission.create({
            data: {
              roleId: adminRole.id,
              action: action.split(':')[0],
              resource: action.split(':')[1],
            },
          }),
        ),
      );

      // Add creator as admin
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          roleId: adminRole.id,
          status: 'ACTIVE',
          roleName: 'Admin',
          permissions,
        },
      });

      return organization;
    });

    return org;
  }

  /**
   * Get organization details
   */
  async getOrganization(organizationId: string, userId: string) {
    // Verify user belongs to organization
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Access denied');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        website: true,
        tier: true,
        maxMembers: true,
        maxProjects: true,
        maxStorageGB: true,
        usedStorageGB: true,
        createdAt: true,
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    userId: string,
    updateDto: UpdateOrganizationDto,
  ) {
    // Verify user is admin
    await this.verifyOrgAdmin(organizationId, userId);

    const org = await this.prisma.organization.update({
      where: { id: organizationId },
      data: updateDto,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        website: true,
        tier: true,
      },
    });

    return org;
  }

  /**
   * Invite member to organization
   */
  async inviteMember(
    organizationId: string,
    userId: string,
    inviteDto: InviteMemberDto,
  ) {
    // Verify user is admin
    await this.verifyOrgAdmin(organizationId, userId);

    // Check if user already exists
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: inviteDto.email, // This won't work, need to find by email first
        },
      },
    });

    // Check if already invited
    const existingInvitation = await this.prisma.invitation.findUnique({
      where: {
        organizationId_invitedEmail: {
          organizationId,
          invitedEmail: inviteDto.email,
        },
      },
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      throw new BadRequestException('User already invited');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: inviteDto.email },
    });

    if (user) {
      // User exists, add directly
      const roleId = inviteDto.roleId || (await this.getDefaultRoleId(organizationId));

      await this.prisma.organizationMember.create({
        data: {
          organizationId,
          userId: user.id,
          roleId,
          status: 'ACTIVE',
        },
      });

      return { invitationSent: false, memberAdded: true };
    }

    // User doesn't exist, send invitation
    const roleId = inviteDto.roleId || (await this.getDefaultRoleId(organizationId));
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.invitation.create({
      data: {
        organizationId,
        invitedEmail: inviteDto.email,
        roleId,
        invitedBy: userId,
        status: 'PENDING',
        token,
        expiresAt,
      },
    });

    // Follow-up: send invitation email with token

    return { invitationSent: true, studentId: token };
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation already used or expired');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.email !== invitation.invitedEmail) {
      throw new ForbiddenException('Invitation email does not match');
    }

    // Add user to organization
    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId,
        roleId: invitation.roleId,
        status: 'ACTIVE',
      },
    });

    // Mark invitation as accepted
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedByUserId: userId,
      },
    });

    return member;
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    organizationId: string,
    userId: string,
    targetUserId: string,
    updateDto: UpdateMemberRoleDto,
  ) {
    // Verify user is admin
    await this.verifyOrgAdmin(organizationId, userId);

    // Prevent changing own role
    if (userId === targetUserId) {
      throw new ForbiddenException('Cannot change own role');
    }

    const member = await this.prisma.organizationMember.update({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
      data: { roleId: updateDto.roleId },
      include: { role: true },
    });

    return member;
  }

  /**
   * Verify user is organization admin
   */
  private async verifyOrgAdmin(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
      include: { role: true },
    });

    if (!member || !member.role.isSystem) {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }

  /**
   * Get default role for organization
   */
  private async getDefaultRoleId(organizationId: string): Promise<string> {
    const roles = await this.prisma.role.findMany({
      where: { organizationId },
      select: { id: true },
      take: 1,
    });

    if (roles.length === 0) {
      throw new NotFoundException('No roles found for organization');
    }

    return roles[0].id;
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }
}
