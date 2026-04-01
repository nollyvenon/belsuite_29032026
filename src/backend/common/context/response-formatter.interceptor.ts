/**
 * Global Response Formatter Interceptor
 * Ensures all API responses follow a consistent format
 * Adds metadata like correlation IDs, timestamps, etc.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RequestContextService } from './index';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  /**
   * HTTP status code
   */
  status: number;

  /**
   * Success indicator
   */
  success: boolean;

  /**
   * Response data
   */
  data?: T;

  /**
   * Error message (if applicable)
   */
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };

  /**
   * Response metadata
   */
  meta: {
    /**
     * Correlation ID for tracing
     */
    correlationId: string;

    /**
     * Tenant ID
     */
    tenantId?: string;

    /**
     * Response timestamp
     */
    timestamp: string;

    /**
     * Response duration in milliseconds
     */
    duration: number;

    /**
     * API version
     */
    version?: string;
  };
}

@Injectable()
export class ResponseFormatterInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseFormatterInterceptor.name);

  constructor(private readonly contextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.getArgByIndex<Request>(0);
    const response = context.getArgByIndex<Response>(1);

    return next.handle().pipe(
      map((data: any) => {
        const context = this.contextService.getContext();
        const statusCode = response.statusCode || 200;

        const formattedResponse: ApiResponse = {
          status: statusCode,
          success: statusCode >= 200 && statusCode < 300,
          data: data,
          meta: {
            correlationId: context?.correlationId || 'unknown',
            tenantId: context?.tenantId,
            timestamp: new Date().toISOString(),
            duration: this.contextService.getRequestDuration(),
            version: process.env['API_VERSION'] || '1.0.0',
          },
        };

        this.logger.debug(
          `Response formatted: ${request.method} ${request.path} (${statusCode}, ${formattedResponse.meta.duration}ms)`,
        );

        return formattedResponse;
      }),
    );
  }
}

/**
 * Error response formatter
 * Note: This is handled by GlobalExceptionFilter, but we include this for completeness
 */
export function formatErrorResponse(
  statusCode: number,
  error: any,
  correlationId: string,
  tenantId?: string,
): ApiResponse {
  return {
    status: statusCode,
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An error occurred',
      details: error.details,
    },
    meta: {
      correlationId,
      tenantId,
      timestamp: new Date().toISOString(),
      duration: 0,
      version: process.env['API_VERSION'] || '1.0.0',
    },
  };
}
