import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }       from '@nestjs/config';
import { PrismaService }       from '../../database/prisma.service';
import { CreditService }       from '../services/credit.service';
import { CreditTxType }        from '@prisma/client';

const BASE = 'https://api.paystack.co';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);

  constructor(
    private readonly config:  ConfigService,
    private readonly prisma:  PrismaService,
    private readonly credits: CreditService,
  ) {}

  // ── Initialize transaction (redirect to Paystack hosted page) ────────────

  async initializePayment(opts: {
    organizationId: string;
    email:          string;
    amountKobo:     number;
    bundleId?:      string;
    callbackUrl:    string;
    metadata?:      Record<string, any>;
  }): Promise<{ authorizationUrl: string; reference: string }> {
    const res = await this.apiFetch('/transaction/initialize', 'POST', {
      email:        opts.email,
      amount:       opts.amountKobo,
      callback_url: opts.callbackUrl,
      metadata:     {
        organizationId: opts.organizationId,
        bundleId:       opts.bundleId,
        type:           'CREDIT_PURCHASE',
        ...(opts.metadata ?? {}),
      },
    });

    return { authorizationUrl: res.data.authorization_url, reference: res.data.reference };
  }

  // ── Verify after redirect ─────────────────────────────────────────────────

  async verifyTransaction(reference: string): Promise<{
    status:  'success' | 'failed';
    amount:  number;   // kobo
    orgId:   string;
    bundleId?: string;
  }> {
    const res = await this.apiFetch(`/transaction/verify/${reference}`, 'GET');
    const d   = res.data;

    return {
      status:   d.status === 'success' ? 'success' : 'failed',
      amount:   d.amount,
      orgId:    d.metadata?.organizationId,
      bundleId: d.metadata?.bundleId,
    };
  }

  async fulfillVerifiedPayment(reference: string): Promise<void> {
    const result = await this.verifyTransaction(reference);
    if (result.status !== 'success' || !result.orgId) return;

    if (result.bundleId) {
      const bundle = await this.prisma.creditBundle.findUnique({ where: { id: result.bundleId } });
      if (bundle) {
        const total = bundle.credits + bundle.bonusCredits;
        await this.credits.credit({
          organizationId: result.orgId,
          credits:     total,
          type:        CreditTxType.PURCHASE,
          description: `Purchased ${bundle.name} via Paystack`,
          bundleId:    result.bundleId,
          meta:        { reference, provider: 'PAYSTACK', amountKobo: result.amount },
        });
      }
    }
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  async createSubscription(opts: {
    organizationId: string;
    email:          string;
    planCode:       string;
    callbackUrl:    string;
  }): Promise<string> {
    const res = await this.apiFetch('/transaction/initialize', 'POST', {
      email:        opts.email,
      plan:         opts.planCode,
      callback_url: opts.callbackUrl,
      metadata:     { organizationId: opts.organizationId, type: 'SUBSCRIPTION' },
    });
    return res.data.authorization_url;
  }

  async cancelSubscription(subscriptionCode: string, token: string): Promise<void> {
    await this.apiFetch('/subscription/disable', 'POST', { code: subscriptionCode, token });
  }

  // ── Webhook verification ──────────────────────────────────────────────────

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const crypto = require('crypto');
    const secret = this.config.get('PAYSTACK_SECRET_KEY') ?? '';
    const hash   = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    return hash === signature;
  }

  async handleWebhookEvent(event: any): Promise<void> {
    if (event.event === 'charge.success') {
      const reference = event.data?.reference;
      if (reference) await this.fulfillVerifiedPayment(reference);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async apiFetch(path: string, method = 'GET', body?: any): Promise<any> {
    const key = this.config.get('PAYSTACK_SECRET_KEY') ?? '';
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`Paystack ${res.status}: ${await res.text()}`);
    return res.json();
  }
}
