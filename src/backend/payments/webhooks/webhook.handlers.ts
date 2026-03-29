/**
 * Webhook handlers for all payment providers
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PaymentService } from '../payment.service';
import { PaymentProvider } from '../types/payment.types';
import * as crypto from 'crypto';

@Injectable()
export class WebhookHandlers {
  private readonly logger = new Logger(WebhookHandlers.name);

  constructor(private paymentService: PaymentService) {}

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(signature: string, body: string) {
    this.logger.log('Processing Stripe webhook');

    const isValid = await this.paymentService.verifyWebhookSignature(
      PaymentProvider.STRIPE,
      signature,
      body,
    );

    if (!isValid.isValid) {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const event = JSON.parse(body);
    await this.paymentService.handleWebhookEvent(PaymentProvider.STRIPE, event);

    return { received: true };
  }

  /**
   * Handle Paystack webhook
   */
  async handlePaystackWebhook(
    signature: string,
    body: Record<string, any>,
  ) {
    this.logger.log('Processing Paystack webhook');

    // Paystack uses x-paystack-signature header
    const bodyString = JSON.stringify(body);
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(bodyString)
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid Paystack webhook signature');
    }

    await this.paymentService.handleWebhookEvent(
      PaymentProvider.PAYSTACK,
      body,
    );

    return { received: true };
  }

  /**
   * Handle Flutterwave webhook
   */
  async handleFlutterwaveWebhook(signature: string, body: any) {
    this.logger.log('Processing Flutterwave webhook');

    const bodyString = JSON.stringify(body);
    const isValid = await this.paymentService.verifyWebhookSignature(
      PaymentProvider.FLUTTERWAVE,
      signature,
      bodyString,
    );

    if (!isValid.isValid) {
      throw new BadRequestException('Invalid Flutterwave webhook signature');
    }

    await this.paymentService.handleWebhookEvent(
      PaymentProvider.FLUTTERWAVE,
      body,
    );

    return { received: true };
  }

  /**
   * Handle PayPal webhook
   */
  async handlePayPalWebhook(signature: string, body: any) {
    this.logger.log('Processing PayPal webhook');

    const isValid = await this.paymentService.verifyWebhookSignature(
      PaymentProvider.PAYPAL,
      signature,
      JSON.stringify(body),
    );

    if (!isValid.isValid) {
      throw new BadRequestException('Invalid PayPal webhook signature');
    }

    await this.paymentService.handleWebhookEvent(PaymentProvider.PAYPAL, body);

    return { received: true };
  }

  /**
   * Handle Sofort webhook
   */
  async handleSofortWebhook(signature: string, body: any) {
    this.logger.log('Processing Sofort webhook');

    const bodyString = JSON.stringify(body);
    const isValid = await this.paymentService.verifyWebhookSignature(
      PaymentProvider.SOFORT,
      signature,
      bodyString,
    );

    if (!isValid.isValid) {
      throw new BadRequestException('Invalid Sofort webhook signature');
    }

    await this.paymentService.handleWebhookEvent(PaymentProvider.SOFORT, body);

    return { received: true };
  }

  /**
   * Generic webhook handler for future providers
   */
  async handleGenericWebhook(provider: PaymentProvider, signature: string, body: any) {
    this.logger.log(`Processing ${provider} webhook`);

    const isValid = await this.paymentService.verifyWebhookSignature(
      provider,
      signature,
      JSON.stringify(body),
    );

    if (!isValid.isValid) {
      throw new BadRequestException(`Invalid ${provider} webhook signature`);
    }

    await this.paymentService.handleWebhookEvent(provider, body);

    return { received: true };
  }
}
