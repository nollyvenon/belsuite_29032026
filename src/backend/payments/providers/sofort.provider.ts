/**
 * Sofort Payment Provider Implementation
 * https://www.klarna.com/sofort/
 */

import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { IPaymentProvider } from '../interfaces/payment-provider.interface';
import {
  PaymentProvider,
  PaymentStatus,
  RefundStatus,
  CreatePaymentRequest,
  PaymentResponse,
  RefundResponse,
  RefundRequest,
  PaymentWebhookEvent,
  CreateCustomerRequest,
  CustomerResponse,
  PaymentMethodRequest,
  PaymentMethodResponse,
  CreateSubscriptionRequest,
  SubscriptionResponse,
  WebhookVerificationRequest,
  WebhookVerificationResponse,
} from '../types/payment.types';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SofortProvider implements IPaymentProvider {
  private client: AxiosInstance;
  private baseUrl = 'https://api.sofort.com';
  private merchantId: string;
  private apiKey: string;

  constructor() {
    this.merchantId = process.env.SOFORT_MERCHANT_ID || '';
    this.apiKey = process.env.SOFORT_API_KEY || '';

    const authString = Buffer.from(`${this.merchantId}:${this.apiKey}`).toString(
      'base64',
    );

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 10000,
    });
  }

  getProvider(): PaymentProvider {
    return PaymentProvider.SOFORT;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const transactionId = uuid();

      const response = await this.client.post('/rest/transactions', {
        transaction: {
          amount: Math.round(request.amount * 100), // Sofort uses cents
          currency: request.currency,
          reason1: `Belsuite - ${request.subscriptionId}`,
          reason2: request.organizationId,
          user_id: request.metadata?.userId,
          email: request.metadata?.email,
          phone: request.metadata?.phone,
          country_code: request.metadata?.countryCode || 'DE',
          success_url: `${process.env.APP_URL}/payments/sofort/success?transactionId=${transactionId}`,
          abort_url: `${process.env.APP_URL}/payments/sofort/abort`,
          notification_urls: [
            `${process.env.API_URL}/webhooks/sofort`,
          ],
          interface: 'json',
          version: '220',
        },
      });

      const data = response.data.new_transaction;

      return {
        id: `sofort_${data.transaction_id}`,
        externalPaymentId: data.transaction_id,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        provider: PaymentProvider.SOFORT,
        redirectUrl: data.payment_url,
        metadata: request.metadata,
      };
    } catch (error) {
      throw new Error(`Sofort payment creation failed: ${error.message}`);
    }
  }

  async getPayment(externalPaymentId: string): Promise<PaymentResponse> {
    try {
      const response = await this.client.get(
        `/rest/transactions/${externalPaymentId}`,
      );

      const data = response.data.transactions[0];
      const status = this.mapSofortStatus(data.status);

      return {
        id: `sofort_${data.transaction_id}`,
        externalPaymentId: data.transaction_id,
        status: status,
        amount: data.amount / 100, // Convert from cents
        currency: data.currency_code,
        provider: PaymentProvider.SOFORT,
      };
    } catch (error) {
      throw new Error(`Sofort payment fetch failed: ${error.message}`);
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await this.client.post(
        `/rest/transactions/${request.paymentId}/refund`,
        {
          refund: {
            amount: Math.round((request.amount || 0) * 100),
            reason: request.reason || 'Customer requested refund',
          },
        },
      );

      const data = response.data.new_refund;

      return {
        id: `sofort_refund_${data.refund_id}`,
        externalRefundId: data.refund_id,
        status: RefundStatus.PROCESSING,
        amount: (data.amount || 0) / 100,
        currency: 'EUR',
        provider: PaymentProvider.SOFORT,
      };
    } catch (error) {
      throw new Error(`Sofort refund failed: ${error.message}`);
    }
  }

  async createCustomer(
    request: CreateCustomerRequest,
  ): Promise<CustomerResponse> {
    // Sofort doesn't have explicit customer creation
    // Customers are created implicitly during transactions
    return {
      externalCustomerId: `sofort_${uuid()}`,
      email: request.email,
      provider: PaymentProvider.SOFORT,
    };
  }

  async addPaymentMethod(
    customerId: string,
    request: PaymentMethodRequest,
  ): Promise<PaymentMethodResponse> {
    // Sofort bank transfers don't require pre-stored payment methods
    return {
      externalPaymentMethodId: `sofort_pm_${customerId}`,
      provider: PaymentProvider.SOFORT,
    };
  }

  async createSubscription(
    request: CreateSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    // Sofort doesn't have native subscription support
    // Subscriptions would be managed manually or through a separate system
    throw new Error('Subscriptions not supported by Sofort provider');
  }

  async cancelSubscription(externalSubscriptionId: string): Promise<void> {
    throw new Error('Subscriptions not supported by Sofort provider');
  }

  async verifyWebhookSignature(
    request: WebhookVerificationRequest,
  ): Promise<WebhookVerificationResponse> {
    // Sofort uses SHA256 HMAC with API key
    const hash = crypto
      .createHmac('sha256', this.apiKey)
      .update(request.payload)
      .digest('hex');

    const isValid = hash === request.signature;

    return {
      isValid,
      provider: PaymentProvider.SOFORT,
    };
  }

  async parseWebhookPayload(rawPayload: any): Promise<PaymentWebhookEvent> {
    let status = PaymentStatus.PENDING;

    if (
      rawPayload.transaction &&
      rawPayload.transaction.status === 'received'
    ) {
      status = PaymentStatus.COMPLETED;
    } else if (
      rawPayload.transaction &&
      rawPayload.transaction.status === 'abort'
    ) {
      status = PaymentStatus.CANCELLED;
    }

    return {
      type: 'transaction.status',
      provider: PaymentProvider.SOFORT,
      externalPaymentId: rawPayload.transaction_id,
      status: status,
      amount: (rawPayload.amount || 0) / 100,
      currency: rawPayload.currency_code,
      timestamp: new Date(),
      raw: rawPayload,
    };
  }

  getWebhookSecret(): string {
    return this.apiKey;
  }

  private mapSofortStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      received: PaymentStatus.COMPLETED,
      pending: PaymentStatus.PENDING,
      loss: PaymentStatus.FAILED,
      refunded: PaymentStatus.REFUNDED,
      abort: PaymentStatus.CANCELLED,
    };
    return statusMap[status] || PaymentStatus.PENDING;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check by verifying credentials
      const response = await this.client.get('/rest/about');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
