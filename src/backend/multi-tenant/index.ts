/**
 * Multi-Tenant Module - Barrel Export
 * Exports all services, controllers, and middleware
 */

// Middleware
export { TenantMiddleware } from './middleware/tenant.middleware';

// Services
export { TenantService } from './services/tenant.service';
export type { CreateTenantDto, UpdateTenantDto } from './services/tenant.service';
export { DomainMappingService } from './services/domain-mapping.service';
export type { AddDomainDto, DomainMappingResult } from './services/domain-mapping.service';
export { RateLimitService } from './services/rate-limit.service';
export type { RateLimitCheckResult, UpdateRateLimitDto } from './services/rate-limit.service';
export {
  TenantOnboardingService,
} from './services/tenant-onboarding.service';
export type { OnboardingStepData, OnboardingStatus } from './services/tenant-onboarding.service';
export { UsageTrackingService } from './services/usage-tracking.service';
export type { UsageMetrics, UsageAlert } from './services/usage-tracking.service';

// Controllers
export { TenantController } from './controllers/tenant.controller';

// Module
export { MultiTenantModule } from './multi-tenant.module';

// Guards & Decorators (re-exported for convenience)
export { TenantRateLimitGuard, RateLimit } from '../common/guards/tenant-rate-limit.guard';
export type { RateLimitMeta } from '../common/guards/tenant-rate-limit.guard';
export { CurrentTenant, Tenant } from '../common/decorators/tenant.decorator';
export type { TenantContext } from '../common/decorators/tenant.decorator';
