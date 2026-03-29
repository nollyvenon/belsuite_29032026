/**
 * PayPal Payment Provider Implementation
 * https://developer.paypal.com/
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
import { v4 as uuid } from 'uuid';

@Injectable()
export class PayPalProvider implements IPaymentProvider {
  private client: AxiosInstance;
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private mode: 'sandbox' | 'live';
  private accessToken: string;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.mode = (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox';
    this.baseUrl =
      this.mode === 'sandbox'
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.clientId,
        password: this.clientSecret,
      },
      timeout: 10000,
    });

    this.accessToken = '';
  }

  getProvider(): PaymentProvider {
    return PaymentProvider.PAYPAL;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await this.client.post('/v1/oauth2/token', 'grant_type=client_credentials', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      throw new Error(`PayPal authentication failed: ${error.message}`);
    }
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          payer: {
            email_address: request.metadata?.email,
            name: {
              given_name: request.metadata?.firstName || 'Customer',
              surname: request.metadata?.lastName || 'User',
            },
          },
          purchase_units: [
            {
              reference_id: request.subscriptionId,
              description: `Belsuite subscription - ${request.subscriptionId}`,
              amount: {
                currency_code: request.currency,
                value: request.amount.toString(),
              },
              custom_id: request.organizationId,
            },
          ],
          application_context: {
            return_url: `${process.env.APP_URL}/payments/paypal/success`,
            cancel_url: `${process.env.APP_URL}/payments/paypal/cancel`,
            brand_name: 'Belsuite',
            locale: 'en-US',
            landing_page: 'BILLING',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;
      const approveLink = data.links.find((link) => link.rel === 'approve');

      return {
        id: `paypal_${data.id}`,
        externalPaymentId: data.id,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        provider: PaymentProvider.PAYPAL,
        redirectUrl: approveLink?.href,
        clientSecret: data.id,
        metadata: request.metadata,
      };
    } catch (error) {
      throw new Error(`PayPal payment creation failed: ${error.message}`);
    }
  }

  async getPayment(externalPaymentId: string): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/v2/checkout/orders/${externalPaymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data;
      const status = this.mapPayPalStatus(data.status);
      const purchaseUnit = data.purchase_units?.[0];
      const amount = parseFloat(purchaseUnit?.amount?.value || '0');

      return {
        id: `paypal_${data.id}`,
        externalPaymentId: data.id,
        status: status,
        amount: amount,
        currency: purchaseUnit?.amount?.currency_code || 'USD',
        provider: PaymentProvider.PAYPAL,
        metadata: {
          payerEmail: data.payer?.email_address,
        },
      };
    } catch (error) {
      throw new Error(`PayPal payment fetch failed: ${error.message}`);
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const token = await this.getAccessToken();

      // Get the capture ID first
      const orderResponse = await axios.get(
        `${this.baseUrl}/v2/checkout/orders/${request.paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const captureId =
        orderResponse.data.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      if (!captureId) {
        throw new Error('Capture ID not found');
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        {
          amount: {
            currency_code:
              orderResponse.data.purchase_units[0].amount.currency_code,
            value: (request.amount || 0).toString(),
          },
          note_to_payer: request.reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;

      return {
        id: `paypal_refund_${data.id}`,
        externalRefundId: data.id,
        status: RefundStatus.COMPLETED,
        amount: parseFloat(data.amount?.value || '0'),
        currency: data.amount?.currency_code || 'USD',
        provider: PaymentProvider.PAYPAL,
      };
    } catch (error) {
      throw new Error(`PayPal refund failed: ${error.message}`);
    }
  }

  async createCustomer(
    request: CreateCustomerRequest,
  ): Promise<CustomerResponse> {
    // PayPal doesn't have explicit customer creation
    // Customers are created implicitly during transactions
    return {
      externalCustomerId: `paypal_${uuid()}`,
      email: request.email,
      provider: PaymentProvider.PAYPAL,
    };
  }

  async addPaymentMethod(
    customerId: string,
    request: PaymentMethodRequest,
  ): Promise<PaymentMethodResponse> {
    // PayPal uses their vault system through subscription or other means
    return {
      externalPaymentMethodId: `paypal_pm_${customerId}`,
      provider: PaymentProvider.PAYPAL,
    };
  }

  async createSubscription(
    request: CreateSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    try {
      const token = await this.getAccessToken();

      // First create a billing plan
      const planResponse = await axios.post(
        `${this.baseUrl}/v1/billing/plans`,
        {
          product_id: process.env.PAYPAL_PRODUCT_ID || 'PROD-BELSUITE',
          name: `Belsuite Plan ${request.planId}`,
          description: `Belsuite billing plan`,
          status: 'ACTIVE',
          billing_cycles: [
            {
              frequency: {
                interval_unit: 'MONTH',
                interval_count: 1,
              },
              tenure_type: 'REGULAR',
              sequence: 1,
              total_cycles: 0, // Infinite
              pricing_scheme: {
                fixed_price: {
                  value: '100.00', // Will be overridden by subscription amount
                  currency_code: 'USD',
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_amount: 'YES',
            payment_failure_threshold: 2,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const planId = planResponse.data.id;

      // Then create subscription
      const subscriptionResponse = await axios.post(
        `${this.baseUrl}/v1/billing/subscriptions`,
        {
          plan_id: planId,
          subscriber: {
            email_address: request.customerId,
          },
          custom_id: request.customerId,
          auto_renewal: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = subscriptionResponse.data;

      return {
        externalSubscriptionId: data.id,
        status: data.status,
        currentPeriodStart: new Date(data.start_time),
        currentPeriodEnd: new Date(data.next_billing_time),
        provider: PaymentProvider.PAYPAL,
        nextPaymentDate: new Date(data.next_billing_time),
      };
    } catch (error) {
      throw new Error(
        `PayPal subscription creation failed: ${error.message}`,
      );
    }
  }

  async cancelSubscription(externalSubscriptionId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();

      await axios.post(
        `${this.baseUrl}/v1/billing/subscriptions/${externalSubscriptionId}/cancel`,
        {
          reason: 'User requested cancellation',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      throw new Error(
        `PayPal subscription cancellation failed: ${error.message}`,
      );
    }
  }

  async verifyWebhookSignature(
    request: WebhookVerificationRequest,
  ): Promise<WebhookVerificationResponse> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
        {
          transmission_id: request.signature,
          transmission_time: new Date().toISOString(),
          cert_url: '',
          auth_algo: 'SHA256withRSA',
          transmission_sig: request.signature,
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(request.payload),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        isValid: response.data.verification_status === 'SUCCESS',
        provider: PaymentProvider.PAYPAL,
      };
    } catch (error) {
      return {
        isValid: false,
        provider: PaymentProvider.PAYPAL,
      };
    }
  }

  async parseWebhookPayload(rawPayload: any): Promise<PaymentWebhookEvent> {
    const eventType = rawPayload.event_type;

    let status = PaymentStatus.PENDING;
    if (eventType === 'CHECKOUT.ORDER.COMPLETED') {
      status = PaymentStatus.COMPLETED;
    } else if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      status = PaymentStatus.PROCESSING;
    }

    return {
      type: eventType,
      provider: PaymentProvider.PAYPAL,
      externalWebhookId: rawPayload.id,
      status: status,
      amount: rawPayload.resource?.purchase_units?.[0]?.amount?.value,
      currency: rawPayload.resource?.purchase_units?.[0]?.amount?.currency_code,
      metadata: {
        orderId: rawPayload.resource?.id,
      },
      timestamp: new Date(rawPayload.create_time),
      raw: rawPayload,
    };
  }

  getWebhookSecret(): string {
    return process.env.PAYPAL_WEBHOOK_ID || '';
  }

  private mapPayPalStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      CREATED: PaymentStatus.PENDING,
      SAVED: PaymentStatus.PENDING,
      APPROVED: PaymentStatus.PROCESSING,
      VOIDED: PaymentStatus.CANCELLED,
      COMPLETED: PaymentStatus.COMPLETED,
      PAYER_ACTION_REQUIRED: PaymentStatus.PENDING,
    };
    return statusMap[status] || PaymentStatus.PENDING;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }
}
