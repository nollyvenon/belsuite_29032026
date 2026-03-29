import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Tenant Guard
 * Ensures user belongs to the requested organization
 * Prevents cross-tenant access
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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
