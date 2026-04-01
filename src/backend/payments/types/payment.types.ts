/**
 * Payment system types and interfaces
 * Defines contracts for payment provider implementations
 */

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
  PAYPAL = 'paypal',
  SOFORT = 'sofort',
  CRYPTO = 'crypto',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Payment request/response types
export interface CreatePaymentRequest {
  organizationId: string;
  subscriptionId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  externalPaymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  redirectUrl?: string;
  clientSecret?: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  id: string;
  externalRefundId: string;
  status: RefundStatus;
  amount: number;
  currency: string;
  provider: PaymentProvider;
}

// Webhook types
export interface PaymentWebhookEvent {
  type: string;
  provider: PaymentProvider;
  externalWebhookId?: string;
  externalPaymentId?: string;
  externalRefundId?: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  raw: any; // Raw webhook data
}

// Customer/Payment method types
export interface CreateCustomerRequest {
  organizationId: string;
  email: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CustomerResponse {
  externalCustomerId: string;
  email: string;
  provider: PaymentProvider;
}

export interface PaymentMethodRequest {
  provider: PaymentProvider;
  type: 'card' | 'bank_account' | 'wallet';
  billingDetails: {
    billingEmail: string;
    billingName: string;
    billingAddress: string;
    billingCity: string;
    billingState: string;
    billingZip: string;
    billingCountry: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentMethodResponse {
  externalPaymentMethodId: string;
  provider: PaymentProvider;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

// Subscription types
export interface CreateSubscriptionRequest {
  organizationId: string;
  customerId: string;
  planId: string;
  paymentMethodId: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionResponse {
  externalSubscriptionId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  provider: PaymentProvider;
  nextPaymentDate?: Date;
}

// Webhook verification types
export interface WebhookVerificationRequest {
  provider: PaymentProvider;
  signature: string;
  payload: string;
}

export interface WebhookVerificationResponse {
  isValid: boolean;
  provider: PaymentProvider;
}
