/**
 * Common Module
 * Provides shared infrastructure, utilities, and services used across all modules
 * This is a "barrel" export module that consolidates all common functionality
 */

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

// Request context
import {
  RequestContextService,
  RequestContextMiddleware,
  ResponseFormatterInterceptor,
  RequestContextAlsInterceptor,
} from './context';

// Event bus
import { EventBus } from './events';

// Resilience patterns
import { CircuitBreakerManager } from './resilience';

// Pipes
import { GlobalValidationPipe } from './pipes';

/**
 * Common Module
 * Provides cross-cutting concerns and infrastructure for the entire application
 */
@Module({
  providers: [
    // Request context
    RequestContextService,

    // Event bus
    EventBus,

    // Resilience
    CircuitBreakerManager,

    // Global interceptor for response formatting
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseFormatterInterceptor,
    },
    // Outermost: binds ALS for the full handler + downstream interceptors (registered after = runs first)
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextAlsInterceptor,
    },

    // Global pipe for validation
    {
      provide: APP_PIPE,
      useClass: GlobalValidationPipe,
    },
  ],
  exports: [RequestContextService, EventBus, CircuitBreakerManager],
})
export class CommonModule implements NestModule {
  /**
   * Apply request context middleware globally
   * This must happen before any guards or route handlers
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}

// Re-export all public APIs for easy access
export * from './context';
export * from './events';
export * from './resilience';
export * from './pipes';
