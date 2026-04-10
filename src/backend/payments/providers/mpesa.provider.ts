import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';
import { IPaymentProvider } from '../interfaces/payment-provider.interface';
import {
  CreateCustomerRequest,
  CreatePaymentRequest,
  CreateSubscriptionRequest,
  CustomerResponse,
  PaymentMethodRequest,
  PaymentMethodResponse,
  PaymentProvider,
  PaymentResponse,
  PaymentStatus,
  PaymentWebhookEvent,
  RefundRequest,
  RefundResponse,
  RefundStatus,
  SubscriptionResponse,
  WebhookVerificationRequest,
  WebhookVerificationResponse,
} from '../types/payment.types';
import { ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class MpesaProvider implements IPaymentProvider {
  private readonly client: AxiosInstance;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly passkey: string;
  private readonly shortCode: string;
  private readonly callbackUrl: string;
  private readonly baseUrl: string;

  constructor() {
    const env = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
    this.baseUrl = env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.shortCode = process.env.MPESA_SHORT_CODE || '';
    this.callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.PUBLIC_API_BASE_URL || process.env.APP_URL || 'http://localhost:3001'}/api/v1/payments/webhooks/mpesa`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 12000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  getProvider(): PaymentProvider {
    return PaymentProvider.MPESA;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    const phone = String(
      request.metadata?.phone || request.metadata?.msisdn || request.metadata?.paymentMethodId || '',
    ).replace(/\s+/g, '');

    if (!this.isConfigured() || !phone) {
      throw new ServiceUnavailableException(
        !phone ? 'Missing MSISDN/payment method for M-Pesa checkout' : 'M-Pesa provider is not configured',
      );
    }

    const token = await this.getAccessToken();
    const timestamp = this.mpesaTimestamp();
    const password = Buffer.from(`${this.shortCode}${this.passkey}${timestamp}`).toString('base64');

    const response = await this.client.post(
      '/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.max(1, Math.round(request.amount)),
        PartyA: phone,
        PartyB: this.shortCode,
        PhoneNumber: phone,
        CallBackURL: this.callbackUrl,
        AccountReference: request.subscriptionId,
        TransactionDesc: `BelSuite billing ${request.subscriptionId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = response.data;
    return {
      id: `mpesa_${data.CheckoutRequestID || uuid()}`,
      externalPaymentId: data.CheckoutRequestID || data.MerchantRequestID || `mpesa_${uuid()}`,
      status: PaymentStatus.PENDING,
      amount: request.amount,
      currency: request.currency,
      provider: PaymentProvider.MPESA,
      metadata: {
        ...(request.metadata || {}),
        merchantRequestId: data.MerchantRequestID,
        checkoutRequestId: data.CheckoutRequestID,
        customerMessage: data.CustomerMessage,
      },
    };
  }

  async getPayment(externalPaymentId: string): Promise<PaymentResponse> {
    return {
      id: `mpesa_${externalPaymentId}`,
      externalPaymentId,
      status: PaymentStatus.PENDING,
      amount: 0,
      currency: 'KES',
      provider: PaymentProvider.MPESA,
    };
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    return {
      id: `mpesa_refund_${uuid()}`,
      externalRefundId: `mpesa_refund_${Date.now()}`,
      status: RefundStatus.PROCESSING,
      amount: request.amount || 0,
      currency: 'KES',
      provider: PaymentProvider.MPESA,
    };
  }

  async createCustomer(request: CreateCustomerRequest): Promise<CustomerResponse> {
    return {
      externalCustomerId: `mpesa_customer_${uuid()}`,
      email: request.email,
      provider: PaymentProvider.MPESA,
    };
  }

  async addPaymentMethod(customerId: string, request: PaymentMethodRequest): Promise<PaymentMethodResponse> {
    const phone = request.metadata?.phoneNumber?.toString() || request.metadata?.msisdn?.toString() || '';
    return {
      externalPaymentMethodId: phone || `mpesa_pm_${customerId}`,
      provider: PaymentProvider.MPESA,
      last4: phone.slice(-4) || undefined,
      brand: 'MPESA',
    };
  }

  async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    const start = new Date();
    const end = new Date(start);
    if (request.trialDays && request.trialDays > 0) {
      end.setDate(end.getDate() + request.trialDays);
    } else {
      end.setMonth(end.getMonth() + 1);
    }

    return {
      externalSubscriptionId: `mpesa_sub_${uuid()}`,
      status: request.trialDays && request.trialDays > 0 ? 'trialing' : 'pending_payment',
      currentPeriodStart: start,
      currentPeriodEnd: end,
      provider: PaymentProvider.MPESA,
      nextPaymentDate: end,
    };
  }

  async cancelSubscription(_externalSubscriptionId: string): Promise<void> {
    return;
  }

  async verifyWebhookSignature(_request: WebhookVerificationRequest): Promise<WebhookVerificationResponse> {
    return {
      isValid: true,
      provider: PaymentProvider.MPESA,
    };
  }

  async parseWebhookPayload(rawPayload: any): Promise<PaymentWebhookEvent> {
    const callback = rawPayload?.Body?.stkCallback || rawPayload?.stkCallback || rawPayload;
    const success = callback?.ResultCode === 0 || callback?.ResultCode === '0';

    return {
      type: success ? 'charge.success' : 'charge.failed',
      provider: PaymentProvider.MPESA,
      externalWebhookId: callback?.CheckoutRequestID || uuid(),
      externalPaymentId: callback?.CheckoutRequestID,
      status: success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
      amount: Number(callback?.CallbackMetadata?.Item?.find?.((item: any) => item.Name === 'Amount')?.Value || 0),
      currency: 'KES',
      metadata: rawPayload,
      timestamp: new Date(),
      raw: rawPayload,
    };
  }

  getWebhookSecret(): string {
    return this.consumerSecret;
  }

  async healthCheck(): Promise<boolean> {
    return this.isConfigured();
  }

  private isConfigured() {
    return Boolean(this.consumerKey && this.consumerSecret && this.passkey && this.shortCode);
  }

  private async getAccessToken() {
    const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const response = await this.client.get('/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
    return response.data.access_token as string;
  }

  private mpesaTimestamp() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
  }
}