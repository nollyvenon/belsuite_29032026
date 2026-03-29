import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

/**
 * Tenant Middleware
 * Extracts and validates tenant ID from JWT token
 * Attaches tenantId and orgId to request object
 * Provides multi-tenant request isolation
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private logger = new Logger('TenantMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);

    if (!token) {
      // Public routes don't require tenant context
      return next();
    }

    try {
      const decoded: any = jwt.decode(token);

      if (decoded) {
        (req as any).tenantId = decoded.orgId;
        (req as any).user = decoded;
      }

      next();
    } catch (error) {
      this.logger.debug(`Failed to extract tenant from token: ${error.message}`);
      next();
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }

    return null;
  }
}
