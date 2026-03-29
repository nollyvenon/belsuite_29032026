/**
 * Payment Module
 * Wires all payment-related services and controllers
 */

import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WebhookHandlers } from './webhooks/webhook.handlers';
import { StripeProvider } from './providers/stripe.provider';
import { PaystackProvider } from './providers/paystack.provider';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import { PayPalProvider } from './providers/paypal.provider';
import { SofortProvider } from './providers/sofort.provider';

@Module({
  providers: [
    PaymentService,
    WebhookHandlers,
    StripeProvider,
    PaystackProvider,
    FlutterwaveProvider,
    PayPalProvider,
    SofortProvider,
  ],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
