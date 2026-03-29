/**
 * Tenant Controller
 * API endpoints for tenant management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  InternalServerErrorException,
  Logger,
  Request,
} from '@nestjs/common';
import { TenantService, CreateTenantDto, UpdateTenantDto } from '../services/tenant.service';
import { DomainMappingService, AddDomainDto } from '../services/domain-mapping.service';
import { TenantOnboardingService, OnboardingStepData } from '../services/tenant-onboarding.service';
import { RateLimitService } from '../services/rate-limit.service';
import { UsageTrackingService } from '../services/usage-tracking.service';

/**
 * Admin guard - would verify user is admin
 * For demo, just a placeholder
 */
const AdminGuard = (): any =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    return descriptor;
  };

@Controller('api/tenants')
export class TenantController {
  private readonly logger = new Logger(TenantController.name);

  constructor(
    private readonly tenantService: TenantService,
    private readonly domainMappingService: DomainMappingService,
    private readonly onboardingService: TenantOnboardingService,
    private readonly rateLimitService: RateLimitService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  /**
   * GET /api/tenants
   * List all tenants (admin only)
   */
  @Get()
  @AdminGuard()
  async listTenants(@Query('skip') skip = 0, @Query('take') take = 20) {
    try {
      return await this.tenantService.listTenants(skip, take);
    } catch (error) {
      this.logger.error(`Failed to list tenants: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to list tenants');
    }
  }

  /**
   * POST /api/tenants
   * Create new tenant
   */
  @Post()
  async createTenant(@Body() dto: CreateTenantDto) {
    try {
      const tenant = await this.tenantService.createTenant(dto);

      // Start onboarding
      await this.onboardingService.getOnboardingStatus(tenant.id);

      return {
        success: true,
        tenant,
        onboardingUrl: `/onboard/${tenant.slug}`,
      };
    } catch (error) {
      this.logger.error(`Failed to create tenant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /api/tenants/:id
   * Get tenant details
   */
  @Get(':id')
  async getTenant(@Param('id') id: string) {
    try {
      return await this.tenantService.getTenant(id);
    } catch (error) {
      this.logger.error(`Failed to get tenant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * PUT /api/tenants/:id
   * Update tenant
   */
  @Put(':id')
  async updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    try {
      return await this.tenantService.updateTenant(id, dto);
    } catch (error) {
      this.logger.error(`Failed to update tenant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * DELETE /api/tenants/:id
   * Delete tenant
   */
  @Delete(':id')
  @AdminGuard()
  async deleteTenant(@Param('id') id: string) {
    try {
      await this.tenantService.deleteTenant(id);
      return { success: true, message: 'Tenant deleted' };
    } catch (error) {
      this.logger.error(`Failed to delete tenant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /api/tenants/:id/usage
   * Get tenant usage
   */
  @Get(':id/usage')
  async getTenantUsage(@Param('id') id: string, @Query('month') month?: string) {
    try {
      const usage = month
        ? await this.usageTrackingService.getMonthUsage(id, month)
        : await this.usageTrackingService.getCurrentMonthUsage(id);

      const alerts = await this.usageTrackingService.getUsageAlerts(id);
      const summary = await this.usageTrackingService.getUsageSummary(id);

      return {
        current: usage,
        alerts,
        summary,
      };
    } catch (error) {
      this.logger.error(`Failed to get tenant usage: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /api/tenants/:id/usage/history
   * Get usage history
   */
  @Get(':id/usage/history')
  async getUsageHistory(@Param('id') id: string, @Query('months') months = 12) {
    try {
      return await this.usageTrackingService.getUsageHistory(id, months);
    } catch (error) {
      this.logger.error(`Failed to get usage history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /api/tenants/:id/rate-limits
   * Get rate limit quotas
   */
  @Get(':id/rate-limits')
  async getRateLimits(@Param('id') id: string) {
    try {
      return await this.rateLimitService.getTenantQuotas(id);
    } catch (error) {
      this.logger.error(`Failed to get rate limits: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * PUT /api/tenants/:id/rate-limits
   * Update rate limits
   */
  @Put(':id/rate-limits')
  @AdminGuard()
  async updateRateLimits(@Param('id') id: string, @Body() dto: any) {
    try {
      return await this.rateLimitService.updateQuotas(id, dto);
    } catch (error) {
      this.logger.error(`Failed to update rate limits: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /api/tenants/:id/domains
   * Get tenant domains
   */
  @Get(':id/domains')
  async getTenantDomains(@Param('id') id: string) {
    try {
      return await this.domainMappingService.getTenantDomains(id);
    } catch (error) {
      this.logger.error(`Failed to get tenant domains: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /api/tenants/:id/domains
   * Add domain to tenant
   */
  @Post(':id/domains')
  async addDomain(@Param('id') id: string, @Body() dto: AddDomainDto) {
    try {
      const domain = await this.domainMappingService.addDomain(id, dto);
      return {
        success: true,
        domain,
        nextStep:
          dto.domainType === 'CUSTOM'
            ? `Verify DNS record: ${domain.dnsVerificationRecord}`
            : 'Domain is ready to use',
      };
    } catch (error) {
      this.logger.error(`Failed to add domain: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * PUT /api/tenants/:id/domains/:domainId/primary
   * Set primary domain
   */
  @Put(':id/domains/:domainId/primary')
  async setPrimaryDomain(@Param('id') id: string, @Param('domainId') domainId: string) {
    try {
      await this.domainMappingService.setPrimaryDomain(id, domainId);
      return { success: true, message: 'Primary domain updated' };
    } catch (error) {
      this.logger.error(`Failed to set primary domain: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * DELETE /api/tenants/:id/domains/:domainId
   * Remove domain
   */
  @Delete(':id/domains/:domainId')
  async removeDomain(@Param('id') id: string, @Param('domainId') domainId: string) {
    try {
      await this.domainMappingService.removeDomain(id, domainId);
      return { success: true, message: 'Domain removed' };
    } catch (error) {
      this.logger.error(`Failed to remove domain: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /api/tenants/:id/domains/:domainId/verify
   * Verify custom domain DNS
   */
  @Post(':id/domains/:domainId/verify')
  async verifyDomain(@Param('id') id: string, @Param('domainId') domainId: string) {
    try {
      const verified = await this.domainMappingService.verifyDomainDNS(id, domainId);
      return {
        success: verified,
        verified,
        message: verified ? 'Domain verified successfully' : 'DNS verification failed',
      };
    } catch (error) {
      this.logger.error(`Failed to verify domain: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /api/tenants/:id/onboarding
   * Get onboarding status
   */
  @Get(':id/onboarding')
  async getOnboardingStatus(@Param('id') id: string) {
    try {
      return await this.onboardingService.getOnboardingStatus(id);
    } catch (error) {
      this.logger.error(`Failed to get onboarding status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /api/tenants/:id/onboarding/:step/complete
   * Complete onboarding step
   */
  @Post(':id/onboarding/:step/complete')
  async completeOnboardingStep(
    @Param('id') id: string,
    @Param('step') step: string,
    @Body() data: OnboardingStepData,
  ) {
    try {
      return await this.onboardingService.completeStep(id, step, data);
    } catch (error) {
      this.logger.error(`Failed to complete onboarding step: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /api/tenants/:id/onboarding/:step/skip
   * Skip onboarding step
   */
  @Post(':id/onboarding/:step/skip')
  async skipOnboardingStep(@Param('id') id: string, @Param('step') step: string) {
    try {
      return await this.onboardingService.skipStep(id, step);
    } catch (error) {
      this.logger.error(`Failed to skip onboarding step: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /api/tenants/:id/onboarding/reset
   * Reset onboarding
   */
  @Post(':id/onboarding/reset')
  async resetOnboarding(@Param('id') id: string) {
    try {
      return await this.onboardingService.resetOnboarding(id);
    } catch (error) {
      this.logger.error(`Failed to reset onboarding: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /api/tenants/analytics/onboarding
   * Get onboarding analytics (admin only)
   */
  @Get('analytics/onboarding')
  @AdminGuard()
  async getOnboardingAnalytics() {
    try {
      return await this.onboardingService.getOnboardingAnalytics();
    } catch (error) {
      this.logger.error(`Failed to get onboarding analytics: ${error.message}`, error.stack);
      throw error;
    }
  }
}
