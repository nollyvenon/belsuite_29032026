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
import { TeamRole } from '@prisma/client';

/**
 * Team Role Guard
 * Validates user has one of the required roles within a team
 * Always requires teamId in route params: /api/teams/:teamId/...
 * Used for role-level access control (OWNER, ADMIN only) vs permission-level
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, TenantGuard, TeamRoleGuard)
 * @RequireTeamRole(TeamRole.OWNER, TeamRole.ADMIN)
 * async updateTeam() {}
 */
@Injectable()
export class TeamRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<TeamRole[]>(
      'teamRoles',
      context.getHandler(),
    );

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
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
      // Get team member record with role
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

      // Check if user has one of the required roles
      const hasRole = requiredRoles.includes(teamMember.role as TeamRole);

      if (!hasRole) {
        throw new ForbiddenException(
          `Insufficient team role. Required: ${requiredRoles.join(', ')}. Current role: ${teamMember.role}`,
        );
      }

      // Attach team member info to request for use in handlers
      (request as any).teamMember = teamMember;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }

      throw new ForbiddenException('Failed to validate team role');
    }
  }
}
