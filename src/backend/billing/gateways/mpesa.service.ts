import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }       from '@nestjs/config';
import { PrismaService }       from '../../database/prisma.service';
import { CreditService }       from '../services/credit.service';
import { CreditTxType, MpesaPaymentStatus } from '@prisma/client';

const SANDBOX  = 'https://sandbox.safaricom.co.ke';
const PROD     = 'https://api.safaricom.co.ke';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly config:  ConfigService,
    private readonly prisma:  PrismaService,
    private readonly credits: CreditService,
  ) {
    this.baseUrl = this.config.get('MPESA_ENV') === 'production' ? PROD : SANDBOX;
  }

  // ── OAuth token ───────────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    const key    = this.config.get('MPESA_CONSUMER_KEY')    ?? '';
    const secret = this.config.get('MPESA_CONSUMER_SECRET') ?? '';
    const creds  = Buffer.from(`${key}:${secret}`).toString('base64');

    const res = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${creds}` } },
    );
    if (!res.ok) throw new Error(`M-Pesa token error: ${await res.text()}`);
    const data = (await res.json()) as any;
    return data.access_token;
  }

  // ── STK Push (Lipa na M-Pesa Online) ─────────────────────────────────────

  async stkPush(opts: {
    organizationId: string;
    phoneNumber:    string;   // 2547XXXXXXXX
    amountKes:      number;
    bundleId?:      string;
    description?:   string;
  }): Promise<{ checkoutRequestId: string; merchantRequestId: string }> {
    const token       = await this.getToken();
    const shortCode   = this.config.get('MPESA_SHORTCODE')       ?? '';
    const passkey     = this.config.get('MPESA_PASSKEY')         ?? '';
    const callbackUrl = this.config.get('MPESA_CALLBACK_URL')    ?? '';

    const timestamp   = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password    = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const body = {
      BusinessShortCode: shortCode,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            Math.ceil(opts.amountKes),
      PartyA:            opts.phoneNumber,
      PartyB:            shortCode,
      PhoneNumber:       opts.phoneNumber,
      CallBackURL:       callbackUrl,
      AccountReference:  'BelSuite',
      TransactionDesc:   opts.description ?? 'Credit purchase',
    };

    const res = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`M-Pesa STK push error: ${await res.text()}`);
    const data = (await res.json()) as any;

    // Persist payment record
    await this.prisma.mpesaPayment.create({
      data: {
        organizationId:    opts.organizationId,
        phoneNumber:       opts.phoneNumber,
        amountKes:         opts.amountKes,
        merchantRequestId: data.MerchantRequestID,
        checkoutRequestId: data.CheckoutRequestID,
        creditBundleId:    opts.bundleId,
        status:            MpesaPaymentStatus.PENDING,
      },
    });

    return {
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
    };
  }

  // ── Webhook callback from Safaricom ──────────────────────────────────────

  async handleCallback(payload: any): Promise<void> {
    const stk   = payload?.Body?.stkCallback;
    if (!stk)   return;

    const checkoutRequestId = stk.CheckoutRequestID;
    const resultCode        = stk.ResultCode;
    const resultDesc        = stk.ResultDesc;

    const record = await this.prisma.mpesaPayment.findUnique({ where: { checkoutRequestId } });
    if (!record) return;

    if (resultCode === 0) {
      // Success — extract receipt
      const items   = stk.CallbackMetadata?.Item ?? [];
      const get     = (name: string) => items.find((i: any) => i.Name === name)?.Value;
      const receipt = get('MpesaReceiptNumber');
      const amount  = get('Amount');
      const date    = get('TransactionDate');

      await this.prisma.mpesaPayment.update({
        where: { checkoutRequestId },
        data: {
          status:               MpesaPaymentStatus.SUCCESS,
          mpesaReceiptNumber:   receipt,
          amountKes:            amount ?? record.amountKes,
          transactionDate:      date ? new Date(String(date)) : new Date(),
          resultCode,
          resultDesc,
        },
      });

      // Grant credits
      if (record.creditBundleId) {
        const bundle = await this.prisma.creditBundle.findUnique({ where: { id: record.creditBundleId } });
        if (bundle) {
          const total = bundle.credits + bundle.bonusCredits;
          await this.credits.credit({
            organizationId: record.organizationId,
            credits:     total,
            type:        CreditTxType.PURCHASE,
            description: `Purchased ${bundle.name} via M-Pesa`,
            bundleId:    record.creditBundleId,
            meta:        { receipt, amountKes: amount, phone: record.phoneNumber },
          });
          await this.prisma.mpesaPayment.update({
            where: { checkoutRequestId },
            data:  { creditsGranted: total },
          });
        }
      }
    } else {
      const failStatus = resultCode === 1032
        ? MpesaPaymentStatus.CANCELLED
        : MpesaPaymentStatus.FAILED;

      await this.prisma.mpesaPayment.update({
        where: { checkoutRequestId },
        data:  { status: failStatus, resultCode, resultDesc },
      });
    }
  }

  // ── Query status ──────────────────────────────────────────────────────────

  async queryStatus(checkoutRequestId: string): Promise<any> {
    const token     = await this.getToken();
    const shortCode = this.config.get('MPESA_SHORTCODE') ?? '';
    const passkey   = this.config.get('MPESA_PASSKEY')   ?? '';
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password  = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const res = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortCode,
        Password:          password,
        Timestamp:         timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });
    return res.json();
  }
}
