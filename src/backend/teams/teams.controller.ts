import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TeamRoleGuard } from '../common/guards/team-role.guard';
import { TeamPermissionGuard } from '../common/guards/team-permission.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CurrentOrganization } from '../common/decorators/organization.decorator';
import { RequireTeamRole } from '../common/decorators/require-team-role.decorator';
import { RequireTeamPermission } from '../common/decorators/require-team-permission.decorator';
import {
  CreateTeamDto,
  UpdateTeamDto,
  InviteTeamMemberDto,
  UpdateTeamMemberRoleDto,
  CreateTeamWorkflowDto,
  SubmitForApprovalDto,
  RespondToApprovalDto,
  PaginationQueryDto,
} from './dto/team.dto';

@Controller('api/teams')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  /**
   * POST /api/teams
   * Create a new team
   */
  @Post()
  @HttpCode(201)
  async createTeam(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() createDto: CreateTeamDto,
  ) {
    return this.teamsService.createTeam(organizationId, userId, createDto);
  }

  /**
   * GET /api/teams
   * List teams for organization
   */
  @Get()
  async listTeams(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.teamsService.listTeams(organizationId, userId, query);
  }

  /**
   * GET /api/teams/:teamId
   * Get team details
   */
  @Get(':teamId')
  async getTeam(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.teamsService.getTeam(organizationId, teamId, userId);
  }

  /**
   * PUT /api/teams/:teamId
   * Update team details
   * Requires: OWNER or ADMIN role
   */
  @Put(':teamId')
  @UseGuards(TeamRoleGuard)
  @RequireTeamRole(TeamRole.OWNER, TeamRole.ADMIN)
  async updateTeam(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateDto: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(organizationId, teamId, userId, updateDto);
  }

  /**
   * DELETE /api/teams/:teamId
   * Archive a team
   * Requires: OWNER role
   */
  @Delete(':teamId')
  @UseGuards(TeamRoleGuard)
  @RequireTeamRole(TeamRole.OWNER)
  @HttpCode(204)
  async archiveTeam(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.teamsService.archiveTeam(organizationId, teamId, userId);
  }

  /**
   * GET /api/teams/:teamId/members
   * List team members
   */
  @Get(':teamId/members')
  async getMembers(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const team = await this.teamsService.getTeam(organizationId, teamId, userId);
    return team.members;
  }

  /**
   * POST /api/teams/:teamId/members/invite
   * Invite member to team
   * Requires: OWNER or ADMIN role
   */
  @Post(':teamId/members/invite')
  @UseGuards(TeamRoleGuard)
  @RequireTeamRole(TeamRole.OWNER, TeamRole.ADMIN)
  @HttpCode(201)
  async inviteMember(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('sub') userId: string,
    @Body() inviteDto: InviteTeamMemberDto,
  ) {
    return this.teamsService.inviteMember(organizationId, teamId, userId, inviteDto);
  }

  /**
   * POST /api/teams/:teamId/members/add
   * Accept team invitation (user adds self to team)
   */
  @Post(':teamId/members/add')
  @HttpCode(201)
  async acceptInvitation(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('sub') userId: string,
    @Query('token') token: string,
  ) {
    if (!token) {
      throw new BadRequestException('Invitation token is required');
    }
    return this.teamsService.acceptInvitation(organizationId, token, userId);
  }

  /**
   * DELETE /api/teams/:teamId/members/:memberId
   * Remove member from team
   * Requires: OWNER or ADMIN role
   */
  @Delete(':teamId/members/:memberId')
  @UseGuards(TeamRoleGuard)
  @RequireTeamRole(TeamRole.OWNER, TeamRole.ADMIN)
  @HttpCode(204)
  async removeMember(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.teamsService.removeMember(organizationId, teamId, memberId, userId);
  }

  /**
   * PUT /api/teams/:teamId/members/:memberId/role
   * Update member role
   * Requires: OWNER or ADMIN role
   */
  @Put(':teamId/members/:memberId/role')
  @UseGuards(TeamRoleGuard)
  @RequireTeamRole(TeamRole.OWNER, TeamRole.ADMIN)
  async updateMemberRole(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateDto: UpdateTeamMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(organizationId, teamId, memberId, userId, updateDto);
  }

  /**
   * POST /api/teams/:teamId/workflows
   * Create approval workflow
   * Requires: OWNER or ADMIN role
   */
  @Post(':teamId/workflows')
  @UseGuards(TeamRoleGuard)
  @RequireTeamRole(TeamRole.OWNER, TeamRole.ADMIN)
  @HttpCode(201)
  async createWorkflow(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('sub') userId: string,
    @Body() createDto: CreateTeamWorkflowDto,
  ) {
    return this.teamsService.createWorkflow(organizationId, teamId, userId, createDto);
  }

  /**
   * POST /api/teams/:teamId/approvals/submit
   * Submit content for approval
   * Requires: approval:submit permission
   */
  @Post(':teamId/approvals/submit')
  @UseGuards(TeamPermissionGuard)
  @RequireTeamPermission('approval:submit')
  @HttpCode(201)
  async submitForApproval(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('sub') userId: string,
    @Body() submitDto: SubmitForApprovalDto,
  ) {
    return this.teamsService.submitForApproval(organizationId, teamId, userId, submitDto);
  }

  /**
   * GET /api/teams/:teamId/approvals/pending
   * Get pending approvals
   * Requires: approval:approve permission
   */
  @Get(':teamId/approvals/pending')
  @UseGuards(TeamPermissionGuard)
  @RequireTeamPermission('approval:approve')
  async getPendingApprovals(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('sub') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.teamsService.getPendingApprovals(organizationId, teamId, userId, query);
  }

  /**
   * POST /api/teams/:teamId/approvals/:approvalId/respond
   * Respond to approval request
   * Requires: approval:approve permission
   */
  @Post(':teamId/approvals/:approvalId/respond')
  @UseGuards(TeamPermissionGuard)
  @RequireTeamPermission('approval:approve')
  @HttpCode(200)
  async respondToApproval(
    @CurrentOrganization() organizationId: string,
    @Param('teamId') teamId: string,
    @Param('approvalId') approvalId: string,
    @CurrentUser('sub') userId: string,
    @Body() respondDto: RespondToApprovalDto,
  ) {
    return this.teamsService.respondToApproval(organizationId, teamId, approvalId, userId, respondDto);
  }
}
