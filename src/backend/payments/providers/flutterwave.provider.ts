/**
 * Flutterwave Payment Provider Implementation
 * https://docs.flutterwave.com
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
export class FlutterwaveProvider implements IPaymentProvider {
  private client: AxiosInstance;
  private baseUrl = 'https://api.flutterwave.com/v3';
  private secretKey: string;
  private webhookSecret: string;

  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    this.webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';
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
    return PaymentProvider.FLUTTERWAVE;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const txRef = `belsuite_${uuid()}`;

      const response = await this.client.post('/payments', {
        tx_ref: txRef,
        amount: request.amount,
        currency: request.currency,
        description: `Belsuite subscription - ${request.subscriptionId}`,
        customer: {
          email: request.metadata?.email || 'customer@example.com',
          name: request.metadata?.name || 'Customer',
        },
        customizations: {
          title: 'Belsuite',
          logo: 'https://belsuite.com/logo.png',
        },
        meta: {
          organizationId: request.organizationId,
          subscriptionId: request.subscriptionId,
          ...request.metadata,
        },
        redirect_url: `${process.env.APP_URL}/payments/flutterwave/callback`,
      });

      const data = response.data.data;

      return {
        id: `flutterwave_${data.id}`,
        externalPaymentId: data.id.toString(),
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        provider: PaymentProvider.FLUTTERWAVE,
        redirectUrl: data.link,
        metadata: request.metadata,
      };
    } catch (error) {
      throw new Error(
        `Flutterwave payment creation failed: ${error.message}`,
      );
    }
  }

  async getPayment(externalPaymentId: string): Promise<PaymentResponse> {
    try {
      const response = await this.client.get(
        `/transactions/${externalPaymentId}/verify`,
      );

      const data = response.data.data;
      const status = this.mapFlutterwaveStatus(data.status);

      return {
        id: `flutterwave_${data.id}`,
        externalPaymentId: data.id.toString(),
        status: status,
        amount: data.amount,
        currency: data.currency,
        provider: PaymentProvider.FLUTTERWAVE,
        metadata: data.meta,
      };
    } catch (error) {
      throw new Error(`Flutterwave payment fetch failed: ${error.message}`);
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await this.client.post(
        `/transactions/${request.paymentId}/refund`,
        {
          amount: request.amount,
        },
      );

      const data = response.data.data;

      return {
        id: `flutterwave_refund_${data.id}`,
        externalRefundId: data.id.toString(),
        status: RefundStatus.PROCESSING,
        amount: request.amount || data.amount,
        currency: data.currency || 'NGN',
        provider: PaymentProvider.FLUTTERWAVE,
      };
    } catch (error) {
      throw new Error(`Flutterwave refund failed: ${error.message}`);
    }
  }

  async createCustomer(
    request: CreateCustomerRequest,
  ): Promise<CustomerResponse> {
    try {
      const response = await this.client.post('/customers', {
        email: request.email,
        name: request.name,
        phone_number: request.phone,
      });
      const data = response.data?.data ?? {};
      return {
        externalCustomerId: String(data.id ?? data.customer_code ?? request.email),
        email: data.email ?? request.email,
        provider: PaymentProvider.FLUTTERWAVE,
      };
    } catch (error) {
      throw new Error(`Flutterwave customer creation failed: ${(error as Error).message}`);
    }
  }

  async addPaymentMethod(
    customerId: string,
    request: PaymentMethodRequest,
  ): Promise<PaymentMethodResponse> {
    throw new Error('Flutterwave does not support direct payment method attachment via this integration');
  }

  async createSubscription(
    request: CreateSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    try {
      const txRef = `belsuite_sub_${uuid()}`;

      const response = await this.client.post('/subscription/create', {
        tx_ref: txRef,
        amount: request.planId, // In Flutterwave, amount comes from plan
        plan_token: request.paymentMethodId,
        customer: {
          email: request.customerId,
        },
        meta: {
          organizationId: request.customerId,
        },
      });

      const data = response.data.data;

      return {
        externalSubscriptionId: data.id.toString(),
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        provider: PaymentProvider.FLUTTERWAVE,
      };
    } catch (error) {
      throw new Error(
        `Flutterwave subscription creation failed: ${error.message}`,
      );
    }
  }

  async cancelSubscription(externalSubscriptionId: string): Promise<void> {
    try {
      await this.client.put(`/subscriptions/${externalSubscriptionId}/cancel`);
    } catch (error) {
      throw new Error(
        `Flutterwave subscription cancellation failed: ${error.message}`,
      );
    }
  }

  async verifyWebhookSignature(
    request: WebhookVerificationRequest,
  ): Promise<WebhookVerificationResponse> {
    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(request.payload)
      .digest('hex');

    const isValid = hash === request.signature;

    return {
      isValid,
      provider: PaymentProvider.FLUTTERWAVE,
    };
  }

  async parseWebhookPayload(rawPayload: any): Promise<PaymentWebhookEvent> {
    const { event, data } = rawPayload;

    let status = PaymentStatus.PENDING;
    if (event === 'charge.completed') {
      status = PaymentStatus.COMPLETED;
    } else if (event === 'charge.failed') {
      status = PaymentStatus.FAILED;
    }

    return {
      type: event,
      provider: PaymentProvider.FLUTTERWAVE,
      externalPaymentId: data.id?.toString(),
      status: status,
      amount: data.amount,
      currency: data.currency,
      metadata: data.meta,
      timestamp: new Date(data.created_at),
      raw: rawPayload,
    };
  }

  getWebhookSecret(): string {
    return this.webhookSecret;
  }

  private mapFlutterwaveStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      successful: PaymentStatus.COMPLETED,
      pending: PaymentStatus.PENDING,
      failed: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
    };
    return statusMap[status] || PaymentStatus.PENDING;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/banks/UG');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
