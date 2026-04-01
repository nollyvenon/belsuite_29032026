import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './services/billing.service';
import {
  ApplyCouponDto,
  BillingPreviewDto,
  CreateManagedSubscriptionDto,
  CreateUsageChargeDto,
  UpdateBillingProfileDto,
} from './dto/billing.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('api/v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  async getPlans() {
    return {
      success: true,
      data: await this.billingService.getPlans(),
    };
  }

  @Get('coupons')
  async getCoupons() {
    return {
      success: true,
      data: this.billingService.getCoupons(),
    };
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getOverview(@Tenant() organizationId: string) {
    return {
      success: true,
      data: await this.billingService.getOverview(organizationId),
    };
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getUsage(@Tenant() organizationId: string) {
    const overview = await this.billingService.getOverview(organizationId);
    return {
      success: true,
      data: overview.usage,
    };
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async previewBilling(
    @Tenant() organizationId: string,
    @Body() dto: BillingPreviewDto,
  ) {
    return {
      success: true,
      data: await this.billingService.previewQuote(organizationId, dto),
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async updateBillingProfile(
    @Tenant() organizationId: string,
    @Body() dto: UpdateBillingProfileDto,
  ) {
    return {
      success: true,
      data: await this.billingService.updateBillingProfile(organizationId, dto),
    };
  }

  @Post('coupons/apply')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async applyCoupon(
    @Tenant() organizationId: string,
    @Body() dto: ApplyCouponDto,
  ) {
    const coupon = await this.billingService.applyCoupon(organizationId, dto.code);
    if (!coupon) {
      throw new BadRequestException('Coupon could not be applied');
    }

    return {
      success: true,
      data: coupon,
    };
  }

  @Delete('coupons/active')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async clearCoupon(@Tenant() organizationId: string) {
    return {
      success: true,
      data: await this.billingService.clearCoupon(organizationId),
    };
  }

  @Post('subscriptions/checkout')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createManagedSubscription(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateManagedSubscriptionDto,
  ) {
    return {
      success: true,
      data: await this.billingService.createManagedSubscription(organizationId, userId, dto),
    };
  }

  @Post('usage/charge')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createUsageCharge(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateUsageChargeDto,
  ) {
    return {
      success: true,
      data: await this.billingService.createUsageCharge(organizationId, userId, dto),
    };
  }
}