/**
 * Payment DTOs for request/response validation
 */

import { IsString, IsNumber, IsOptional, IsArray, IsEmail, IsEnum } from 'class-validator';
import { PaymentProvider } from '../types/payment.types';

// Payment request DTOs
export class CreatePaymentDto {
  @IsString()
  provider: PaymentProvider;

  @IsString()
  subscriptionId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class RefundPaymentDto {
  @IsString()
  paymentId: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateCustomerDto {
  @IsString()
  provider: PaymentProvider;

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AddPaymentMethodDto {
  @IsString()
  customerId: string;

  @IsString()
  provider: PaymentProvider;

  @IsString()
  type: 'card' | 'bank_account' | 'wallet';

  @IsString()
  billingEmail: string;

  @IsString()
  billingName: string;

  @IsString()
  billingAddress: string;

  @IsString()
  billingCity: string;

  @IsString()
  billingState: string;

  @IsString()
  billingZip: string;

  @IsString()
  billingCountry: string;
}

export class CreateSubscriptionDto {
  @IsString()
  provider: PaymentProvider;

  @IsString()
  customerId: string;

  @IsString()
  planId: string;

  @IsString()
  paymentMethodId: string;

  @IsNumber()
  @IsOptional()
  trialDays?: number;
}

export class CancelSubscriptionDto {
  @IsString()
  provider: PaymentProvider;

  @IsString()
  externalSubscriptionId: string;
}

export class VerifyPaymentDto {
  @IsString()
  provider: PaymentProvider;

  @IsString()
  paymentId: string;
}

export class PaymentStatsDto {
  totalPayments: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  byStatus: Record<string, number>;
  byProvider: Record<string, number>;
}

export class StripeWebhookDto {
  id: string;
  object: string;
  type: string;
  data: {
    object: Record<string, any>;
  };
}

export class PaystackWebhookDto {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    authorization?: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      bin: string;
      bank: string;
      brand: string;
      country_code: string;
      issuer: unknown;
      signature: string;
      reusable: boolean;
      message: unknown;
      channel: string;
      merchant_code: string;
    };
    customer: {
      id: number;
      customer_code: string;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: Record<string, any>;
      risk_action: string;
      international_format_phone: string;
    };
    paid_at: string;
    created_at: string;
    channel: string;
    source: {
      source: string;
      type: string;
      identifier: unknown;
    };
    receipt_number: string;
    fraudStatus: string;
    message: unknown;
    authentication: unknown;
    timeline: unknown;
  };
}

export class FlutterwaveWebhookDto {
  event: string;
  data: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    link: {
      id: number;
      link_id: number;
    };
    meta: Record<string, any>;
    created_at: string;
    updated_at: string;
  };
}

export class PayPalWebhookDto {
  id: string;
  event_type: string;
  create_time: string;
  resource_type: string;
  resource: {
    id: string;
    state: string;
    payer: {
      email_address: string;
    };
    purchase_units: Array<{
      amount: {
        currency_code: string;
        value: string;
      };
    }>;
  };
}

export class SofortWebhookDto {
  transaction: {
    transaction_id: string;
    merchant_id: number;
    amount: number;
    currency_code: string;
    status: string;
    user_id: string;
    email: string;
  };
}

export class HealthCheckResponseDto {
  [key: string]: boolean;
}
