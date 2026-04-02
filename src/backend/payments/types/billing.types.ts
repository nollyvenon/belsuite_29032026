import { SubscriptionTier } from '@prisma/client';
import { PaymentProvider } from './payment.types';

export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type CouponScope = 'SUBSCRIPTION' | 'USAGE' | 'ALL';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface BillingUsagePricing {
  aiOveragePer1kTokens: number;
  apiOveragePer1kRequests: number;
  emailOveragePer1k: number;
  leadOveragePerLead: number;
  messageOveragePerMessage: number;
  callOveragePerCall: number;
  storageOveragePerGb: number;
}

export interface BillingPlanDefinition {
  tier: SubscriptionTier;
  name: string;
  description: string;
  pricePerMonth: number;
  pricePerYear: number;
  trialDays: number;
  requestsPerMinute: number;
  includedAiTokens: number;
  includedLeads: number;
  includedMessages: number;
  includedCalls: number;
  payAsYouGoEnabled: boolean;
  maxMembers: number;
  maxProjects: number;
  maxStorageGB: number;
  features: string[];
  usagePricing: BillingUsagePricing;
  supportedProviders: PaymentProvider[];
  providerPriceIds: Partial<Record<PaymentProvider, Partial<Record<BillingCycle, string>>>>;
}

export interface BillingCouponDefinition {
  code: string;
  name: string;
  description: string;
  active: boolean;
  type: DiscountType;
  amount: number;
  scope: CouponScope;
  durationMonths?: number;
  appliesToTiers?: SubscriptionTier[];
}

export interface BillingUsageSnapshot {
  aiTokensUsed: number;
  apiCallsCount: number;
  emailsSent: number;
  leadsCaptured: number;
  messagesSent: number;
  callsMade: number;
  storageUsedGb: number;
}

export interface BillingChargeLineItem {
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  included: number;
  overage: number;
}

export interface BillingDiscountBreakdown {
  code: string;
  amount: number;
  scope: CouponScope;
}

export interface BillingQuoteSummary {
  cycle: BillingCycle;
  baseAmount: number;
  usageAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}