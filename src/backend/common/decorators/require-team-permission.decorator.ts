import { SetMetadata } from '@nestjs/common';

/**
 * Decorator: Require Team Permissions
 * Specifies which team permissions are required for an endpoint
 * Used with TeamPermissionGuard
 *
 * Usage:
 * @RequireTeamPermission('approval:approve', 'approval:submit')
 * async submitForApproval() {}
 *
 * Multiple permissions = ANY required (OR logic)
 * For AND logic, chain multiple decorators or use custom logic
 *
 * Common team permissions:
 * - team:create, team:read, team:update, team:delete
 * - team:manage_members, team:manage_workflows, team:manage_approvals
 * - content:create, content:read, content:update, content:delete
 * - content:publish
 * - approval:submit, approval:approve
 * - team:view_audit
 */
export const RequireTeamPermission = (...permissions: string[]) =>
  SetMetadata('teamPermissions', permissions);
