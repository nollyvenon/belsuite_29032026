import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';

/**
 * Team Permission Guard
 * Validates user has required permissions within a team context
 * Always requires teamId in route params: /api/teams/:teamId/...
 *
 * Usage with decorator:
 * @UseGuards(JwtAuthGuard, TenantGuard, TeamPermissionGuard)
 * @RequireTeamPermission('approval:approve')
 * async approveContent() {}
 */
@Injectable()
export class TeamPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'teamPermissions',
      context.getHandler(),
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const organizationId = (request as any).organizationId;
    const { teamId } = request.params;

    if (!teamId) {
      throw new BadRequestException('Team ID (teamId) is required in route params');
    }

    if (!user?.id) {
      throw new ForbiddenException('User context required');
    }

    if (!organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    try {
      // Get team member record to access cached permissions
      const teamMember = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: user.id,
          },
        },
        select: {
          id: true,
          role: true,
          permissions: true,
          team: {
            select: {
              organizationId: true,
              archivedAt: true,
            },
          },
        },
      });

      // User must be member of team
      if (!teamMember) {
        throw new ForbiddenException('User is not a member of this team');
      }

      // Team must not be archived
      if (teamMember.team.archivedAt) {
        throw new ForbiddenException('This team has been archived');
      }

      // Verify team belongs to current organization
      if (teamMember.team.organizationId !== organizationId) {
        throw new ForbiddenException('Team does not belong to current organization');
      }

      // Check if user has required permissions
      const userPermissions = teamMember.permissions as string[];
      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Missing required team permissions: ${requiredPermissions.join(', ')}. Current role: ${teamMember.role}`,
        );
      }

      // Attach team member info to request for use in handlers
      (request as any).teamMember = teamMember;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }

      throw new ForbiddenException('Failed to validate team permissions');
    }
  }
}
