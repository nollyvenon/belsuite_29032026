import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }       from '@nestjs/config';
import { PrismaService }       from '../../database/prisma.service';
import { CreditService }       from '../services/credit.service';
import { CreditTxType, CryptoPaymentStatus } from '@prisma/client';

@Injectable()
export class CryptoPaymentService {
  private readonly logger = new Logger(CryptoPaymentService.name);

  constructor(
    private readonly config:  ConfigService,
    private readonly prisma:  PrismaService,
    private readonly credits: CreditService,
  ) {}

  // ── Coinbase Commerce ─────────────────────────────────────────────────────

  async createCoinbaseCharge(opts: {
    organizationId: string;
    amountUsd:      number;
    bundleId?:      string;
    name:           string;
    description?:   string;
    redirectUrl?:   string;
    cancelUrl?:     string;
  }): Promise<{ chargeId: string; hostedUrl: string; expiresAt: Date }> {
    const apiKey = this.config.get('COINBASE_COMMERCE_API_KEY') ?? '';

    const res = await fetch('https://api.commerce.coinbase.com/charges', {
      method:  'POST',
      headers: {
        'X-CC-Api-Key':    apiKey,
        'X-CC-Version':    '2018-03-22',
        'Content-Type':    'application/json',
      },
      body: JSON.stringify({
        name:           opts.name,
        description:    opts.description ?? 'BelSuite credit purchase',
        pricing_type:   'fixed_price',
        local_price:    { amount: String(opts.amountUsd), currency: 'USD' },
        metadata:       { organizationId: opts.organizationId, bundleId: opts.bundleId },
        redirect_url:   opts.redirectUrl,
        cancel_url:     opts.cancelUrl,
      }),
    });

    if (!res.ok) throw new Error(`Coinbase Commerce error: ${await res.text()}`);
    const data  = await res.json();
    const charge = data.data;

    const expiresAt = new Date(charge.expires_at);

    await this.prisma.cryptoPayment.create({
      data: {
        organizationId: opts.organizationId,
        provider:       'COINBASE',
        chargeId:       charge.id,
        amountUsd:      opts.amountUsd,
        currency:       'MULTI',
        hostedUrl:      charge.hosted_url,
        expiresAt,
        creditBundleId: opts.bundleId,
        status:         CryptoPaymentStatus.PENDING,
      },
    });

    return { chargeId: charge.id, hostedUrl: charge.hosted_url, expiresAt };
  }

  async handleCoinbaseWebhook(rawBody: string, signature: string): Promise<void> {
    // Verify signature
    const crypto  = require('crypto');
    const secret  = this.config.get('COINBASE_WEBHOOK_SECRET') ?? '';
    const hash    = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (hash !== signature) throw new Error('Invalid Coinbase webhook signature');

    const event = JSON.parse(rawBody);
    const { type, data } = event;
    const chargeId = data?.event?.data?.id ?? data?.id;

    const payment = await this.prisma.cryptoPayment.findUnique({ where: { chargeId } });
    if (!payment) return;

    if (type === 'charge:confirmed' || type === 'charge:resolved') {
      await this.prisma.cryptoPayment.update({
        where: { chargeId },
        data:  { status: CryptoPaymentStatus.CONFIRMED, confirmedAt: new Date() },
      });
      await this.grantCredits(payment);
    } else if (type === 'charge:failed') {
      await this.prisma.cryptoPayment.update({
        where: { chargeId },
        data:  { status: CryptoPaymentStatus.FAILED },
      });
    } else if (type === 'charge:pending') {
      await this.prisma.cryptoPayment.update({
        where: { chargeId },
        data:  { status: CryptoPaymentStatus.WAITING },
      });
    }
  }

  // ── NOWPayments ───────────────────────────────────────────────────────────

  async createNowPayment(opts: {
    organizationId:  string;
    amountUsd:       number;
    currency?:       string;   // "BTC" | "ETH" | "USDT" etc.
    bundleId?:       string;
    successUrl?:     string;
    cancelUrl?:      string;
  }): Promise<{ paymentId: string; paymentUrl: string; payAddress: string; payAmount: number; payCurrency: string }> {
    const apiKey = this.config.get('NOWPAYMENTS_API_KEY') ?? '';

    const res = await fetch('https://api.nowpayments.io/v1/invoice', {
      method:  'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_amount:    opts.amountUsd,
        price_currency:  'usd',
        pay_currency:    opts.currency ?? 'btc',
        order_id:        `belsuite-${opts.organizationId}-${Date.now()}`,
        order_description: 'BelSuite credit purchase',
        ipn_callback_url:  this.config.get('NOWPAYMENTS_IPN_URL'),
        success_url:     opts.successUrl,
        cancel_url:      opts.cancelUrl,
      }),
    });
    if (!res.ok) throw new Error(`NOWPayments error: ${await res.text()}`);
    const data = await res.json();

    await this.prisma.cryptoPayment.create({
      data: {
        organizationId:  opts.organizationId,
        provider:        'NOWPAYMENTS',
        paymentId:       String(data.id),
        amountUsd:       opts.amountUsd,
        currency:        opts.currency ?? 'BTC',
        cryptoAddress:   data.pay_address,
        cryptoAmount:    data.pay_amount,
        hostedUrl:       data.invoice_url,
        creditBundleId:  opts.bundleId,
        status:          CryptoPaymentStatus.PENDING,
      },
    });

    return {
      paymentId:   String(data.id),
      paymentUrl:  data.invoice_url,
      payAddress:  data.pay_address,
      payAmount:   data.pay_amount,
      payCurrency: data.pay_currency,
    };
  }

  async handleNowPaymentsIpn(payload: any): Promise<void> {
    const paymentId = String(payload.payment_id);
    const payment   = await this.prisma.cryptoPayment.findUnique({ where: { paymentId } });
    if (!payment) return;

    const status = payload.payment_status;
    if (status === 'finished' || status === 'confirmed') {
      await this.prisma.cryptoPayment.update({
        where: { paymentId },
        data:  { status: CryptoPaymentStatus.CONFIRMED, confirmedAt: new Date() },
      });
      await this.grantCredits(payment);
    } else if (status === 'failed' || status === 'refunded') {
      await this.prisma.cryptoPayment.update({
        where: { paymentId },
        data:  { status: CryptoPaymentStatus.FAILED },
      });
    } else if (status === 'waiting' || status === 'confirming') {
      await this.prisma.cryptoPayment.update({
        where: { paymentId },
        data:  { status: CryptoPaymentStatus.CONFIRMING },
      });
    } else if (status === 'expired') {
      await this.prisma.cryptoPayment.update({
        where: { paymentId },
        data:  { status: CryptoPaymentStatus.EXPIRED },
      });
    }
  }

  // ── Shared credit grant ───────────────────────────────────────────────────

  private async grantCredits(payment: any): Promise<void> {
    if (payment.creditsGranted) return; // idempotent

    let credits = 0;
    let bundleName = 'Crypto purchase';

    if (payment.creditBundleId) {
      const bundle = await this.prisma.creditBundle.findUnique({ where: { id: payment.creditBundleId } });
      if (bundle) {
        credits    = bundle.credits + bundle.bonusCredits;
        bundleName = bundle.name;
      }
    } else {
      // Derive from USD amount using global rate
      const rateRow = await this.prisma.billingConfig.findUnique({ where: { key: 'CREDITS_PER_USD' } });
      const rate    = rateRow ? parseFloat(rateRow.value) : 100;
      credits       = payment.amountUsd * rate;
    }

    if (credits <= 0) return;

    await this.credits.credit({
      organizationId: payment.organizationId,
      credits,
      type:           CreditTxType.PURCHASE,
      description:    `${bundleName} via ${payment.provider}`,
      bundleId:       payment.creditBundleId ?? undefined,
      meta:           { provider: payment.provider, amountUsd: payment.amountUsd },
    });

    await this.prisma.cryptoPayment.update({
      where: { id: payment.id },
      data:  { creditsGranted: credits },
    });
  }
}
