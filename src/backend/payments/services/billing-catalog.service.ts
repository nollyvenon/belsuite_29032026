import { Injectable } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  BillingCouponDefinition,
  BillingCycle,
  BillingPlanDefinition,
} from '../types/billing.types';
import { PaymentProvider } from '../types/payment.types';

function buildProviderPriceIds(
  provider: PaymentProvider,
  monthlyEnv: string,
  yearlyEnv: string,
): Partial<Record<PaymentProvider, Partial<Record<BillingCycle, string>>>> {
  return {
    [provider]: {
      MONTHLY: process.env[monthlyEnv],
      YEARLY: process.env[yearlyEnv],
    },
  };
}

@Injectable()
export class BillingCatalogService {
  private readonly plans: BillingPlanDefinition[] = [
    {
      tier: SubscriptionTier.FREE,
      name: 'Free',
      description: 'Entry tier for evaluation and lightweight solo usage.',
      pricePerMonth: 0,
      pricePerYear: 0,
      trialDays: 0,
      requestsPerMinute: 10,
      includedAiTokens: 100_000,
      includedLeads: 25,
      includedMessages: 50,
      includedCalls: 5,
      payAsYouGoEnabled: false,
      maxMembers: 1,
      maxProjects: 3,
      maxStorageGB: 1,
      features: ['1 seat', '3 projects', '100K AI tokens/month', 'Basic analytics'],
      usagePricing: {
        aiOveragePer1kTokens: 0,
        apiOveragePer1kRequests: 0,
        emailOveragePer1k: 0,
        leadOveragePerLead: 0,
        messageOveragePerMessage: 0,
        callOveragePerCall: 0,
        storageOveragePerGb: 0,
      },
      supportedProviders: [PaymentProvider.STRIPE, PaymentProvider.PAYPAL, PaymentProvider.CRYPTO],
      providerPriceIds: {},
    },
    {
      tier: SubscriptionTier.STARTER,
      name: 'Starter',
      description: 'For solo operators and small teams running production campaigns.',
      pricePerMonth: 49,
      pricePerYear: 499,
      trialDays: 14,
      requestsPerMinute: 50,
      includedAiTokens: 1_000_000,
      includedLeads: 500,
      includedMessages: 1500,
      includedCalls: 100,
      payAsYouGoEnabled: true,
      maxMembers: 5,
      maxProjects: 10,
      maxStorageGB: 5,
      features: ['5 seats', '10 projects', '1M AI tokens/month', 'Usage overages enabled'],
      usagePricing: {
        aiOveragePer1kTokens: 0.004,
        apiOveragePer1kRequests: 0.12,
        emailOveragePer1k: 1,
        leadOveragePerLead: 0.15,
        messageOveragePerMessage: 0.02,
        callOveragePerCall: 0.35,
        storageOveragePerGb: 0.75,
      },
      supportedProviders: [
        PaymentProvider.STRIPE,
        PaymentProvider.PAYSTACK,
        PaymentProvider.FLUTTERWAVE,
        PaymentProvider.MPESA,
        PaymentProvider.PAYPAL,
        PaymentProvider.SOFORT,
        PaymentProvider.CRYPTO,
      ],
      providerPriceIds: {
        ...buildProviderPriceIds(PaymentProvider.STRIPE, 'STRIPE_STARTER_MONTHLY_PRICE_ID', 'STRIPE_STARTER_YEARLY_PRICE_ID'),
        ...buildProviderPriceIds(PaymentProvider.PAYPAL, 'PAYPAL_STARTER_MONTHLY_PLAN_ID', 'PAYPAL_STARTER_YEARLY_PLAN_ID'),
        ...buildProviderPriceIds(PaymentProvider.MPESA, 'MPESA_STARTER_MONTHLY_PLAN_ID', 'MPESA_STARTER_YEARLY_PLAN_ID'),
      },
    },
    {
      tier: SubscriptionTier.PROFESSIONAL,
      name: 'Professional',
      description: 'For growth teams with multi-channel automation and larger AI spend.',
      pricePerMonth: 99,
      pricePerYear: 999,
      trialDays: 14,
      requestsPerMinute: 200,
      includedAiTokens: 10_000_000,
      includedLeads: 3000,
      includedMessages: 8000,
      includedCalls: 500,
      payAsYouGoEnabled: true,
      maxMembers: 20,
      maxProjects: 50,
      maxStorageGB: 25,
      features: ['20 seats', '50 projects', '10M AI tokens/month', 'Advanced automation'],
      usagePricing: {
        aiOveragePer1kTokens: 0.003,
        apiOveragePer1kRequests: 0.1,
        emailOveragePer1k: 0.85,
        leadOveragePerLead: 0.1,
        messageOveragePerMessage: 0.015,
        callOveragePerCall: 0.25,
        storageOveragePerGb: 0.6,
      },
      supportedProviders: [
        PaymentProvider.STRIPE,
        PaymentProvider.PAYSTACK,
        PaymentProvider.FLUTTERWAVE,
        PaymentProvider.MPESA,
        PaymentProvider.PAYPAL,
        PaymentProvider.SOFORT,
        PaymentProvider.CRYPTO,
      ],
      providerPriceIds: {
        ...buildProviderPriceIds(PaymentProvider.STRIPE, 'STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID', 'STRIPE_PROFESSIONAL_YEARLY_PRICE_ID'),
        ...buildProviderPriceIds(PaymentProvider.PAYPAL, 'PAYPAL_PROFESSIONAL_MONTHLY_PLAN_ID', 'PAYPAL_PROFESSIONAL_YEARLY_PLAN_ID'),
        ...buildProviderPriceIds(PaymentProvider.MPESA, 'MPESA_PROFESSIONAL_MONTHLY_PLAN_ID', 'MPESA_PROFESSIONAL_YEARLY_PLAN_ID'),
      },
    },
    {
      tier: SubscriptionTier.ENTERPRISE,
      name: 'Enterprise',
      description: 'For agencies and larger teams that need negotiated terms and custom billing.',
      pricePerMonth: 249,
      pricePerYear: 2499,
      trialDays: 30,
      requestsPerMinute: 1000,
      includedAiTokens: 100_000_000,
      includedLeads: 20000,
      includedMessages: 50000,
      includedCalls: 4000,
      payAsYouGoEnabled: true,
      maxMembers: 100,
      maxProjects: 500,
      maxStorageGB: 250,
      features: ['100 seats', '500 projects', '100M AI tokens/month', 'Priority support'],
      usagePricing: {
        aiOveragePer1kTokens: 0.0025,
        apiOveragePer1kRequests: 0.08,
        emailOveragePer1k: 0.7,
        leadOveragePerLead: 0.07,
        messageOveragePerMessage: 0.01,
        callOveragePerCall: 0.18,
        storageOveragePerGb: 0.45,
      },
      supportedProviders: [
        PaymentProvider.STRIPE,
        PaymentProvider.PAYSTACK,
        PaymentProvider.FLUTTERWAVE,
        PaymentProvider.MPESA,
        PaymentProvider.PAYPAL,
        PaymentProvider.SOFORT,
        PaymentProvider.CRYPTO,
      ],
      providerPriceIds: {
        ...buildProviderPriceIds(PaymentProvider.STRIPE, 'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID', 'STRIPE_ENTERPRISE_YEARLY_PRICE_ID'),
        ...buildProviderPriceIds(PaymentProvider.PAYPAL, 'PAYPAL_ENTERPRISE_MONTHLY_PLAN_ID', 'PAYPAL_ENTERPRISE_YEARLY_PLAN_ID'),
        ...buildProviderPriceIds(PaymentProvider.MPESA, 'MPESA_ENTERPRISE_MONTHLY_PLAN_ID', 'MPESA_ENTERPRISE_YEARLY_PLAN_ID'),
      },
    },
  ];

  private readonly coupons: BillingCouponDefinition[] = [
    {
      code: 'START20',
      name: 'Launch Discount',
      description: '20% off subscription charges for the first 3 months.',
      active: true,
      type: 'PERCENTAGE',
      amount: 20,
      scope: 'SUBSCRIPTION',
      durationMonths: 3,
      appliesToTiers: [SubscriptionTier.STARTER, SubscriptionTier.PROFESSIONAL],
    },
    {
      code: 'AIBOOST',
      name: 'AI Overage Discount',
      description: '25% off AI overage charges on pay-as-you-go plans.',
      active: true,
      type: 'PERCENTAGE',
      amount: 25,
      scope: 'USAGE',
      appliesToTiers: [SubscriptionTier.STARTER, SubscriptionTier.PROFESSIONAL, SubscriptionTier.ENTERPRISE],
    },
    {
      code: 'UPGRADE50',
      name: 'Upgrade Credit',
      description: '$50 one-time credit on a new paid subscription.',
      active: true,
      type: 'FIXED_AMOUNT',
      amount: 50,
      scope: 'SUBSCRIPTION',
      appliesToTiers: [SubscriptionTier.PROFESSIONAL, SubscriptionTier.ENTERPRISE],
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async syncPlans() {
    for (const plan of this.plans) {
      await this.prisma.billingPlan.upsert({
        where: { tier: plan.tier },
        update: {
          name: plan.name,
          description: plan.description,
          pricePerMonth: plan.pricePerMonth,
          pricePerYear: plan.pricePerYear,
          maxMembers: plan.maxMembers,
          maxProjects: plan.maxProjects,
          maxStorageGB: plan.maxStorageGB,
          features: plan.features,
        },
        create: {
          name: plan.name,
          tier: plan.tier,
          description: plan.description,
          pricePerMonth: plan.pricePerMonth,
          pricePerYear: plan.pricePerYear,
          maxMembers: plan.maxMembers,
          maxProjects: plan.maxProjects,
          maxStorageGB: plan.maxStorageGB,
          features: plan.features,
        },
      });
    }
  }

  getPlans() {
    return this.plans;
  }

  getPlanByTier(tier: SubscriptionTier) {
    return this.plans.find((plan) => plan.tier === tier) ?? null;
  }

  async getPlanById(planId: string) {
    const record = await this.prisma.billingPlan.findUnique({ where: { id: planId } });
    if (!record) return null;
    return this.getPlanByTier(record.tier);
  }

  async resolvePlan(input: { tier?: SubscriptionTier; planId?: string }) {
    if (input.planId) {
      const byId = await this.getPlanById(input.planId);
      if (byId) return byId;
    }

    if (input.tier) {
      return this.getPlanByTier(input.tier);
    }

    return null;
  }

  getCoupons() {
    return this.coupons.filter((coupon) => coupon.active);
  }

  getCoupon(code?: string | null) {
    if (!code) return null;
    return this.coupons.find((coupon) => coupon.active && coupon.code.toUpperCase() === code.toUpperCase()) ?? null;
  }

  getProviderPlanId(
    tier: SubscriptionTier,
    provider: PaymentProvider,
    cycle: BillingCycle,
  ) {
    const plan = this.getPlanByTier(tier);
    return plan?.providerPriceIds[provider]?.[cycle] ?? null;
  }
}