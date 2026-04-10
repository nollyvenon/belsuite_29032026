import { BadRequestException, Injectable } from '@nestjs/common';
import { CreditTxType, WebhookStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StripeBillingService } from '../gateways/stripe.service';
import { PaystackService } from '../gateways/paystack.service';
import { MpesaService } from '../gateways/mpesa.service';
import { CryptoPaymentService } from '../gateways/crypto-payment.service';
import { CreditService } from './credit.service';
import { PricingEngineService } from './pricing-engine.service';
import { UsageMeterService } from './usage-meter.service';
import { PaymentService } from '../../payments/payment.service';
import { PaymentProvider } from '../../payments/types/payment.types';
import {
  CreateBundleDto,
  CreatePlanDto,
  EstimateCostDto,
  MeterUsageDto,
  ProviderCheckoutDto,
  StripeCheckoutDto,
  UpsertPricingRuleDto,
} from '../dto/billing-api.dto';

@Injectable()
export class BillingApiService {
  private static readonly PROVIDER_CAPABILITIES = [
    {
      provider: PaymentProvider.STRIPE,
      supportsSubscriptions: true,
      supportsTopup: true,
      supportsWebhook: true,
      supportsHostedCheckout: true,
      requiresPhoneNumber: false,
    },
    {
      provider: PaymentProvider.PAYSTACK,
      supportsSubscriptions: true,
      supportsTopup: true,
      supportsWebhook: true,
      supportsHostedCheckout: true,
      requiresPhoneNumber: false,
    },
    {
      provider: PaymentProvider.MPESA,
      supportsSubscriptions: false,
      supportsTopup: true,
      supportsWebhook: true,
      supportsHostedCheckout: false,
      requiresPhoneNumber: true,
    },
    {
      provider: PaymentProvider.CRYPTO,
      supportsSubscriptions: false,
      supportsTopup: true,
      supportsWebhook: true,
      supportsHostedCheckout: true,
      requiresPhoneNumber: false,
    },
    {
      provider: PaymentProvider.SOFORT,
      supportsSubscriptions: false,
      supportsTopup: true,
      supportsWebhook: true,
      supportsHostedCheckout: true,
      requiresPhoneNumber: false,
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly creditService: CreditService,
    private readonly pricingService: PricingEngineService,
    private readonly usageService: UsageMeterService,
    private readonly stripeService: StripeBillingService,
    private readonly paystackService: PaystackService,
    private readonly mpesaService: MpesaService,
    private readonly cryptoService: CryptoPaymentService,
    private readonly paymentService: PaymentService,
  ) {}

  async meterUsage(organizationId: string, userId: string | undefined, dto: MeterUsageDto, softFail = false) {
    return this.usageService.meter(
      {
        ...dto,
        organizationId,
        userId,
      },
      softFail,
    );
  }

  async estimateCost(input: EstimateCostDto) {
    return this.pricingService.calculate(input);
  }

  async getUsageLogs(organizationId: string, limit = 50) {
    const normalizedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    return this.usageService.getRecentEvents(organizationId, normalizedLimit);
  }

  async getUsageSummary(organizationId: string, from: Date, to: Date) {
    return this.usageService.getUsageSummary(organizationId, from, to);
  }

  async getUsageModelBreakdown(organizationId: string, from: Date, to: Date) {
    return this.usageService.getModelBreakdown(organizationId, from, to);
  }

  async getCreditBalance(organizationId: string) {
    const [balance, account] = await Promise.all([
      this.creditService.getBalance(organizationId),
      this.creditService.getOrCreateAccount(organizationId),
    ]);
    return { balanceCredits: balance, account };
  }

  async getCreditTransactions(organizationId: string, limit = 50) {
    const normalizedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    return this.creditService.getTransactions(organizationId, { limit: normalizedLimit });
  }

  async createCreditCheckout(organizationId: string, dto: StripeCheckoutDto) {
    if (!dto.bundleId) {
      throw new BadRequestException('bundleId is required for credit checkout');
    }

    const checkoutUrl = await this.stripeService.createCreditCheckout(
      organizationId,
      dto.email,
      dto.bundleId,
      dto.successUrl,
      dto.cancelUrl,
    );
    return { checkoutUrl };
  }

  async createSubscriptionCheckout(organizationId: string, dto: StripeCheckoutDto) {
    if (!dto.priceId) {
      throw new BadRequestException('priceId is required for subscription checkout');
    }

    const checkoutUrl = await this.stripeService.createSubscriptionCheckout(
      organizationId,
      dto.email,
      dto.priceId,
      dto.successUrl,
      dto.cancelUrl,
    );
    return { checkoutUrl };
  }

  async listSubscriptions(organizationId: string) {
    const [local, remote] = await Promise.all([
      this.prisma.subscription.findUnique({
        where: { organizationId },
        include: { plan: true },
      }),
      this.stripeService.getSubscription(organizationId),
    ]);
    return { local, remote };
  }

  async cancelSubscription(organizationId: string) {
    await this.stripeService.cancelSubscription(organizationId);
    return { cancelled: true };
  }

  async upsertPlan(dto: CreatePlanDto) {
    return this.prisma.billingPlan.upsert({
      where: { tier: dto.tier },
      update: {
        name: dto.name,
        description: dto.description,
        pricePerMonth: dto.pricePerMonth,
        pricePerYear: dto.pricePerYear,
        maxMembers: dto.maxMembers,
        maxProjects: dto.maxProjects,
        maxStorageGB: dto.maxStorageGB,
        features: dto.features ?? [],
      },
      create: {
        name: dto.name,
        tier: dto.tier,
        description: dto.description,
        pricePerMonth: dto.pricePerMonth,
        pricePerYear: dto.pricePerYear,
        maxMembers: dto.maxMembers,
        maxProjects: dto.maxProjects,
        maxStorageGB: dto.maxStorageGB,
        features: dto.features ?? [],
      },
    });
  }

  async listPlans() {
    return this.prisma.billingPlan.findMany({
      orderBy: [{ pricePerMonth: 'asc' }],
    });
  }

  async listBundles() {
    return this.prisma.creditBundle.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createBundle(dto: CreateBundleDto) {
    return this.prisma.creditBundle.create({
      data: {
        name: dto.name,
        credits: dto.credits,
        priceUsd: dto.priceUsd,
        discountPct: dto.discountPct ?? 0,
        bonusCredits: dto.bonusCredits ?? 0,
        isActive: dto.isActive ?? true,
        isPopular: dto.isPopular ?? false,
        sortOrder: dto.sortOrder ?? 0,
        description: dto.description,
        stripePriceId: dto.stripePriceId,
      },
    });
  }

  async upsertPricingRule(dto: UpsertPricingRuleDto) {
    return this.pricingService.upsertRule(dto);
  }

  async listPricingRules() {
    const [rules, configs] = await Promise.all([
      this.pricingService.listRules(),
      this.pricingService.getBillingConfigs(),
    ]);
    return { rules, configs };
  }

  async deletePricingRule(id: string) {
    await this.pricingService.deleteRule(id);
    return { deleted: true };
  }

  async setGlobalRate(creditsPerUsd: number) {
    await this.pricingService.setGlobalRate(creditsPerUsd);
    return { updated: true, creditsPerUsd };
  }

  async setDefaultMargin(marginPct: number) {
    await this.pricingService.setDefaultMargin(marginPct);
    return { updated: true, marginPct };
  }

  async marginReport(from: Date, to: Date) {
    return this.usageService.getMarginReport(from, to);
  }

  async allocatePlanCredits(organizationId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });
    if (!subscription?.plan) {
      throw new BadRequestException('No subscription plan found for organization');
    }

    const monthlyCredits = this.extractMonthlyCredits(subscription.plan.features);
    if (monthlyCredits <= 0) {
      throw new BadRequestException(
        'Plan does not define monthly credits. Add "monthly_credits:<number>" to plan.features',
      );
    }

    await this.creditService.credit({
      organizationId,
      credits: monthlyCredits,
      type: CreditTxType.PLAN_ALLOCATION,
      description: `Plan allocation (${subscription.plan.tier})`,
      meta: { subscriptionId: subscription.id },
    });

    return { allocated: monthlyCredits };
  }

  async handleStripeWebhook(signature: string, payload: string | Buffer) {
    const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf-8');
    const event = this.stripeService.verifyWebhook(body, signature);
    const tracked = await this.beginWebhookProcessing(
      PaymentProvider.STRIPE,
      event.type,
      event.id,
      event,
    );
    if (tracked.duplicate) {
      return { received: true, provider: 'stripe', eventType: event.type, duplicate: true };
    }
    try {
      await this.stripeService.handleWebhookEvent(event);
      await this.finishWebhookProcessing(tracked.id, WebhookStatus.PROCESSED);
      return { received: true, provider: 'stripe', eventType: event.type };
    } catch (error) {
      await this.finishWebhookProcessing(
        tracked.id,
        WebhookStatus.FAILED,
        error instanceof Error ? error.message : 'unknown stripe webhook error',
      );
      throw error;
    }
  }

  async createProviderCheckout(organizationId: string, dto: ProviderCheckoutDto) {
    switch (dto.provider) {
      case PaymentProvider.STRIPE:
        if (dto.bundleId) {
          return this.createCreditCheckout(organizationId, dto);
        }
        if (!dto.priceId) throw new BadRequestException('priceId is required for Stripe subscription checkout');
        return this.createSubscriptionCheckout(organizationId, dto);

      case PaymentProvider.PAYSTACK: {
        if (dto.bundleId) {
          const bundle = await this.prisma.creditBundle.findUnique({ where: { id: dto.bundleId } });
          if (!bundle || !bundle.isActive) throw new BadRequestException('Bundle not found');
          const amountKobo = Math.round(bundle.priceUsd * 100 * 100 * (1 - bundle.discountPct / 100));
          return this.paystackService.initializePayment({
            organizationId,
            email: dto.email,
            amountKobo,
            bundleId: dto.bundleId,
            callbackUrl: dto.successUrl,
          });
        }

        if (!dto.priceId) throw new BadRequestException('priceId/planCode is required for Paystack subscription checkout');
        const authorizationUrl = await this.paystackService.createSubscription({
          organizationId,
          email: dto.email,
          planCode: dto.priceId,
          callbackUrl: dto.successUrl,
        });
        return { authorizationUrl };
      }

      case PaymentProvider.MPESA: {
        if (!dto.bundleId) throw new BadRequestException('bundleId is required for M-Pesa checkout');
        if (!dto.phoneNumber) throw new BadRequestException('phoneNumber is required for M-Pesa checkout');
        const bundle = await this.prisma.creditBundle.findUnique({ where: { id: dto.bundleId } });
        if (!bundle || !bundle.isActive) throw new BadRequestException('Bundle not found');
        const amountKes = Number((bundle.priceUsd * (1 - bundle.discountPct / 100) * 130).toFixed(2));
        return this.mpesaService.stkPush({
          organizationId,
          phoneNumber: dto.phoneNumber,
          amountKes,
          bundleId: dto.bundleId,
          description: `BelSuite ${bundle.name}`,
        });
      }

      case PaymentProvider.CRYPTO: {
        const amountUsd = dto.amountUsd ?? (await this.resolveBundleAmount(dto.bundleId));
        if (!amountUsd) throw new BadRequestException('amountUsd or bundleId is required for crypto checkout');
        const bundleName = dto.bundleId ? (await this.prisma.creditBundle.findUnique({ where: { id: dto.bundleId } }))?.name : undefined;
        return this.cryptoService.createCoinbaseCharge({
          organizationId,
          amountUsd,
          bundleId: dto.bundleId,
          name: bundleName ?? 'BelSuite Credit Purchase',
          redirectUrl: dto.successUrl,
          cancelUrl: dto.cancelUrl,
        });
      }

      case PaymentProvider.SOFORT: {
        const amountUsd = dto.amountUsd ?? (await this.resolveBundleAmount(dto.bundleId));
        if (!amountUsd) throw new BadRequestException('amountUsd or bundleId is required for Sofort checkout');
        const mockedSubscription = await this.ensureCheckoutSubscription(organizationId);
        const payment = await this.paymentService.createPayment(PaymentProvider.SOFORT, {
          organizationId,
          subscriptionId: mockedSubscription.id,
          amount: amountUsd,
          currency: dto.currency ?? 'EUR',
          metadata: {
            email: dto.email,
            chargeType: dto.bundleId ? 'CREDIT_PURCHASE' : 'CUSTOM_TOPUP',
            bundleId: dto.bundleId,
          },
        });
        return {
          redirectUrl: payment.redirectUrl,
          externalPaymentId: payment.externalPaymentId,
        };
      }

      default:
        throw new BadRequestException(`Unsupported provider: ${dto.provider}`);
    }
  }

  async handlePaystackWebhook(signature: string, payload: string) {
    const valid = this.paystackService.verifyWebhookSignature(payload, signature);
    if (!valid) throw new BadRequestException('Invalid Paystack signature');
    const event = JSON.parse(payload);
    const tracked = await this.beginWebhookProcessing(
      PaymentProvider.PAYSTACK,
      event?.event ?? 'unknown',
      event?.data?.id ? String(event.data.id) : undefined,
      event,
    );
    if (tracked.duplicate) {
      return { received: true, provider: 'paystack', event: event.event, duplicate: true };
    }
    try {
      await this.paystackService.handleWebhookEvent(event);
      await this.finishWebhookProcessing(tracked.id, WebhookStatus.PROCESSED);
      return { received: true, provider: 'paystack', event: event.event };
    } catch (error) {
      await this.finishWebhookProcessing(
        tracked.id,
        WebhookStatus.FAILED,
        error instanceof Error ? error.message : 'unknown paystack webhook error',
      );
      throw error;
    }
  }

  async handleMpesaCallback(payload: any) {
    const externalId = payload?.Body?.stkCallback?.CheckoutRequestID
      ? String(payload.Body.stkCallback.CheckoutRequestID)
      : undefined;
    const tracked = await this.beginWebhookProcessing(
      PaymentProvider.MPESA,
      'stk_callback',
      externalId,
      payload,
    );
    if (tracked.duplicate) {
      return { received: true, provider: 'mpesa', duplicate: true };
    }
    try {
      await this.mpesaService.handleCallback(payload);
      await this.finishWebhookProcessing(tracked.id, WebhookStatus.PROCESSED);
      return { received: true, provider: 'mpesa' };
    } catch (error) {
      await this.finishWebhookProcessing(
        tracked.id,
        WebhookStatus.FAILED,
        error instanceof Error ? error.message : 'unknown mpesa webhook error',
      );
      throw error;
    }
  }

  async handleCryptoWebhook(signature: string, payload: string) {
    const event = JSON.parse(payload);
    const tracked = await this.beginWebhookProcessing(
      PaymentProvider.CRYPTO,
      event?.type ?? 'unknown',
      event?.id ? String(event.id) : undefined,
      event,
    );
    if (tracked.duplicate) {
      return { received: true, provider: 'crypto', duplicate: true };
    }
    try {
      await this.cryptoService.handleCoinbaseWebhook(payload, signature);
      await this.finishWebhookProcessing(tracked.id, WebhookStatus.PROCESSED);
      return { received: true, provider: 'crypto' };
    } catch (error) {
      await this.finishWebhookProcessing(
        tracked.id,
        WebhookStatus.FAILED,
        error instanceof Error ? error.message : 'unknown crypto webhook error',
      );
      throw error;
    }
  }

  async handleSofortWebhook(signature: string, payload: string) {
    const valid = await this.paymentService.verifyWebhookSignature(
      PaymentProvider.SOFORT,
      signature,
      payload,
    );
    if (!valid.isValid) throw new BadRequestException('Invalid Sofort signature');
    const event = JSON.parse(payload);
    const tracked = await this.beginWebhookProcessing(
      PaymentProvider.SOFORT,
      event?.type ?? 'unknown',
      event?.id ? String(event.id) : undefined,
      event,
    );
    if (tracked.duplicate) {
      return { received: true, provider: 'sofort', duplicate: true };
    }
    try {
      await this.paymentService.handleWebhookEvent(PaymentProvider.SOFORT, event);
      await this.finishWebhookProcessing(tracked.id, WebhookStatus.PROCESSED);
      return { received: true, provider: 'sofort' };
    } catch (error) {
      await this.finishWebhookProcessing(
        tracked.id,
        WebhookStatus.FAILED,
        error instanceof Error ? error.message : 'unknown sofort webhook error',
      );
      throw error;
    }
  }

  getProviderCapabilities() {
    return BillingApiService.PROVIDER_CAPABILITIES;
  }

  private extractMonthlyCredits(features: string[]) {
    const creditFeature = features.find((feature) =>
      feature.toLowerCase().startsWith('monthly_credits:'),
    );
    if (!creditFeature) return 0;
    const parsed = Number(creditFeature.split(':')[1]);
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  }

  private async resolveBundleAmount(bundleId?: string) {
    if (!bundleId) return null;
    const bundle = await this.prisma.creditBundle.findUnique({ where: { id: bundleId } });
    if (!bundle || !bundle.isActive) return null;
    return Number((bundle.priceUsd * (1 - bundle.discountPct / 100)).toFixed(2));
  }

  private async ensureCheckoutSubscription(organizationId: string) {
    const existing = await this.prisma.subscription.findUnique({ where: { organizationId } });
    if (existing) return existing;
    return this.prisma.subscription.create({
      data: {
        organizationId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private async beginWebhookProcessing(
    provider: PaymentProvider,
    eventType: string,
    externalWebhookId: string | undefined,
    data: unknown,
  ) {
    if (externalWebhookId) {
      const existing = await this.prisma.paymentWebhook.findUnique({
        where: { externalWebhookId },
      });
      if (existing) {
        return { id: existing.id, duplicate: true };
      }
    }

    const created = await this.prisma.paymentWebhook.create({
      data: {
        provider: provider as any,
        externalWebhookId: externalWebhookId ?? null,
        eventType,
        data: JSON.stringify(data),
        status: WebhookStatus.PROCESSING,
      },
    });
    return { id: created.id, duplicate: false };
  }

  private async finishWebhookProcessing(id: string, status: WebhookStatus, errorMessage?: string) {
    await this.prisma.paymentWebhook.update({
      where: { id },
      data: {
        status,
        processedAt: status === WebhookStatus.PROCESSED ? new Date() : undefined,
        errorMessage,
      },
    });
  }
}
