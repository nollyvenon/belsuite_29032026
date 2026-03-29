/**
 * Paystack Payment Provider Implementation
 * https://paystack.com/docs/api
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

@Injectable()
export class PaystackProvider implements IPaymentProvider {
  private client: AxiosInstance;
  private baseUrl = 'https://api.paystack.co';
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  getProvider(): PaymentProvider {
    return PaymentProvider.PAYSTACK;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await this.client.post('/transaction/initialize', {
        amount: Math.round(request.amount * 100), // Paystack uses cents
        email: request.metadata?.email || 'customer@example.com',
        currency: request.currency,
        metadata: {
          organizationId: request.organizationId,
          subscriptionId: request.subscriptionId,
          ...request.metadata,
        },
      });

      const data = response.data.data;

      return {
        id: `paystack_${data.reference}`,
        externalPaymentId: data.reference,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        provider: PaymentProvider.PAYSTACK,
        redirectUrl: data.authorization_url,
        metadata: request.metadata,
      };
    } catch (error) {
      throw new Error(`Paystack payment creation failed: ${error.message}`);
    }
  }

  async getPayment(externalPaymentId: string): Promise<PaymentResponse> {
    try {
      const response = await this.client.get(
        `/transaction/verify/${externalPaymentId}`,
      );

      const data = response.data.data;
      const status = this.mapPaystackStatus(data.status);

      return {
        id: `paystack_${data.reference}`,
        externalPaymentId: data.reference,
        status: status,
        amount: data.amount / 100, // Convert from cents
        currency: data.currency,
        provider: PaymentProvider.PAYSTACK,
        metadata: data.metadata,
      };
    } catch (error) {
      throw new Error(`Paystack payment fetch failed: ${error.message}`);
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      // For Paystack, refunds are initiated via the API
      const response = await this.client.post('/refund', {
        transaction: request.paymentId,
        amount: request.amount ? Math.round(request.amount * 100) : undefined,
      });

      const data = response.data.data;

      return {
        id: `paystack_refund_${data.refund_key}`,
        externalRefundId: data.refund_key,
        status: RefundStatus.PROCESSING,
        amount: (data.amount || 0) / 100,
        currency: 'NGN', // Default to Nigerian Naira
        provider: PaymentProvider.PAYSTACK,
      };
    } catch (error) {
      throw new Error(`Paystack refund failed: ${error.message}`);
    }
  }

  async createCustomer(
    request: CreateCustomerRequest,
  ): Promise<CustomerResponse> {
    try {
      const response = await this.client.post('/customer', {
        email: request.email,
        first_name: request.name.split(' ')[0],
        last_name: request.name.split(' ')[1] || '',
        description: request.description,
      });

      const data = response.data.data;

      return {
        externalCustomerId: data.customer_code,
        email: data.email,
        provider: PaymentProvider.PAYSTACK,
      };
    } catch (error) {
      throw new Error(`Paystack customer creation failed: ${error.message}`);
    }
  }

  async addPaymentMethod(
    customerId: string,
    request: PaymentMethodRequest,
  ): Promise<PaymentMethodResponse> {
    // Paystack doesn't have direct payment method storage like other providers
    // Payment methods are created during transaction initialization
    // Return a placeholder response
    return {
      externalPaymentMethodId: `paystack_pm_${customerId}`,
      provider: PaymentProvider.PAYSTACK,
    };
  }

  async createSubscription(
    request: CreateSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    try {
      const response = await this.client.post('/subscription/create', {
        customer: request.customerId,
        plan: request.planId,
        authorization: request.paymentMethodId,
      });

      const data = response.data.data;

      return {
        externalSubscriptionId: data.subscription_code,
        status: data.status,
        currentPeriodStart: new Date(data.createdAt),
        currentPeriodEnd: new Date(data.next_payment_date),
        provider: PaymentProvider.PAYSTACK,
        nextPaymentDate: new Date(data.next_payment_date),
      };
    } catch (error) {
      throw new Error(
        `Paystack subscription creation failed: ${error.message}`,
      );
    }
  }

  async cancelSubscription(externalSubscriptionId: string): Promise<void> {
    try {
      await this.client.post(
        `/subscription/${externalSubscriptionId}/disable`,
        { token: externalSubscriptionId },
      );
    } catch (error) {
      throw new Error(`Paystack subscription cancellation failed: ${error.message}`);
    }
  }

  async verifyWebhookSignature(
    request: WebhookVerificationRequest,
  ): Promise<WebhookVerificationResponse> {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(request.payload)
      .digest('hex');

    const isValid = hash === request.signature;

    return {
      isValid,
      provider: PaymentProvider.PAYSTACK,
    };
  }

  async parseWebhookPayload(rawPayload: any): Promise<PaymentWebhookEvent> {
    const { event, data } = rawPayload;

    let status = PaymentStatus.PENDING;
    if (event === 'charge.success') {
      status = PaymentStatus.COMPLETED;
    } else if (event === 'charge.failed') {
      status = PaymentStatus.FAILED;
    }

    return {
      type: event,
      provider: PaymentProvider.PAYSTACK,
      externalPaymentId: data.reference,
      status: status,
      amount: data.amount / 100,
      currency: data.currency,
      metadata: data.metadata,
      timestamp: new Date(data.paid_at),
      raw: rawPayload,
    };
  }

  getWebhookSecret(): string {
    return this.secretKey;
  }

  private mapPaystackStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      success: PaymentStatus.COMPLETED,
      pending: PaymentStatus.PENDING,
      failed: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
    };
    return statusMap[status] || PaymentStatus.PENDING;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/bank');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
