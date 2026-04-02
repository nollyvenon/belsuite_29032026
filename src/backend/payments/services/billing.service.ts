import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceStatus,
  PaymentProvider as PrismaPaymentProvider,
  SubscriptionStatus,
  SubscriptionTier,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  BillingChargeLineItem,
  BillingCouponDefinition,
  BillingCycle,
  BillingDiscountBreakdown,
  BillingPlanDefinition,
  BillingQuoteSummary,
  BillingUsageSnapshot,
} from '../types/billing.types';
import { PaymentProvider } from '../types/payment.types';
import { BillingCatalogService } from './billing-catalog.service';
import { PaymentService } from '../payment.service';

type BillingMetadata = {
  billing?: {
    cycle?: BillingCycle;
    activeCoupon?: {
      code: string;
      appliedAt: string;
    };
  };
};

type BillingProfileInput = {
  billingEmail: string;
  billingName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  taxId?: string;
};

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly catalog: BillingCatalogService,
  ) {}

  async getPlans() {
    await this.catalog.syncPlans();
    const dbPlans = await this.prisma.billingPlan.findMany({ orderBy: { pricePerMonth: 'asc' } });

    return dbPlans.map((record) => {
      const definition = this.catalog.getPlanByTier(record.tier);
      return {
        ...record,
        requestsPerMinute: definition?.requestsPerMinute ?? 0,
        includedAiTokens: definition?.includedAiTokens ?? 0,
        payAsYouGoEnabled: definition?.payAsYouGoEnabled ?? false,
        usagePricing: definition?.usagePricing ?? null,
        supportedProviders: definition?.supportedProviders ?? [],
      };
    });
  }

  getCoupons() {
    return this.catalog.getCoupons();
  }

  async getOverview(organizationId: string) {
    await this.catalog.syncPlans();
    const organization = await this.getOrganization(organizationId);
    const subscription = await this.ensureLocalSubscription(organizationId, organization.tier);
    const billingProfile = await this.prisma.billingProfile.findUnique({ where: { organizationId } });
    const activeCoupon = this.resolveActiveCoupon(organization.metadata, subscription.plan?.tier ?? organization.tier);
    const usage = await this.getUsageBilling(organizationId, subscription.plan?.tier ?? organization.tier, activeCoupon);

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        tier: organization.tier,
      },
      subscription,
      billingProfile,
      activeCoupon,
      usage,
      providers: this.paymentService.getAvailableProviders(),
    };
  }

  async previewQuote(
    organizationId: string,
    input: {
      tier?: SubscriptionTier;
      planId?: string;
      billingCycle?: BillingCycle;
      couponCode?: string;
      estimatedAiTokens?: number;
      estimatedApiCalls?: number;
      estimatedEmails?: number;
      estimatedLeads?: number;
      estimatedMessages?: number;
      estimatedCalls?: number;
      estimatedStorageGb?: number;
      currency?: string;
    },
  ) {
    await this.catalog.syncPlans();
    const organization = await this.getOrganization(organizationId);
    const plan = await this.catalog.resolvePlan({ tier: input.tier, planId: input.planId });
    if (!plan) {
      throw new BadRequestException('Billing plan not found');
    }

    const coupon = this.resolveCoupon(input.couponCode, organization.metadata, plan.tier);
    const usage = await this.getUsageBilling(organizationId, plan.tier, coupon, {
      aiTokensUsed: input.estimatedAiTokens,
      apiCallsCount: input.estimatedApiCalls,
      emailsSent: input.estimatedEmails,
      leadsCaptured: input.estimatedLeads,
      messagesSent: input.estimatedMessages,
      callsMade: input.estimatedCalls,
      storageUsedGb: input.estimatedStorageGb,
    });
    const pricing = this.calculateSummary(plan, input.billingCycle ?? 'MONTHLY', coupon, usage.lineItems, input.currency ?? 'USD');

    return {
      plan,
      coupon,
      usage,
      summary: pricing.summary,
      discounts: pricing.discounts,
    };
  }

  async updateBillingProfile(organizationId: string, input: BillingProfileInput) {
    const existing = await this.prisma.billingProfile.findUnique({ where: { organizationId } });
    const data = {
      billingEmail: input.billingEmail,
      billingName: input.billingName,
      billingAddress: input.billingAddress,
      billingCity: input.billingCity,
      billingState: input.billingState,
      billingZip: input.billingZip,
      billingCountry: input.billingCountry,
      taxId: input.taxId,
    };

    if (existing) {
      return this.prisma.billingProfile.update({
        where: { organizationId },
        data,
      });
    }

    return this.prisma.billingProfile.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async applyCoupon(organizationId: string, code: string) {
    const organization = await this.getOrganization(organizationId);
    const coupon = this.resolveCoupon(code, organization.metadata, organization.tier);
    if (!coupon) {
      throw new BadRequestException('Coupon is invalid or not applicable');
    }

    const metadata = this.parseMetadata(organization.metadata);
    metadata.billing = {
      ...(metadata.billing ?? {}),
      activeCoupon: {
        code: coupon.code,
        appliedAt: new Date().toISOString(),
      },
    };

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { metadata: JSON.stringify(metadata) },
    });

    return coupon;
  }

  async clearCoupon(organizationId: string) {
    const organization = await this.getOrganization(organizationId);
    const metadata = this.parseMetadata(organization.metadata);
    if (metadata.billing) {
      delete metadata.billing.activeCoupon;
    }

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { metadata: JSON.stringify(metadata) },
    });

    return { cleared: true };
  }

  async createManagedSubscription(
    organizationId: string,
    userId: string,
    input: BillingProfileInput & {
      provider: PaymentProvider;
      tier?: SubscriptionTier;
      planId?: string;
      billingCycle: BillingCycle;
      couponCode?: string;
      paymentMethodId: string;
      customerId?: string;
      trialDays?: number;
      currency?: string;
    },
  ) {
    await this.catalog.syncPlans();
    const organization = await this.getOrganization(organizationId);
    const plan = await this.catalog.resolvePlan({ tier: input.tier, planId: input.planId });

    if (!plan) {
      throw new BadRequestException('Billing plan not found');
    }

    const billingProfile = await this.updateBillingProfile(organizationId, input);
    const coupon = this.resolveCoupon(input.couponCode, organization.metadata, plan.tier);
    const localSubscription = await this.ensureLocalSubscription(organizationId, plan.tier);
    const dbPlan = await this.prisma.billingPlan.findUnique({ where: { tier: plan.tier } });

    let externalCustomerId = input.customerId ?? this.getCustomerId(billingProfile, input.provider);
    if (!externalCustomerId) {
      const customer = await this.paymentService.getProvider(input.provider).createCustomer({
        organizationId,
        email: billingProfile.billingEmail,
        name: billingProfile.billingName || organization.name,
        description: `${organization.name} billing account`,
        metadata: { userId },
      });
      externalCustomerId = customer.externalCustomerId;
      await this.updateProviderCustomerId(billingProfile.id, input.provider, externalCustomerId);
    }

    const quote = await this.previewQuote(organizationId, {
      tier: plan.tier,
      billingCycle: input.billingCycle,
      couponCode: coupon?.code,
      currency: input.currency ?? 'USD',
    });

    const invoice = await this.prisma.invoice.create({
      data: {
        subscriptionId: localSubscription.id,
        billingProfileId: billingProfile.id,
        amount: quote.summary.totalAmount,
        currency: quote.summary.currency,
        status: InvoiceStatus.PENDING,
        issuedAt: new Date(),
        dueAt: this.getBillingCycleEnd(input.billingCycle, input.trialDays ?? plan.trialDays),
      },
    });

    const externalPlanId =
      this.catalog.getProviderPlanId(plan.tier, input.provider, input.billingCycle) ??
      plan.tier.toString();

    const remoteSubscription = await this.paymentService.createSubscription(
      input.provider,
      organizationId,
      externalCustomerId,
      externalPlanId,
      input.paymentMethodId,
      input.trialDays ?? plan.trialDays,
    );

    const metadata = this.parseMetadata(organization.metadata);
    metadata.billing = {
      ...(metadata.billing ?? {}),
      cycle: input.billingCycle,
      ...(coupon
        ? {
            activeCoupon: {
              code: coupon.code,
              appliedAt: new Date().toISOString(),
            },
          }
        : {}),
    };

    const subscription = await this.prisma.subscription.update({
      where: { organizationId },
      data: {
        planId: dbPlan?.id,
        status: (input.trialDays ?? plan.trialDays) > 0 ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
        currentPeriodStart: remoteSubscription.currentPeriodStart,
        currentPeriodEnd: remoteSubscription.currentPeriodEnd,
        primaryPaymentMethod: this.toPrismaProvider(input.provider),
      },
      include: { plan: true, invoices: { orderBy: { issuedAt: 'desc' }, take: 5 } },
    });

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        tier: plan.tier,
        metadata: JSON.stringify(metadata),
      },
    });

    const shouldCreateHostedCharge =
      (input.provider === PaymentProvider.CRYPTO || input.provider === PaymentProvider.MPESA) &&
      quote.summary.totalAmount > 0;

    return {
      subscription,
      invoice,
      remoteSubscription,
      payment:
        shouldCreateHostedCharge
          ? await this.paymentService.createPayment(input.provider, {
              organizationId,
              subscriptionId: subscription.id,
              invoiceId: invoice.id,
              amount: quote.summary.totalAmount,
              currency: quote.summary.currency,
              metadata: {
                userId,
                email: billingProfile.billingEmail,
                name: billingProfile.billingName || organization.name,
                phone: input.paymentMethodId,
                paymentMethodId: input.paymentMethodId,
                billingCycle: input.billingCycle,
                planTier: plan.tier,
                chargeType: 'SUBSCRIPTION_START',
              },
            })
          : null,
      quote,
    };
  }

  async createUsageCharge(
    organizationId: string,
    userId: string,
    input: {
      provider?: PaymentProvider;
      couponCode?: string;
      currency?: string;
    },
  ) {
    const organization = await this.getOrganization(organizationId);
    const subscription = await this.ensureLocalSubscription(organizationId, organization.tier);
    const billingProfile = await this.prisma.billingProfile.findUnique({ where: { organizationId } });

    if (!billingProfile) {
      throw new BadRequestException('Billing profile is required before charging usage');
    }

    const tier = subscription.plan?.tier ?? organization.tier;
    const coupon = this.resolveCoupon(input.couponCode, organization.metadata, tier);
    const usage = await this.getUsageBilling(organizationId, tier, coupon);

    if (usage.summary.totalAmount <= 0) {
      return {
        charged: false,
        message: 'No usage overages to charge for the current period',
        usage,
      };
    }

    const provider = input.provider ?? this.fromPrismaProvider(subscription.primaryPaymentMethod);

    const invoice = await this.prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        billingProfileId: billingProfile.id,
        amount: usage.summary.totalAmount,
        currency: input.currency ?? 'USD',
        status: InvoiceStatus.PENDING,
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const payment = await this.paymentService.createPayment(provider, {
      organizationId,
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
      amount: usage.summary.totalAmount,
      currency: input.currency ?? 'USD',
      metadata: {
        userId,
        email: billingProfile.billingEmail,
        chargeType: 'USAGE_OVERRAGE',
        couponCode: coupon?.code,
      },
    });

    return {
      charged: true,
      invoice,
      payment,
      usage,
    };
  }

  async getUsageBilling(
    organizationId: string,
    tier?: SubscriptionTier,
    coupon?: BillingCouponDefinition | null,
    overrides?: Partial<BillingUsageSnapshot>,
  ) {
    const organization = await this.getOrganization(organizationId);
    const effectiveTier = tier ?? organization.tier;
    const plan = this.catalog.getPlanByTier(effectiveTier);

    if (!plan) {
      throw new NotFoundException(`Billing plan not found for tier ${effectiveTier}`);
    }

    const usage = await this.getUsageSnapshot(organizationId, overrides);
    const lineItems = this.buildUsageLineItems(plan, usage);
    const usageSummary = this.calculateSummary(plan, 'MONTHLY', coupon ?? null, lineItems, 'USD', true);

    return {
      tier: effectiveTier,
      plan,
      usage,
      lineItems,
      discounts: usageSummary.discounts,
      summary: usageSummary.summary,
    };
  }

  async getAiEntitlements(organizationId: string) {
    await this.catalog.syncPlans();
    const organization = await this.getOrganization(organizationId);
    const subscription = await this.ensureLocalSubscription(organizationId, organization.tier);
    const plan = this.catalog.getPlanByTier(subscription.plan?.tier ?? organization.tier);

    if (!plan) {
      throw new NotFoundException('Billing entitlements not found');
    }

    const currentUsage = await this.getUsageSnapshot(organizationId);

    return {
      tier: plan.tier,
      requestsPerMinute: plan.requestsPerMinute,
      includedAiTokens: plan.includedAiTokens,
      currentAiTokens: currentUsage.aiTokensUsed,
      remainingIncludedAiTokens: Math.max(0, plan.includedAiTokens - currentUsage.aiTokensUsed),
      payAsYouGoEnabled: plan.payAsYouGoEnabled,
      aiOveragePer1kTokens: plan.usagePricing.aiOveragePer1kTokens,
      subscriptionStatus: subscription.status,
    };
  }

  private async getOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        metadata: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  private async ensureLocalSubscription(
    organizationId: string,
    fallbackTier: SubscriptionTier,
  ) {
    await this.catalog.syncPlans();

    const existing = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: {
        plan: true,
        invoices: { orderBy: { issuedAt: 'desc' }, take: 5 },
      },
    });

    if (existing) {
      return existing;
    }

    const planRecord = await this.prisma.billingPlan.findUnique({ where: { tier: fallbackTier } });
    return this.prisma.subscription.create({
      data: {
        organizationId,
        planId: planRecord?.id,
        status: fallbackTier === SubscriptionTier.FREE ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL,
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.getBillingCycleEnd('MONTHLY', fallbackTier === SubscriptionTier.FREE ? 0 : 14),
        primaryPaymentMethod: PrismaPaymentProvider.STRIPE,
      },
      include: {
        plan: true,
        invoices: { orderBy: { issuedAt: 'desc' }, take: 5 },
      },
    });
  }

  private async getUsageSnapshot(
    organizationId: string,
    overrides?: Partial<BillingUsageSnapshot>,
  ): Promise<BillingUsageSnapshot> {
    const month = this.getCurrentMonth();
    const [tenantUsage, aiUsage, billableEvents] = await Promise.all([
      this.prisma.tenantUsage.findUnique({
        where: {
          organizationId_period: {
            organizationId,
            period: month,
          },
        },
      }),
      this.prisma.aIUsage.aggregate({
        where: {
          organizationId,
          createdAt: {
            gte: this.getCurrentMonthStart(),
            lte: this.getCurrentMonthEnd(),
          },
        },
        _sum: {
          totalTokens: true,
        },
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          timestamp: {
            gte: this.getCurrentMonthStart(),
            lte: this.getCurrentMonthEnd(),
          },
          eventType: {
            in: [
              'lead.scraped',
              'funnel.lead.captured',
              'marketing.automation.message_sent',
              'crm.outreach.message_sent',
              'ai.call.dispatched',
            ],
          },
        },
        select: {
          eventType: true,
          properties: true,
        },
      }),
    ]);

    let leadsCaptured = 0;
    let messagesSent = 0;
    let callsMade = 0;

    for (const event of billableEvents) {
      if (event.eventType === 'lead.scraped' || event.eventType === 'funnel.lead.captured') {
        leadsCaptured += 1;
        continue;
      }

      if (event.eventType === 'ai.call.dispatched') {
        callsMade += 1;
        continue;
      }

      if (event.eventType === 'marketing.automation.message_sent' || event.eventType === 'crm.outreach.message_sent') {
        const props = this.parseJson(event.properties);
        const channel = String(props.channel || '').toLowerCase();

        if (channel === 'voice') {
          callsMade += 1;
        } else if (channel && channel !== 'email') {
          messagesSent += 1;
        }
      }
    }

    return {
      aiTokensUsed: overrides?.aiTokensUsed ?? aiUsage._sum.totalTokens ?? tenantUsage?.aiTokensUsed ?? 0,
      apiCallsCount: overrides?.apiCallsCount ?? tenantUsage?.apiCallsCount ?? 0,
      emailsSent: overrides?.emailsSent ?? tenantUsage?.emailsSent ?? 0,
      leadsCaptured: overrides?.leadsCaptured ?? leadsCaptured,
      messagesSent: overrides?.messagesSent ?? messagesSent,
      callsMade: overrides?.callsMade ?? callsMade,
      storageUsedGb:
        overrides?.storageUsedGb ?? Number(tenantUsage?.storageUsedBytes ?? 0) / (1024 * 1024 * 1024),
    };
  }

  private buildUsageLineItems(
    plan: BillingPlanDefinition,
    usage: BillingUsageSnapshot,
  ): BillingChargeLineItem[] {
    const aiOverage = Math.max(0, usage.aiTokensUsed - plan.includedAiTokens);
    const aiAmount = plan.payAsYouGoEnabled
      ? (aiOverage / 1000) * plan.usagePricing.aiOveragePer1kTokens
      : 0;

    const apiAmount = (usage.apiCallsCount / 1000) * plan.usagePricing.apiOveragePer1kRequests;
    const emailAmount = (usage.emailsSent / 1000) * plan.usagePricing.emailOveragePer1k;
    const leadOverage = Math.max(0, usage.leadsCaptured - plan.includedLeads);
    const leadAmount = leadOverage * plan.usagePricing.leadOveragePerLead;
    const messageOverage = Math.max(0, usage.messagesSent - plan.includedMessages);
    const messageAmount = messageOverage * plan.usagePricing.messageOveragePerMessage;
    const callOverage = Math.max(0, usage.callsMade - plan.includedCalls);
    const callAmount = callOverage * plan.usagePricing.callOveragePerCall;
    const storageOverage = Math.max(0, usage.storageUsedGb - plan.maxStorageGB);
    const storageAmount = storageOverage * plan.usagePricing.storageOveragePerGb;

    return [
      {
        label: 'AI tokens overage',
        quantity: usage.aiTokensUsed,
        unitPrice: plan.usagePricing.aiOveragePer1kTokens,
        amount: this.round2(aiAmount),
        included: plan.includedAiTokens,
        overage: aiOverage,
      },
      {
        label: 'API usage',
        quantity: usage.apiCallsCount,
        unitPrice: plan.usagePricing.apiOveragePer1kRequests,
        amount: this.round2(apiAmount),
        included: 0,
        overage: usage.apiCallsCount,
      },
      {
        label: 'Email usage',
        quantity: usage.emailsSent,
        unitPrice: plan.usagePricing.emailOveragePer1k,
        amount: this.round2(emailAmount),
        included: 0,
        overage: usage.emailsSent,
      },
      {
        label: 'Pay-per-lead usage',
        quantity: usage.leadsCaptured,
        unitPrice: plan.usagePricing.leadOveragePerLead,
        amount: this.round2(leadAmount),
        included: plan.includedLeads,
        overage: leadOverage,
      },
      {
        label: 'Pay-per-message usage',
        quantity: usage.messagesSent,
        unitPrice: plan.usagePricing.messageOveragePerMessage,
        amount: this.round2(messageAmount),
        included: plan.includedMessages,
        overage: messageOverage,
      },
      {
        label: 'Call usage',
        quantity: usage.callsMade,
        unitPrice: plan.usagePricing.callOveragePerCall,
        amount: this.round2(callAmount),
        included: plan.includedCalls,
        overage: callOverage,
      },
      {
        label: 'Storage overage',
        quantity: this.round2(usage.storageUsedGb),
        unitPrice: plan.usagePricing.storageOveragePerGb,
        amount: this.round2(storageAmount),
        included: plan.maxStorageGB,
        overage: this.round2(storageOverage),
      },
    ].filter((line) => line.amount > 0 || line.label === 'AI tokens overage');
  }

  private calculateSummary(
    plan: BillingPlanDefinition,
    cycle: BillingCycle,
    coupon: BillingCouponDefinition | null,
    usageLineItems: BillingChargeLineItem[],
    currency: string,
    usageOnly = false,
  ) {
    const baseAmount = usageOnly ? 0 : cycle === 'YEARLY' ? plan.pricePerYear : plan.pricePerMonth;
    const usageAmount = this.round2(usageLineItems.reduce((sum, item) => sum + item.amount, 0));
    const discounts: BillingDiscountBreakdown[] = [];

    if (coupon) {
      if (coupon.scope === 'SUBSCRIPTION' || coupon.scope === 'ALL') {
        const amount = this.discountAmount(coupon, usageOnly ? 0 : baseAmount);
        if (amount > 0) {
          discounts.push({ code: coupon.code, amount, scope: coupon.scope });
        }
      }

      if (coupon.scope === 'USAGE' || coupon.scope === 'ALL') {
        const amount = this.discountAmount(coupon, usageAmount);
        if (amount > 0) {
          discounts.push({ code: coupon.code, amount, scope: coupon.scope });
        }
      }
    }

    const discountAmount = this.round2(discounts.reduce((sum, item) => sum + item.amount, 0));
    const totalAmount = this.round2(Math.max(baseAmount + usageAmount - discountAmount, 0));

    const summary: BillingQuoteSummary = {
      cycle,
      baseAmount: this.round2(baseAmount),
      usageAmount,
      discountAmount,
      totalAmount,
      currency,
    };

    return { summary, discounts };
  }

  private resolveCoupon(
    code: string | undefined,
    metadata: string | null,
    tier: SubscriptionTier,
  ) {
    const direct = this.catalog.getCoupon(code ?? undefined);
    if (direct && this.couponAppliesToTier(direct, tier)) {
      return direct;
    }

    return this.resolveActiveCoupon(metadata, tier);
  }

  private resolveActiveCoupon(metadata: string | null, tier: SubscriptionTier) {
    const parsed = this.parseMetadata(metadata);
    const code = parsed.billing?.activeCoupon?.code;
    const coupon = this.catalog.getCoupon(code);

    if (!coupon || !this.couponAppliesToTier(coupon, tier)) {
      return null;
    }

    if (!coupon.durationMonths) {
      return coupon;
    }

    const appliedAt = parsed.billing?.activeCoupon?.appliedAt;
    if (!appliedAt) {
      return coupon;
    }

    const expiry = new Date(appliedAt);
    expiry.setMonth(expiry.getMonth() + coupon.durationMonths);
    return expiry >= new Date() ? coupon : null;
  }

  private couponAppliesToTier(coupon: BillingCouponDefinition, tier: SubscriptionTier) {
    return !coupon.appliesToTiers || coupon.appliesToTiers.includes(tier);
  }

  private discountAmount(coupon: BillingCouponDefinition, subtotal: number) {
    if (subtotal <= 0) return 0;
    if (coupon.type === 'PERCENTAGE') {
      return this.round2((subtotal * coupon.amount) / 100);
    }
    return this.round2(Math.min(coupon.amount, subtotal));
  }

  private parseMetadata(metadata: string | null): BillingMetadata {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata) as BillingMetadata;
    } catch {
      return {};
    }
  }

  private parseJson(raw: string | null) {
    if (!raw) return {} as Record<string, any>;
    try {
      return JSON.parse(raw) as Record<string, any>;
    } catch {
      return {} as Record<string, any>;
    }
  }

  private getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getCurrentMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getCurrentMonthEnd() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  private getBillingCycleEnd(cycle: BillingCycle, trialDays: number) {
    const end = new Date();
    if (trialDays > 0) {
      end.setDate(end.getDate() + trialDays);
      return end;
    }

    if (cycle === 'YEARLY') {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    return end;
  }

  private getCustomerId(profile: {
    stripeCustomerId: string | null;
    paystackCustomerId: string | null;
    flutterwaveCustomerId: string | null;
    paypalCustomerId: string | null;
    sofortCustomerId: string | null;
  }, provider: PaymentProvider) {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return profile.stripeCustomerId;
      case PaymentProvider.PAYSTACK:
        return profile.paystackCustomerId;
      case PaymentProvider.FLUTTERWAVE:
        return profile.flutterwaveCustomerId;
      case PaymentProvider.PAYPAL:
        return profile.paypalCustomerId;
      case PaymentProvider.SOFORT:
        return profile.sofortCustomerId;
      default:
        return null;
    }
  }

  private async updateProviderCustomerId(
    billingProfileId: string,
    provider: PaymentProvider,
    customerId: string,
  ) {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return this.prisma.billingProfile.update({ where: { id: billingProfileId }, data: { stripeCustomerId: customerId } });
      case PaymentProvider.PAYSTACK:
        return this.prisma.billingProfile.update({ where: { id: billingProfileId }, data: { paystackCustomerId: customerId } });
      case PaymentProvider.FLUTTERWAVE:
        return this.prisma.billingProfile.update({ where: { id: billingProfileId }, data: { flutterwaveCustomerId: customerId } });
      case PaymentProvider.PAYPAL:
        return this.prisma.billingProfile.update({ where: { id: billingProfileId }, data: { paypalCustomerId: customerId } });
      case PaymentProvider.SOFORT:
        return this.prisma.billingProfile.update({ where: { id: billingProfileId }, data: { sofortCustomerId: customerId } });
      default:
        return null;
    }
  }

  private toPrismaProvider(provider: PaymentProvider): PrismaPaymentProvider {
    return provider.toUpperCase() as PrismaPaymentProvider;
  }

  private fromPrismaProvider(provider: PrismaPaymentProvider): PaymentProvider {
    return provider.toLowerCase() as PaymentProvider;
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
  }
}