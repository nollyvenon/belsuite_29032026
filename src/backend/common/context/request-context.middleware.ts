/**
 * Request Context Middleware
 * Injects correlation ID, tenant ID, and other context into every request
 * Must be applied early in the middleware stack
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService, RequestContext } from './request-context.service';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Generate or extract correlation ID
    const correlationId = this.extractCorrelationId(req);

    // Extract tenant ID (from header, JWT, or query param)
    const tenantId = this.extractTenantId(req);

    // Extract user ID (from JWT payload after auth guard)
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const roles = (req as any).user?.roles;

    // Create context
    if (tenantId) {
      const context: RequestContext = {
        correlationId,
        tenantId,
        userId,
        userEmail,
        roles,
        startTime: new Date(),
        method: req.method,
        path: req.path,
        ip: this.getClientIp(req),
        userAgent: req.get('user-agent'),
      };

      // Set context in service
      this.contextService.setContext(context);

      // Add to request for access in controllers/services
      (req as any).context = context;

      // Add correlation ID and tenant ID to response headers
      res.setHeader('X-Correlation-ID', correlationId);
      res.setHeader('X-Tenant-ID', tenantId);

      this.logger.debug(
        `Request context created: ${req.method} ${req.path} (correlation: ${correlationId}, tenant: ${tenantId}, user: ${userId})`,
      );
    } else {
      this.logger.warn(
        `Request without tenant ID: ${req.method} ${req.path} (this may be a public endpoint)`,
      );
    }

    // Hook into response finish to log metrics
    res.on('finish', () => {
      const duration = this.contextService.getRequestDuration();
      this.logger.debug(
        `Request completed: ${req.method} ${req.path} (${res.statusCode}, ${duration}ms)`,
      );
    });

    next();
  }

  /**
   * Extract or generate correlation ID
   * Priority: X-Correlation-ID header → X-Request-ID header → B3 header → generate new
   */
  private extractCorrelationId(req: Request): string {
    const correlationId =
      req.get('X-Correlation-ID') ||
      req.get('X-Request-ID') ||
      req.get('X-B3-TraceId') ||
      uuidv4();

    return correlationId;
  }

  /**
   * Extract tenant ID from request
   * Priority: X-Tenant-ID header → tenantId query param → JWT claim
   */
  private extractTenantId(req: Request): string {
    const tenantId =
      req.get('X-Tenant-ID') ||
      req.query.tenantId as string ||
      (req as any).user?.tenantId;

    return tenantId;
  }

  /**
   * Get client IP address (considers proxies)
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}
