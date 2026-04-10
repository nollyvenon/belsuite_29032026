import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }       from '@nestjs/config';
import { PrismaService }       from '../../database/prisma.service';
import { CreditService }       from '../services/credit.service';
import { CreditTxType, SubscriptionStatus }        from '@prisma/client';

@Injectable()
export class StripeBillingService {
  private readonly logger = new Logger(StripeBillingService.name);
  private stripe: any;

  constructor(
    private readonly config:  ConfigService,
    private readonly prisma:  PrismaService,
    private readonly credits: CreditService,
  ) {
    this.initStripe();
  }

  private async initStripe() {
    try {
      const Stripe = (await import('stripe' as any)).default;
      this.stripe  = new Stripe(this.config.get('STRIPE_SECRET_KEY') ?? '', {
        apiVersion: '2024-06-20',
      });
    } catch {
      this.logger.warn('Stripe SDK not installed — run: npm install stripe');
    }
  }

  private get sdk() {
    if (!this.stripe) throw new Error('Stripe not initialized');
    return this.stripe;
  }

  // ── Customer management ──────────────────────────────────────────────────

  async getOrCreateCustomer(organizationId: string, email: string, name?: string): Promise<string> {
    const profile = await this.prisma.billingProfile.findUnique({ where: { organizationId } });
    if (profile?.stripeCustomerId) return profile.stripeCustomerId;

    const customer = await this.sdk.customers.create({ email, name, metadata: { organizationId } });

    await this.prisma.billingProfile.upsert({
      where:  { organizationId },
      update: { stripeCustomerId: customer.id },
      create: { organizationId, stripeCustomerId: customer.id, billingEmail: email },
    });

    return customer.id;
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  async createSubscriptionCheckout(
    organizationId: string,
    email:          string,
    priceId:        string,
    successUrl:     string,
    cancelUrl:      string,
  ): Promise<string> {
    const customerId = await this.getOrCreateCustomer(organizationId, email);

    const session = await this.sdk.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  cancelUrl,
      metadata:   { organizationId },
      subscription_data: { metadata: { organizationId } },
    });

    return session.url;
  }

  async cancelSubscription(organizationId: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { organizationId } });
    if (!sub?.stripeSubscriptionId) return;

    await this.sdk.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { organizationId },
      data:  { cancelledAt: new Date() },
    });
  }

  async getSubscription(organizationId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { organizationId } });
    if (!sub?.stripeSubscriptionId) return null;
    return this.sdk.subscriptions.retrieve(sub.stripeSubscriptionId);
  }

  async createPortalSession(organizationId: string, returnUrl: string): Promise<string> {
    const profile = await this.prisma.billingProfile.findUnique({ where: { organizationId } });
    if (!profile?.stripeCustomerId) throw new Error('No Stripe customer found');

    const session = await this.sdk.billingPortal.sessions.create({
      customer:   profile.stripeCustomerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  // ── Credit purchases (one-time) ───────────────────────────────────────────

  async createCreditCheckout(
    organizationId: string,
    email:          string,
    bundleId:       string,
    successUrl:     string,
    cancelUrl:      string,
  ): Promise<string> {
    const bundle = await this.prisma.creditBundle.findUnique({ where: { id: bundleId } });
    if (!bundle || !bundle.isActive) throw new Error('Bundle not found');

    const customerId = await this.getOrCreateCustomer(organizationId, email);

    // Use pre-configured Stripe price or create on the fly
    let priceId = bundle.stripePriceId;
    if (!priceId) {
      const price = await this.sdk.prices.create({
        currency:     'usd',
        unit_amount:  Math.round(bundle.priceUsd * 100 * (1 - bundle.discountPct / 100)),
        product_data: { name: bundle.name },
      });
      priceId = price.id;
    }

    const session = await this.sdk.checkout.sessions.create({
      customer:   customerId,
      mode:       'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  cancelUrl,
      metadata:   { organizationId, bundleId, type: 'CREDIT_PURCHASE' },
    });

    return session.url;
  }

  // ── Invoice retrieval ─────────────────────────────────────────────────────

  async listInvoices(organizationId: string, limit = 10) {
    const profile = await this.prisma.billingProfile.findUnique({ where: { organizationId } });
    if (!profile?.stripeCustomerId) return [];

    const invoices = await this.sdk.invoices.list({ customer: profile.stripeCustomerId, limit });
    return invoices.data.map((inv: any) => ({
      id:          inv.id,
      amount:      inv.amount_paid / 100,
      currency:    inv.currency.toUpperCase(),
      status:      inv.status,
      date:        new Date(inv.created * 1000),
      pdfUrl:      inv.invoice_pdf,
      hostedUrl:   inv.hosted_invoice_url,
    }));
  }

  // ── Payment methods ───────────────────────────────────────────────────────

  async createSetupIntent(organizationId: string, email: string): Promise<string> {
    const customerId = await this.getOrCreateCustomer(organizationId, email);
    const intent = await this.sdk.setupIntents.create({ customer: customerId });
    return intent.client_secret;
  }

  async listPaymentMethods(organizationId: string) {
    const profile = await this.prisma.billingProfile.findUnique({ where: { organizationId } });
    if (!profile?.stripeCustomerId) return [];
    const methods = await this.sdk.paymentMethods.list({ customer: profile.stripeCustomerId, type: 'card' });
    return methods.data;
  }

  // ── Webhook handler ──────────────────────────────────────────────────────

  verifyWebhook(payload: Buffer, signature: string): any {
    return this.sdk.webhooks.constructEvent(
      payload,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET') ?? '',
    );
  }

  async handleWebhookEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.onInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.onInvoiceFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.onSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private async onCheckoutCompleted(session: any) {
    const { organizationId, bundleId, type } = session.metadata ?? {};
    if (!organizationId) return;

    if (type === 'CREDIT_PURCHASE' && bundleId) {
      const bundle = await this.prisma.creditBundle.findUnique({ where: { id: bundleId } });
      if (!bundle) return;

      const total = bundle.credits + bundle.bonusCredits;
      await this.credits.credit({
        organizationId,
        credits:     total,
        type:        CreditTxType.PURCHASE,
        description: `Purchased ${bundle.name} (${total} credits)`,
        bundleId,
        paymentId:   session.payment_intent,
        meta:        { stripeSessionId: session.id },
      });

      this.logger.log(`Granted ${total} credits to org ${organizationId} via Stripe`);
    }
  }

  private async onInvoicePaid(invoice: any) {
    const orgId = invoice.subscription_details?.metadata?.organizationId;
    if (!orgId) return;

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription },
      data:  { status: 'ACTIVE' },
    });
  }

  private async onInvoiceFailed(invoice: any) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription },
      data:  { status: 'PAST_DUE' },
    });
  }

  private async onSubscriptionUpdated(subscription: any) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status:             this.mapSubStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd:   new Date(subscription.current_period_end   * 1000),
      },
    });
  }

  private async onSubscriptionDeleted(subscription: any) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data:  { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  private mapSubStatus(status: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      active:    SubscriptionStatus.ACTIVE,
      past_due:  SubscriptionStatus.PAST_DUE,
      canceled:  SubscriptionStatus.CANCELLED,
      trialing:  SubscriptionStatus.TRIAL,
      paused:    SubscriptionStatus.PAUSED,
    };
    return map[status] ?? SubscriptionStatus.ACTIVE;
  }
}
