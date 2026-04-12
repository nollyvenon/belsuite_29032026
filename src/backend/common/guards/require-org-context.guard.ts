import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Ensures the authenticated user has a non-empty organization id.
 * Prevents Prisma errors from `organizationId: undefined` / empty string on org-scoped queries.
 */
@Injectable()
export class RequireOrgContextGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: { orgId?: string } }>();
    const orgId = req.user?.orgId;
    if (orgId === undefined || orgId === null || String(orgId).trim() === '') {
      throw new BadRequestException(
        'No active organization on your session. Select or join an organization, then try again.',
      );
    }
    return true;
  }
}
