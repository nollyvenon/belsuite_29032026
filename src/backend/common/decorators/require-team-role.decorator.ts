import { SetMetadata } from '@nestjs/common';
import { TeamRole } from '@prisma/client';

/**
 * Decorator: Require Team Role
 * Specifies which team roles are required for an endpoint
 * Used with TeamRoleGuard
 *
 * Usage:
 * @RequireTeamRole(TeamRole.OWNER, TeamRole.ADMIN)
 * async updateTeamSettings() {}
 *
 * Multiple roles = ANY required (OR logic)
 * Use when only role-level access control is needed
 *
 * Available roles:
 * - OWNER: Full control of team
 * - ADMIN: Administrative privileges
 * - EDITOR: Can create and publish content
 * - CONTRIBUTOR: Can create content (needs approval to publish)
 * - APPROVER: Can review and approve content only
 * - VIEWER: Read-only access
 */
export const RequireTeamRole = (...roles: TeamRole[]) =>
  SetMetadata('teamRoles', roles);
