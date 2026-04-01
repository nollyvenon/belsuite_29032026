/**
 * Request Context Service
 * Propagates request context (tenant, user, correlation ID) through the entire request lifecycle
 * Uses AsyncLocalStorage for thread-safe context management
 */

import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Context that flows through the entire request
 */
export interface RequestContext {
  /**
   * Unique correlation ID for distributed tracing
   */
  correlationId: string;

  /**
   * Tenant ID (organization)
   */
  tenantId: string;

  /**
   * Current user ID
   */
  userId?: string;

  /**
   * User's email
   */
  userEmail?: string;

  /**
   * User's roles
   */
  roles?: string[];

  /**
   * API key used (if authenticated via API key instead of JWT)
   */
  apiKeyId?: string;

  /**
   * Request start time
   */
  startTime: Date;

  /**
   * Request method (GET, POST, etc.)
   */
  method?: string;

  /**
   * Request path
   */
  path?: string;

  /**
   * Request IP address
   */
  ip?: string;

  /**
   * User agent
   */
  userAgent?: string;

  /**
   * Custom metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Service for managing request context using AsyncLocalStorage
 * Each request gets its own isolated context throughout the request lifecycle
 */
@Injectable()
export class RequestContextService {
  private readonly logger = new Logger(RequestContextService.name);

  /**
   * AsyncLocalStorage for storing context per request
   * This ensures context doesn't leak between concurrent requests
   */
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  /**
   * Set context for current request
   * This should be called in a middleware or guard that runs early in the request pipeline
   */
  setContext(context: RequestContext): void {
    this.asyncLocalStorage.enterWith(context);
    this.logger.debug(
      `Context set: tenantId=${context.tenantId}, userId=${context.userId}, correlationId=${context.correlationId}`,
    );
  }

  /**
   * Get current request context
   * Safe to call from anywhere in the request lifecycle
   */
  getContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Get a specific context field
   */
  getContextField<K extends keyof RequestContext>(
    field: K,
  ): RequestContext[K] | undefined {
    const context = this.getContext();
    return context?.[field];
  }

  /**
   * Get tenant ID from context
   */
  getTenantId(): string | undefined {
    return this.getContextField('tenantId');
  }

  /**
   * Get user ID from context
   */
  getUserId(): string | undefined {
    return this.getContextField('userId');
  }

  /**
   * Get correlation ID from context
   */
  getCorrelationId(): string | undefined {
    return this.getContextField('correlationId');
  }

  /**
   * Get user roles from context
   */
  getUserRoles(): string[] | undefined {
    return this.getContextField('roles');
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    return roles?.includes(role) ?? false;
  }

  /**
   * Check if context exists and is valid
   */
  isContextValid(): boolean {
    const context = this.getContext();
    return !!context?.tenantId && !!context?.correlationId;
  }

  /**
   * Update a specific context field
   */
  updateContextField<K extends keyof RequestContext>(
    field: K,
    value: RequestContext[K],
  ): void {
    const context = this.getContext();
    if (context) {
      context[field] = value;
    }
  }

  /**
   * Add metadata to context
   */
  addMetadata(key: string, value: any): void {
    const context = this.getContext();
    if (context) {
      if (!context.metadata) {
        context.metadata = {};
      }
      context.metadata[key] = value;
    }
  }

  /**
   * Get metadata value
   */
  getMetadata(key: string): any {
    const context = this.getContext();
    return context?.metadata?.[key];
  }

  /**
   * Get request duration in milliseconds
   */
  getRequestDuration(): number {
    const context = this.getContext();
    if (!context) return 0;
    return Date.now() - context.startTime.getTime();
  }

  /**
   * Clear context (called at end of request)
   */
  clearContext(): void {
    const context = this.getContext();
    if (context) {
      this.logger.debug(
        `Context cleared: correlationId=${context.correlationId}, duration=${this.getRequestDuration()}ms`,
      );
    }
  }
}
