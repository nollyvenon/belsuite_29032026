/**
 * Payment Service - Orchestrates all payment providers
 * Routes requests to appropriate provider and manages payment lifecycle
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  PaymentProvider as PrismaPaymentProvider,
  PaymentStatus as PrismaPaymentStatus,
  RefundStatus as PrismaRefundStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { IPaymentProvider } from './interfaces/payment-provider.interface';
import {
  PaymentProvider,
  PaymentStatus,
  RefundStatus,
  CreatePaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
} from './types/payment.types';
import { StripeProvider } from './providers/stripe.provider';
import { PaystackProvider } from './providers/paystack.provider';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import { SofortProvider } from './providers/sofort.provider';
import { PayPalProvider } from './providers/paypal.provider';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private providers: Map<PaymentProvider, IPaymentProvider>;

  constructor(private prisma: PrismaService) {
    // Initialize all payment providers
    this.providers = new Map<PaymentProvider, IPaymentProvider>();
    this.providers.set(PaymentProvider.STRIPE, new StripeProvider());
    this.providers.set(PaymentProvider.PAYSTACK, new PaystackProvider());
    this.providers.set(PaymentProvider.FLUTTERWAVE, new FlutterwaveProvider());
    this.providers.set(PaymentProvider.PAYPAL, new PayPalProvider());
    this.providers.set(PaymentProvider.SOFORT, new SofortProvider());
  }

  private toPrismaProvider(provider: PaymentProvider): PrismaPaymentProvider {
    return provider.toUpperCase() as PrismaPaymentProvider;
  }

  private toPrismaPaymentStatus(status: PaymentStatus): PrismaPaymentStatus {
    return status.toUpperCase() as PrismaPaymentStatus;
  }

  private toPrismaRefundStatus(status: RefundStatus): PrismaRefundStatus {
    return status.toUpperCase() as PrismaRefundStatus;
  }

  /**
   * Get a payment provider by type
   */
  getProvider(provider: PaymentProvider): IPaymentProvider {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider) {
      throw new BadRequestException(
        `Unsupported payment provider: ${provider}`,
      );
    }
    return paymentProvider;
  }

  /**
   * Get all available payment providers
   */
  getAvailableProviders(): PaymentProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Create a payment with specified provider
   */
  async createPayment(
    provider: PaymentProvider,
    request: CreatePaymentRequest,
  ): Promise<PaymentResponse> {
    try {
      this.logger.log(
        `Creating payment with ${provider} for subscription ${request.subscriptionId}`,
      );

      const paymentProvider = this.getProvider(provider);
      const paymentResponse = await paymentProvider.createPayment(request);

      // Store payment in database
      await this.prisma.payment.create({
        data: {
          subscriptionId: request.subscriptionId,
          provider: this.toPrismaProvider(provider),
          externalPaymentId: paymentResponse.externalPaymentId,
          amount: paymentResponse.amount,
          currency: paymentResponse.currency,
          status: this.toPrismaPaymentStatus(PaymentStatus.PENDING),
          providerResponse: JSON.stringify(paymentResponse),
          attemptNumber: 1,
        },
      });

      return paymentResponse;
    } catch (error) {
      this.logger.error(`Payment creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPayment(provider: PaymentProvider, externalPaymentId: string) {
    try {
      const paymentProvider = this.getProvider(provider);
      return await paymentProvider.getPayment(externalPaymentId);
    } catch (error) {
      this.logger.error(`Failed to fetch payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    provider: PaymentProvider,
    request: RefundRequest,
  ): Promise<RefundResponse> {
    try {
      this.logger.log(`Refunding payment ${request.paymentId} with ${provider}`);

      // Get payment from database
      const payment = await this.prisma.payment.findUnique({
        where: { id: request.paymentId },
      });

      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

      const paymentProvider = this.getProvider(provider);
      const refundResponse = await paymentProvider.refundPayment({
        ...request,
        paymentId: payment.externalPaymentId,
      });

      // Store refund in database
      await this.prisma.paymentRefund.create({
        data: {
          paymentId: request.paymentId,
          provider: this.toPrismaProvider(provider),
          externalRefundId: refundResponse.externalRefundId,
          amount: refundResponse.amount,
          currency: refundResponse.currency,
          status: this.toPrismaRefundStatus(refundResponse.status),
          reason: request.reason,
        },
      });

      // Update payment refunded amount
      const currentRefunded =
        payment.refundedAmount + refundResponse.amount;
      await this.prisma.payment.update({
        where: { id: request.paymentId },
        data: {
          refundedAmount: currentRefunded,
          status:
            currentRefunded >= payment.amount
              ? this.toPrismaPaymentStatus(PaymentStatus.REFUNDED)
              : this.toPrismaPaymentStatus(PaymentStatus.PARTIALLY_REFUNDED),
        },
      });

      return refundResponse;
    } catch (error) {
      this.logger.error(`Refund failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a recurring subscription
   */
  async createSubscription(
    provider: PaymentProvider,
    organizationId: string,
    customerId: string,
    planId: string,
    paymentMethodId: string,
    trialDays?: number,
  ) {
    try {
      this.logger.log(
        `Creating subscription with ${provider} for organization ${organizationId}`,
      );

      const paymentProvider = this.getProvider(provider);

      const subscriptionResponse = await paymentProvider.createSubscription({
        organizationId,
        customerId,
        planId,
        paymentMethodId,
        trialDays,
      });

      // Update subscription in database
      const subscription = await this.prisma.subscription.findUnique({
        where: { organizationId },
      });

      if (subscription) {
        await this.prisma.subscription.update({
          where: { organizationId },
          data: {
            [`${provider}SubscriptionId`]: subscriptionResponse.externalSubscriptionId,
            primaryPaymentMethod: this.toPrismaProvider(provider),
            currentPeriodStart: subscriptionResponse.currentPeriodStart,
            currentPeriodEnd: subscriptionResponse.currentPeriodEnd,
          },
        });
      }

      return subscriptionResponse;
    } catch (error) {
      this.logger.error(`Subscription creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    provider: PaymentProvider,
    externalSubscriptionId: string,
    organizationId: string,
  ) {
    try {
      this.logger.log(`Cancelling subscription with ${provider}`);

      const paymentProvider = this.getProvider(provider);
      await paymentProvider.cancelSubscription(externalSubscriptionId);

      // Update subscription status in database
      await this.prisma.subscription.update({
        where: { organizationId },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Subscription cancellation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(
    provider: PaymentProvider,
    signature: string,
    payload: string,
  ) {
    try {
      const paymentProvider = this.getProvider(provider);
      return await paymentProvider.verifyWebhookSignature({
        provider,
        signature,
        payload,
      });
    } catch (error) {
      this.logger.error(`Webhook verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(provider: PaymentProvider, rawPayload: any) {
    try {
      this.logger.log(`Processing webhook from ${provider}`);

      const paymentProvider = this.getProvider(provider);
      const event = await paymentProvider.parseWebhookPayload(rawPayload);

      // Store webhook record
      await this.prisma.paymentWebhook.create({
        data: {
          provider: this.toPrismaProvider(provider),
          externalWebhookId: event.externalWebhookId,
          eventType: event.type,
          paymentId: event.externalPaymentId
            ? (
              await this.prisma.payment.findFirst({
                where: { externalPaymentId: event.externalPaymentId },
              })
            )?.id
            : undefined,
          data: JSON.stringify(event.raw),
          status: 'RECEIVED',
        },
      });

      // Process event based on type
      await this.processPaymentEvent(provider, event);

      return true;
    } catch (error) {
      this.logger.error(`Webhook handling failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process payment event from webhook
   */
  private async processPaymentEvent(provider: PaymentProvider, event: any) {
    switch (event.type) {
      case 'charge.success':
      case 'charge.completed':
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event);
        break;

      case 'charge.failed':
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event);
        break;

      case 'charge.refunded':
      case 'charge.dispute.created':
        await this.handleRefund(event);
        break;

      default:
        this.logger.debug(`Ignoring webhook event: ${event.type}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(event: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { externalPaymentId: event.externalPaymentId },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: this.toPrismaPaymentStatus(PaymentStatus.COMPLETED),
          paidAt: new Date(),
        },
      });

      this.logger.log(`Payment ${payment.id} completed`);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(event: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { externalPaymentId: event.externalPaymentId },
    });

    if (payment && payment.attemptNumber < payment.maxRetries) {
      // Retry payment after 1 hour
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: this.toPrismaPaymentStatus(PaymentStatus.FAILED),
          attemptNumber: { increment: 1 },
          nextRetryAt: new Date(Date.now() + 60 * 60 * 1000),
          failureReason: event.failureReason,
        },
      });

      this.logger.log(`Payment ${payment.id} failed, scheduled for retry`);
    } else if (payment) {
      // Max retries exceeded
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: this.toPrismaPaymentStatus(PaymentStatus.FAILED),
          failureReason: 'Max retries exceeded',
        },
      });

      this.logger.error(
        `Payment ${payment.id} failed after ${payment.maxRetries} attempts`,
      );
    }
  }

  /**
   * Handle refund
   */
  private async handleRefund(event: any) {
    this.logger.log(`Processing refund event`);
    // Refund handling implemented in refundPayment method
  }

  /**
   * Health check all providers
   */
  async healthCheck() {
    const results: Record<PaymentProvider, boolean> = {} as any;

    for (const [provider, paymentProvider] of this.providers) {
      try {
        results[provider] = await paymentProvider.healthCheck();
      } catch (error) {
        this.logger.error(`Health check failed for ${provider}: ${error.message}`);
        results[provider] = false;
      }
    }

    return results;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(organizationId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        subscription: {
          organizationId,
        },
      },
    });

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedStatus = this.toPrismaPaymentStatus(PaymentStatus.COMPLETED);
    const pendingStatus = this.toPrismaPaymentStatus(PaymentStatus.PENDING);
    const failedStatus = this.toPrismaPaymentStatus(PaymentStatus.FAILED);
    const completedAmount = payments
      .filter((p) => p.status === completedStatus)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPayments: payments.length,
      totalAmount,
      completedAmount,
      pendingAmount: totalAmount - completedAmount,
      byStatus: {
        completed: payments.filter(
          (p) => p.status === completedStatus,
        ).length,
        pending: payments.filter(
          (p) => p.status === pendingStatus,
        ).length,
        failed: payments.filter((p) => p.status === failedStatus)
          .length,
      },
      byProvider: payments.reduce(
        (acc, p) => {
          acc[p.provider] = (acc[p.provider] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
