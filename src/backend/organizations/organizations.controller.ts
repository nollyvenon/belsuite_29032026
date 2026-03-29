import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CreateOrganizationDto, UpdateOrganizationDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/organization.dto';

@Controller('api/organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  /**
   * POST /api/organizations
   * Create new organization
   */
  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createDto: CreateOrganizationDto,
  ) {
    return this.organizationsService.createOrganization(userId, createDto);
  }

  /**
   * GET /api/organizations/:organizationId
   * Get organization details
   */
  @Get(':organizationId')
  @UseGuards(TenantGuard)
  async getOrganization(
    @Param('organizationId') organizationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.organizationsService.getOrganization(organizationId, userId);
  }

  /**
   * PUT /api/organizations/:organizationId
   * Update organization
   */
  @Put(':organizationId')
  @UseGuards(TenantGuard)
  async update(
    @Param('organizationId') organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(
      organizationId,
      userId,
      updateDto,
    );
  }

  /**
   * POST /api/organizations/:organizationId/invitations
   * Invite member to organization
   */
  @Post(':organizationId/invitations')
  @UseGuards(TenantGuard)
  async inviteMember(
    @Param('organizationId') organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() inviteDto: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(
      organizationId,
      userId,
      inviteDto,
    );
  }

  /**
   * POST /api/organizations/invitations/:token/accept
   * Accept organization invitation
   */
  @Post('invitations/:token/accept')
  @HttpCode(200)
  async acceptInvitation(
    @Param('token') token: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.organizationsService.acceptInvitation(token, userId);
  }

  /**
   * PUT /api/organizations/:organizationId/members/:memberId/role
   * Update member role
   */
  @Put(':organizationId/members/:memberId/role')
  @UseGuards(TenantGuard)
  async updateMemberRole(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateDto: UpdateMemberRoleDto,
  ) {
    return this.organizationsService.updateMemberRole(
      organizationId,
      userId,
      memberId,
      updateDto,
    );
  }
}
