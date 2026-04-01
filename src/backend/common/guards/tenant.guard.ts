import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Tenant Guard
 * Ensures user belongs to the requested organization
 * Prevents cross-tenant access
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const requestedTenantId = request.params.organizationId || (request as any).tenantId;

    if (!user?.orgId || !requestedTenantId) {
      throw new ForbiddenException('Tenant information missing');
    }

    if (user.orgId !== requestedTenantId) {
      throw new ForbiddenException('Access denied: Invalid organization');
    }

    return true;
  }
}
