/**
 * Payment Module
 * Wires all payment-related services and controllers
 */

import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BillingController } from './billing.controller';
import { WebhookHandlers } from './webhooks/webhook.handlers';
import { StripeProvider } from './providers/stripe.provider';
import { PaystackProvider } from './providers/paystack.provider';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import { PayPalProvider } from './providers/paypal.provider';
import { SofortProvider } from './providers/sofort.provider';
import { CryptoProvider } from './providers/crypto.provider';
import { BillingCatalogService } from './services/billing-catalog.service';
import { BillingService } from './services/billing.service';

@Module({
  providers: [
    PaymentService,
    BillingCatalogService,
    BillingService,
    WebhookHandlers,
    StripeProvider,
    PaystackProvider,
    FlutterwaveProvider,
    PayPalProvider,
    SofortProvider,
    CryptoProvider,
  ],
  controllers: [PaymentController, BillingController],
  exports: [PaymentService, BillingCatalogService, BillingService],
})
export class PaymentModule {}
