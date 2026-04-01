/**
 * Crypto Payment Provider Implementation
 * Coinbase Commerce hosted payments + webhooks
 */

import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
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

type CoinbaseCharge = {
  id: string;
  code: string;
  hosted_url?: string;
  pricing?: {
    local?: {
      amount: string;
      currency: string;
    };
  };
  timeline?: Array<{ status: string; time: string }>;
  metadata?: Record<string, any>;
  payments?: Array<Record<string, any>>;
  web3_data?: {
    contract_addresses?: Record<string, string>;
    payment_addresses?: Record<string, string>;
  };
};

@Injectable()
export class CryptoProvider implements IPaymentProvider {
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor() {
    this.apiKey = process.env.COINBASE_COMMERCE_API_KEY || '';
    this.webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || '';
    this.client = axios.create({
      baseURL: 'https://api.commerce.coinbase.com',
      headers: {
        'X-CC-Api-Key': this.apiKey,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  getProvider(): PaymentProvider {
    return PaymentProvider.CRYPTO;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await this.client.post('/charges', {
        name: 'BelSuite Billing Charge',
        description: `BelSuite billing for subscription ${request.subscriptionId}`,
        pricing_type: 'fixed_price',
        local_price: {
          amount: request.amount.toFixed(2),
          currency: request.currency,
        },
        metadata: {
          organizationId: request.organizationId,
          subscriptionId: request.subscriptionId,
          invoiceId: request.invoiceId,
          ...request.metadata,
        },
        redirect_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing?payment=success`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing?payment=cancelled`,
      });

      const charge = response.data.data as CoinbaseCharge;
      return {
        id: charge.id,
        externalPaymentId: charge.code || charge.id,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        provider: PaymentProvider.CRYPTO,
        redirectUrl: charge.hosted_url,
        metadata: {
          ...request.metadata,
          chargeId: charge.id,
          paymentAddresses: charge.web3_data?.payment_addresses,
          contractAddresses: charge.web3_data?.contract_addresses,
        },
      };
    } catch (error) {
      throw new Error(`Crypto payment creation failed: ${error.message}`);
    }
  }

  async getPayment(externalPaymentId: string): Promise<PaymentResponse> {
    try {
      const response = await this.client.get(`/charges/${externalPaymentId}`);
      const charge = response.data.data as CoinbaseCharge;
      const localPricing = charge.pricing?.local;

      return {
        id: charge.id,
        externalPaymentId: charge.code || charge.id,
        status: this.mapChargeStatus(charge),
        amount: Number(localPricing?.amount || 0),
        currency: localPricing?.currency || 'USD',
        provider: PaymentProvider.CRYPTO,
        redirectUrl: charge.hosted_url,
        metadata: {
          ...(charge.metadata || {}),
          paymentAddresses: charge.web3_data?.payment_addresses,
        },
      };
    } catch (error) {
      throw new Error(`Crypto payment fetch failed: ${error.message}`);
    }
  }

  async refundPayment(_request: RefundRequest): Promise<RefundResponse> {
    throw new Error('Crypto refunds require manual treasury handling');
  }

  async createCustomer(request: CreateCustomerRequest): Promise<CustomerResponse> {
    return {
      externalCustomerId: `crypto_${uuid()}`,
      email: request.email,
      provider: PaymentProvider.CRYPTO,
    };
  }

  async addPaymentMethod(
    customerId: string,
    request: PaymentMethodRequest,
  ): Promise<PaymentMethodResponse> {
    return {
      externalPaymentMethodId: request.metadata?.walletAddress?.toString() || `wallet_${customerId}`,
      provider: PaymentProvider.CRYPTO,
      brand: request.metadata?.network?.toString() || 'CRYPTO',
      last4: request.metadata?.walletAddress?.toString().slice(-4),
    };
  }

  async createSubscription(
    request: CreateSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    const start = new Date();
    const end = new Date(start);

    if (request.trialDays && request.trialDays > 0) {
      end.setDate(end.getDate() + request.trialDays);
      return {
        externalSubscriptionId: `crypto_sub_${uuid()}`,
        status: 'trialing',
        currentPeriodStart: start,
        currentPeriodEnd: end,
        provider: PaymentProvider.CRYPTO,
        nextPaymentDate: end,
      };
    }

    end.setMonth(end.getMonth() + 1);
    return {
      externalSubscriptionId: `crypto_sub_${uuid()}`,
      status: 'pending_payment',
      currentPeriodStart: start,
      currentPeriodEnd: end,
      provider: PaymentProvider.CRYPTO,
      nextPaymentDate: end,
    };
  }

  async cancelSubscription(_externalSubscriptionId: string): Promise<void> {
    return;
  }

  async verifyWebhookSignature(
    request: WebhookVerificationRequest,
  ): Promise<WebhookVerificationResponse> {
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(request.payload)
      .digest('hex');

    const isValid = Boolean(request.signature) && expected === request.signature;
    return {
      isValid,
      provider: PaymentProvider.CRYPTO,
    };
  }

  async parseWebhookPayload(rawPayload: any): Promise<PaymentWebhookEvent> {
    const event = rawPayload.event ?? rawPayload;
    const charge = event.data as CoinbaseCharge;
    const localPricing = charge.pricing?.local;

    return {
      type: event.type,
      provider: PaymentProvider.CRYPTO,
      externalWebhookId: rawPayload.id,
      externalPaymentId: charge.code || charge.id,
      status: this.mapEventStatus(event.type),
      amount: Number(localPricing?.amount || 0),
      currency: localPricing?.currency || 'USD',
      metadata: charge.metadata || {},
      timestamp: new Date(rawPayload.created_at || Date.now()),
      raw: rawPayload,
    };
  }

  getWebhookSecret(): string {
    return this.webhookSecret;
  }

  async healthCheck(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  private mapChargeStatus(charge: CoinbaseCharge): PaymentStatus {
    const latest = charge.timeline?.[charge.timeline.length - 1]?.status;
    return this.mapEventStatus(latest || 'NEW');
  }

  private mapEventStatus(eventType: string): PaymentStatus {
    const normalized = eventType.toUpperCase();

    if (normalized.includes('CONFIRMED') || normalized.includes('RESOLVED') || normalized.includes('COMPLETED')) {
      return PaymentStatus.COMPLETED;
    }

    if (normalized.includes('FAILED') || normalized.includes('EXPIRED') || normalized.includes('CANCELLED')) {
      return PaymentStatus.FAILED;
    }

    if (normalized.includes('PENDING') || normalized.includes('NEW') || normalized.includes('CREATED')) {
      return PaymentStatus.PENDING;
    }

    return PaymentStatus.PROCESSING;
  }
}