import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingApiService } from './services/billing-api.service';
import {
  CreateBundleDto,
  CreatePlanDto,
  DateRangeQueryDto,
  EstimateCostDto,
  MeterUsageDto,
  SetGlobalRateDto,
  SetMarginDto,
  ProviderCheckoutDto,
  StripeCheckoutDto,
  UpsertPricingRuleDto,
} from './dto/billing-api.dto';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('api/v1/credit-billing')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CreditBillingController {
  constructor(private readonly billingService: BillingApiService) {}

  @Post('usage/meter')
  async meterUsage(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: MeterUsageDto,
  ) {
    const result = await this.billingService.meterUsage(organizationId, userId, dto, dto.softFail ?? false);
    return { success: true, data: result };
  }

  @Post('usage/estimate')
  async estimateCost(@Body() dto: EstimateCostDto) {
    const result = await this.billingService.estimateCost(dto);
    return { success: true, data: result };
  }

  @Get('usage/logs')
  async usageLogs(
    @Tenant() organizationId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const logs = await this.billingService.getUsageLogs(organizationId, limit ?? 50);
    return { success: true, data: logs };
  }

  @Get('usage/summary')
  async usageSummary(
    @Tenant() organizationId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    const { from, to } = parseDateRange(query.from, query.to);
    const result = await this.billingService.getUsageSummary(organizationId, from, to);
    return { success: true, data: result };
  }

  @Get('usage/models')
  async usageModels(
    @Tenant() organizationId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    const { from, to } = parseDateRange(query.from, query.to);
    const result = await this.billingService.getUsageModelBreakdown(organizationId, from, to);
    return { success: true, data: result };
  }

  @Get('credits/balance')
  async creditBalance(@Tenant() organizationId: string) {
    return { success: true, data: await this.billingService.getCreditBalance(organizationId) };
  }

  @Get('credits/transactions')
  async creditTransactions(
    @Tenant() organizationId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return {
      success: true,
      data: await this.billingService.getCreditTransactions(organizationId, limit ?? 50),
    };
  }

  @Post('credits/checkout')
  async createCreditCheckout(
    @Tenant() organizationId: string,
    @Body() dto: StripeCheckoutDto,
  ) {
    return { success: true, data: await this.billingService.createCreditCheckout(organizationId, dto) };
  }

  @Post('checkout')
  async createProviderCheckout(
    @Tenant() organizationId: string,
    @Body() dto: ProviderCheckoutDto,
  ) {
    return { success: true, data: await this.billingService.createProviderCheckout(organizationId, dto) };
  }

  @Post('subscriptions/checkout')
  async createSubscriptionCheckout(
    @Tenant() organizationId: string,
    @Body() dto: StripeCheckoutDto,
  ) {
    return { success: true, data: await this.billingService.createSubscriptionCheckout(organizationId, dto) };
  }

  @Get('subscriptions/current')
  async getSubscription(@Tenant() organizationId: string) {
    return { success: true, data: await this.billingService.listSubscriptions(organizationId) };
  }

  @Post('subscriptions/cancel')
  async cancelSubscription(@Tenant() organizationId: string) {
    return { success: true, data: await this.billingService.cancelSubscription(organizationId) };
  }

  @Post('subscriptions/allocate-plan-credits')
  async allocatePlanCredits(@Tenant() organizationId: string) {
    return { success: true, data: await this.billingService.allocatePlanCredits(organizationId) };
  }

  @Get('plans')
  async plans() {
    return { success: true, data: await this.billingService.listPlans() };
  }

  @Get('provider-capabilities')
  async providerCapabilities() {
    return { success: true, data: this.billingService.getProviderCapabilities() };
  }

  @Post('admin/plans')
  async upsertPlan(@Body() dto: CreatePlanDto) {
    return { success: true, data: await this.billingService.upsertPlan(dto) };
  }

  @Get('bundles')
  async bundles() {
    return { success: true, data: await this.billingService.listBundles() };
  }

  @Post('admin/bundles')
  async createBundle(@Body() dto: CreateBundleDto) {
    return { success: true, data: await this.billingService.createBundle(dto) };
  }

  @Get('admin/pricing/rules')
  async listPricingRules() {
    return { success: true, data: await this.billingService.listPricingRules() };
  }

  @Post('admin/pricing/rules')
  async upsertPricingRule(@Body() dto: UpsertPricingRuleDto) {
    return { success: true, data: await this.billingService.upsertPricingRule(dto) };
  }

  @Post('admin/pricing/global-rate')
  async setGlobalRate(@Body() dto: SetGlobalRateDto) {
    return { success: true, data: await this.billingService.setGlobalRate(dto.creditsPerUsd) };
  }

  @Post('admin/pricing/default-margin')
  async setDefaultMargin(@Body() dto: SetMarginDto) {
    return { success: true, data: await this.billingService.setDefaultMargin(dto.marginPct) };
  }

  @Get('admin/margins/report')
  async marginReport(@Query() query: DateRangeQueryDto) {
    const { from, to } = parseDateRange(query.from, query.to);
    return { success: true, data: await this.billingService.marginReport(from, to) };
  }

  @Post('admin/pricing/rules/:id/delete')
  async deleteRule(@Param('id') id: string) {
    return { success: true, data: await this.billingService.deletePricingRule(id) };
  }

  @Post('stripe/webhook')
  @Public()
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    const raw = (req as any).rawBody ?? JSON.stringify(req.body ?? {});
    return { success: true, data: await this.billingService.handleStripeWebhook(signature, raw) };
  }

  @Post('paystack/webhook')
  @Public()
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: Request,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing x-paystack-signature header');
    }
    const raw = (req as any).rawBody ?? JSON.stringify(req.body ?? {});
    return { success: true, data: await this.billingService.handlePaystackWebhook(signature, raw) };
  }

  @Post('mpesa/callback')
  @Public()
  async mpesaCallback(@Body() payload: any) {
    return { success: true, data: await this.billingService.handleMpesaCallback(payload) };
  }

  @Post('crypto/webhook')
  @Public()
  async cryptoWebhook(
    @Headers('x-cc-webhook-signature') signature: string,
    @Req() req: Request,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing x-cc-webhook-signature header');
    }
    const raw = (req as any).rawBody ?? JSON.stringify(req.body ?? {});
    return { success: true, data: await this.billingService.handleCryptoWebhook(signature, raw) };
  }

  @Post('sofort/webhook')
  @Public()
  async sofortWebhook(
    @Headers('x-sofort-signature') signature: string,
    @Req() req: Request,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing x-sofort-signature header');
    }
    const raw = (req as any).rawBody ?? JSON.stringify(req.body ?? {});
    return { success: true, data: await this.billingService.handleSofortWebhook(signature, raw) };
  }
}

function parseDateRange(from?: string, to?: string) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = to ? new Date(to) : now;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new BadRequestException('Invalid date range');
  }
  return { from: start, to: end };
}
