/**
 * Multi-Tenant Module - Barrel Export
 * Exports all services, controllers, and middleware
 */

// Middleware
export { TenantMiddleware } from './middleware/tenant.middleware';

// Services
export { TenantService, CreateTenantDto, UpdateTenantDto } from './services/tenant.service';
export { DomainMappingService, AddDomainDto, DomainMappingResult } from './services/domain-mapping.service';
export { RateLimitService, RateLimitCheckResult, UpdateRateLimitDto } from './services/rate-limit.service';
export {
  TenantOnboardingService,
  OnboardingStepData,
  OnboardingStatus,
} from './services/tenant-onboarding.service';
export { UsageTrackingService, UsageMetrics, UsageAlert } from './services/usage-tracking.service';

// Controllers
export { TenantController } from './controllers/tenant.controller';

// Module
export { MultiTenantModule } from './multi-tenant.module';

// Guards & Decorators (re-exported for convenience)
export { TenantRateLimitGuard, RateLimit, RateLimitMeta } from '../common/guards/tenant-rate-limit.guard';
export { CurrentTenant, TenantContext, Tenant } from '../common/decorators/tenant.decorator';
