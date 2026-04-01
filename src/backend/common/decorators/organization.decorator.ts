import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extracts organization ID from JWT token or request
 * Priority: request.organizationId -> user.orgId -> from request params
 * Usage: @CurrentOrganization() organizationId: string
 */
export const CurrentOrganization = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    
    // Check request.organizationId (set by middleware)
    if ((request as any).organizationId) {
      return (request as any).organizationId;
    }

    // Check user JWT payload
    const user = (request as any).user;
    if (user?.orgId) {
      return user.orgId;
    }

    // Check request params
    if (ctx.switchToHttp().getRequest<Request>().params?.organizationId) {
      return ctx.switchToHttp().getRequest<Request>().params.organizationId;
    }

    throw new Error('Organization ID not found in request');
  },
);
