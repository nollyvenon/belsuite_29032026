import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extracts tenant ID from request (set by TenantMiddleware).
 * Usage: @Tenant() tenantId: string
 */
export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as any).tenantId;
  },
);

/**
 * Full tenant context (id, slug, name, tier, organizationId) resolved by TenantMiddleware.
 * Usage: @CurrentTenant() tenant: TenantContext
 */
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  tier: string;
  organizationId: string;
}

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as any).tenant;
  },
);
