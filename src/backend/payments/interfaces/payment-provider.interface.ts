/**
 * Payment Provider Interface
 * Defines the contract that all payment providers must implement
 */

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
} from './payment.types';

export interface IPaymentProvider {
  /**
   * Get the provider type
   */
  getProvider(): PaymentProvider;

  /**
   * Create a payment
   */
  createPayment(request: CreatePaymentRequest): Promise<PaymentResponse>;

  /**
   * Get payment details
   */
  getPayment(externalPaymentId: string): Promise<PaymentResponse>;

  /**
   * Refund a payment
   */
  refundPayment(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Create a customer in the payment provider system
   */
  createCustomer(request: CreateCustomerRequest): Promise<CustomerResponse>;

  /**
   * Add a payment method
   */
  addPaymentMethod(
    customerId: string,
    request: PaymentMethodRequest,
  ): Promise<PaymentMethodResponse>;

  /**
   * Create a subscription
   */
  createSubscription(
    request: CreateSubscriptionRequest,
  ): Promise<SubscriptionResponse>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(externalSubscriptionId: string): Promise<void>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    request: WebhookVerificationRequest,
  ): Promise<WebhookVerificationResponse>;

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(rawPayload: any): Promise<PaymentWebhookEvent>;

  /**
   * Get webhook secret for signing
   */
  getWebhookSecret(): string;

  /**
   * Health check - verify credentials and connectivity
   */
  healthCheck(): Promise<boolean>;
}
