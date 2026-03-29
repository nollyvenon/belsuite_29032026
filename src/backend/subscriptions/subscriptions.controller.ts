import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('api/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  /**
   * GET /api/subscriptions/plans
   * Get available billing plans
   */
  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  /**
   * GET /api/organizations/:organizationId/subscription
   * Get subscription for organization
   */
  @Get('organizations/:organizationId/subscription')
  @UseGuards(TenantGuard)
  async getSubscription(@Param('organizationId') organizationId: string) {
    return this.subscriptionsService.getSubscription(organizationId);
  }

  /**
   * POST /api/organizations/:organizationId/subscription
   * Create subscription
   */
  @Post('organizations/:organizationId/subscription')
  @UseGuards(TenantGuard)
  async createSubscription(
    @Param('organizationId') organizationId: string,
    @Body() body: { planId: string; billingProfileId: string },
  ) {
    return this.subscriptionsService.createSubscription(
      organizationId,
      body.planId,
      body.billingProfileId,
    );
  }

  /**
   * GET /api/organizations/:organizationId/invoices
   * Get organization invoices
   */
  @Get('organizations/:organizationId/invoices')
  @UseGuards(TenantGuard)
  async getInvoices(
    @Param('organizationId') organizationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.subscriptionsService.getInvoices(organizationId);
  }
}
