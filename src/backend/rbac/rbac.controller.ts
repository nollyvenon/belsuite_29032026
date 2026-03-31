/**
 * RBAC Controller
 * Role and permission management endpoints scoped to an organization.
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  IsString,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

interface AuthUser {
  id: string;
  orgId: string;
  permissions: string[];
}

@Controller('api/rbac')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ── Roles ────────────────────────────────────────────────────────────────

  /** GET /api/rbac/roles — list all roles for the user's organization */
  @Get('roles')
  async listRoles(@CurrentUser() user: AuthUser) {
    return this.rbacService.getOrganizationRoles(user.orgId);
  }

  /** POST /api/rbac/roles — create a custom role */
  @Post('roles')
  async createRole(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; description?: string },
  ) {
    return this.rbacService.createRole(user.orgId, user.id, body.name, body.description);
  }

  // ── Permissions ───────────────────────────────────────────────────────────

  /** POST /api/rbac/roles/:roleId/permissions — add permission to role */
  @Post('roles/:roleId/permissions')
  async addPermission(
    @CurrentUser() user: AuthUser,
    @Param('roleId') roleId: string,
    @Body() body: { action: string; resource: string },
  ) {
    return this.rbacService.addPermissionToRole(
      user.orgId, user.id, roleId, body.action, body.resource,
    );
  }

  /** DELETE /api/rbac/roles/:roleId/permissions/:permissionId */
  @Delete('roles/:roleId/permissions/:permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePermission(
    @CurrentUser() user: AuthUser,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.rbacService.removePermissionFromRole(
      user.orgId, user.id, roleId, permissionId,
    );
  }

  // ── User permissions ──────────────────────────────────────────────────────

  /** GET /api/rbac/me/permissions — current user's resolved permission strings */
  @Get('me/permissions')
  async myPermissions(@CurrentUser() user: AuthUser) {
    const permissions = await this.rbacService.getUserPermissions(user.id, user.orgId);
    return { permissions };
  }

  /** GET /api/rbac/users/:userId/permissions */
  @Get('users/:userId/permissions')
  async userPermissions(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    const permissions = await this.rbacService.getUserPermissions(userId, user.orgId);
    return { permissions };
  }
}
