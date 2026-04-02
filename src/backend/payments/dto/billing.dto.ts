import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SubscriptionTier } from '@prisma/client';
import { PaymentProvider } from '../types/payment.types';
import { BillingCycle } from '../types/billing.types';

export class BillingPreviewDto {
  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedAiTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedApiCalls?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedEmails?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedLeads?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedMessages?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCalls?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedStorageGb?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateBillingProfileDto {
  @IsEmail()
  billingEmail!: string;

  @IsOptional()
  @IsString()
  billingName?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  billingCity?: string;

  @IsOptional()
  @IsString()
  billingState?: string;

  @IsOptional()
  @IsString()
  billingZip?: string;

  @IsOptional()
  @IsString()
  billingCountry?: string;

  @IsOptional()
  @IsString()
  taxId?: string;
}

export class ApplyCouponDto {
  @IsString()
  code!: string;
}

export class CreateManagedSubscriptionDto extends UpdateBillingProfileDto {
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle!: BillingCycle;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsString()
  paymentMethodId!: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateUsageChargeDto {
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}