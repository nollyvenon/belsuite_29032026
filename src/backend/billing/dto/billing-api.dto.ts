import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { SubscriptionTier, UsageFeature } from '@prisma/client';
import { PaymentProvider } from '../../payments/types/payment.types';

export class MeterUsageDto {
  @IsEnum(UsageFeature)
  feature!: UsageFeature;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inputTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  outputTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  videoMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  imageCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  smsCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  emailCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  storageGb?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  apiCalls?: number;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsBoolean()
  softFail?: boolean;
}

export class EstimateCostDto {
  @IsEnum(UsageFeature)
  feature!: UsageFeature;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inputTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  outputTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  videoMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  imageCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  smsCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  emailCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  storageGb?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  apiCalls?: number;
}

export class StripeCheckoutDto {
  @IsString()
  email!: string;

  @IsString()
  @IsOptional()
  priceId?: string;

  @IsString()
  @IsOptional()
  bundleId?: string;

  @IsUrl()
  successUrl!: string;

  @IsUrl()
  cancelUrl!: string;
}

export class ProviderCheckoutDto {
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  bundleId?: string;

  @IsOptional()
  @IsString()
  priceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountUsd?: number;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsUrl()
  successUrl!: string;

  @IsUrl()
  cancelUrl!: string;
}

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsEnum(SubscriptionTier)
  tier!: SubscriptionTier;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  pricePerMonth!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerYear?: number;

  @IsNumber()
  @Min(1)
  maxMembers!: number;

  @IsNumber()
  @Min(1)
  maxProjects!: number;

  @IsNumber()
  @Min(0)
  maxStorageGB!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}

export class UpsertPricingRuleDto {
  @IsEnum(UsageFeature)
  feature!: UsageFeature;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerInputToken?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerOutputToken?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerVideoMinute?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerImage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerSms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerEmail?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerStorageGbDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerApiCall?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  providerCostPerInputToken?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  providerCostPerOutputToken?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  providerCostPerVideoMinute?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  providerCostPerImage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marginPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marginFixed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerUsd?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SetGlobalRateDto {
  @IsNumber()
  @Min(1)
  creditsPerUsd!: number;
}

export class SetMarginDto {
  @IsNumber()
  @Min(0)
  marginPct!: number;
}

export class CreateBundleDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  credits!: number;

  @IsNumber()
  @Min(0)
  priceUsd!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusCredits?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  stripePriceId?: string;
}

export class DateRangeQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

