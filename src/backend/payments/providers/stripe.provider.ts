/**
 * Stripe Payment Provider Implementation
 * https://stripe.com/docs/api
 */

import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
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

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  getProvider(): PaymentProvider {
    return PaymentProvider.STRIPE;
  }

  private getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const payment = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Stripe uses cents
        currency: request.currency.toLowerCase(),
        description: `Belsuite subscription - ${request.subscriptionId}`,
        metadata: {
          organizationId: request.organizationId,
          subscriptionId: request.subscriptionId,
          ...request.metadata,
        },
        receipt_email: request.metadata?.email,
      });

      return {
        id: payment.id,
        externalPaymentId: payment.id,
        status: this.mapStripeStatus(payment.status),
        amount: request.amount,
        currency: request.currency,
        provider: PaymentProvider.STRIPE,
        clientSecret: payment.client_secret ?? undefined,
        metadata: request.metadata,
      };
    } catch (error) {
      throw new Error(
        `Stripe payment creation failed: ${this.getErrorMessage(error, 'Unknown Stripe error')}`,
      );
    }
  }

  async getPayment(externalPaymentId: string): Promise<PaymentResponse> {
    try {
      const payment = await this.stripe.paymentIntents.retrieve(
        externalPaymentId,
      );

      return {
        id: payment.id,
        externalPaymentId: payment.id,
        status: this.mapStripeStatus(payment.status),
        amount: payment.amount / 100,
        currency: payment.currency.toUpperCase(),
        provider: PaymentProvider.STRIPE,
        metadata: payment.metadata,
      };
    } catch (error) {
      throw new Error(
        `Stripe payment fetch failed: ${this.getErrorMessage(error, 'Unknown Stripe error')}`,
      );
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: request.paymentId,
        ...(request.amount
          ? { amount: Math.round(request.amount * 100) }
          : {}),
        reason: 'requested_by_customer',
        metadata: {
          reason: request.reason ?? 'Customer requested refund',
        },
      });

      return {
        id: refund.id,
        externalRefundId: refund.id,
        status: this.mapStripeRefundStatus(refund.status ?? 'pending'),
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        provider: PaymentProvider.STRIPE,
      };
    } catch (error) {
      throw new Error(
        `Stripe refund failed: ${this.getErrorMessage(error, 'Unknown Stripe error')}`,
      );
    }
  }

  async createCustomer(
    request: CreateCustomerRequest,
  ): Promise<CustomerResponse> {
    try {
      const customer = await this.stripe.customers.create({
        email: request.email,
        name: request.name,
        description: request.description,
      });

      return {
        externalCustomerId: customer.id,
        email: customer.email ?? request.email,
        provider: PaymentProvider.STRIPE,
      };
    } catch (error) {
      throw new Error(
        `Stripe customer creation failed: ${this.getErrorMessage(error, 'Unknown Stripe error')}`,
      );
    }
  }

  async addPaymentMethod(
    customerId: string,
    request: PaymentMethodRequest,
  ): Promise<PaymentMethodResponse> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: request.type === 'card' ? 'card' : 'sepa_debit',
        billing_details: {
          email: request.billingDetails.billingEmail,
          name: request.billingDetails.billingName,
          address: {
            line1: request.billingDetails.billingAddress,
            city: request.billingDetails.billingCity,
            state: request.billingDetails.billingState,
            postal_code: request.billingDetails.billingZip,
            country: request.billingDetails.billingCountry,
          },
        },
      });

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      const cardData = paymentMethod.card;

      return {
        externalPaymentMethodId: paymentMethod.id,
        provider: PaymentProvider.STRIPE,
        last4: cardData?.last4,
        brand: cardData?.brand,
        expiryMonth: cardData?.exp_month,
        expiryYear: cardData?.exp_year,
      };
    } catch (error) {
      throw new Error(
        `Stripe payment method creation failed: ${this.getErrorMessage(error, 'Unknown Stripe error')}`,
      );
    }
  }

  async createSubscription(
    request: CreateSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    try {
      const subscription = await this.stripe.subscriptions.create(
        {
          customer: request.customerId,
          items: [
            {
              price: request.planId, // This should be a Stripe price ID
            },
          ],
          default_payment_method: request.paymentMethodId,
          trial_period_days: request.trialDays,
        },
        {
          idempotencyKey: `${request.organizationId}_${request.planId}_${Date.now()}`,
        },
      );

      return {
        externalSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        provider: PaymentProvider.STRIPE,
        nextPaymentDate:
          subscription.next_pending_invoice_item_invoice != null
            ? new Date(subscription.next_pending_invoice_item_invoice * 1000)
            : new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      throw new Error(
        `Stripe subscription creation failed: ${this.getErrorMessage(error, 'Unknown Stripe error')}`,
      );
    }
  }

  async cancelSubscription(externalSubscriptionId: string): Promise<void> {
    try {
      await this.stripe.subscriptions.cancel(externalSubscriptionId);
    } catch (error) {
      throw new Error(
        `Stripe subscription cancellation failed: ${this.getErrorMessage(error, 'Unknown Stripe error')}`,
      );
    }
  }

  async verifyWebhookSignature(
    request: WebhookVerificationRequest,
  ): Promise<WebhookVerificationResponse> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        request.payload,
        request.signature,
        this.webhookSecret,
      );

      return {
        isValid: !!event,
        provider: PaymentProvider.STRIPE,
      };
    } catch (error) {
      return {
        isValid: false,
        provider: PaymentProvider.STRIPE,
      };
    }
  }

  async parseWebhookPayload(rawPayload: any): Promise<PaymentWebhookEvent> {
    const event = rawPayload as Stripe.Event;
    let status = PaymentStatus.PENDING;

    if (event.type === 'payment_intent.succeeded') {
      status = PaymentStatus.COMPLETED;
    } else if (event.type === 'payment_intent.payment_failed') {
      status = PaymentStatus.FAILED;
    } else if (event.type === 'payment_intent.canceled') {
      status = PaymentStatus.CANCELLED;
    }

    const data = event.data.object as any;

    return {
      type: event.type,
      provider: PaymentProvider.STRIPE,
      externalPaymentId: data.id,
      status: status,
      amount: (data.amount || 0) / 100,
      currency: (data.currency || 'USD').toUpperCase(),
      metadata: data.metadata,
      timestamp: new Date(data.created * 1000),
      raw: event,
    };
  }

  getWebhookSecret(): string {
    return this.webhookSecret;
  }

  private mapStripeStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      succeeded: PaymentStatus.COMPLETED,
      processing: PaymentStatus.PROCESSING,
      requires_action: PaymentStatus.PENDING,
      requires_capture: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.PENDING,
      requires_payment_method: PaymentStatus.PENDING,
      canceled: PaymentStatus.CANCELLED,
    };
    return statusMap[status] || PaymentStatus.PENDING;
  }

  private mapStripeRefundStatus(status: string): RefundStatus {
    const statusMap: Record<string, RefundStatus> = {
      succeeded: RefundStatus.COMPLETED,
      pending: RefundStatus.PROCESSING,
      failed: RefundStatus.FAILED,
      canceled: RefundStatus.CANCELLED,
    };
    return statusMap[status] || RefundStatus.PROCESSING;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const balance = await this.stripe.balance.retrieve();
      return !!balance;
    } catch (error) {
      return false;
    }
  }
}
