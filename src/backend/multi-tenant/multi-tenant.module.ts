/**
 * Multi-Tenant Module
 * NestJS module for multi-tenant functionality
 * Wires together all services, controllers, and middleware
 */

import { Module, NestModule, MiddlewareConsumer, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// Middleware
import { TenantMiddleware } from './middleware/tenant.middleware';

// Services
import { TenantService } from './services/tenant.service';
import { DomainMappingService } from './services/domain-mapping.service';
import { RateLimitService } from './services/rate-limit.service';
import { TenantOnboardingService } from './services/tenant-onboarding.service';
import { UsageTrackingService } from './services/usage-tracking.service';

// Controllers
import { TenantController } from './controllers/tenant.controller';

// Database
import { PrismaService } from '../database/prisma.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    PrismaService,
    TenantService,
    DomainMappingService,
    RateLimitService,
    TenantOnboardingService,
    UsageTrackingService,
  ],
  controllers: [TenantController],
  exports: [
    TenantService,
    DomainMappingService,
    RateLimitService,
    TenantOnboardingService,
    UsageTrackingService,
  ],
})
export class MultiTenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
