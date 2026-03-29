/**
 * Payment API Controller
 * Exposes payment endpoints with multi-provider support
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Query,
  UseGuards,
  BadRequestException,
  Logger,
  RawBody,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { WebhookHandlers } from './webhooks/webhook.handlers';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import {
  CreatePaymentDto,
  RefundPaymentDto,
  CreateCustomerDto,
  AddPaymentMethodDto,
  CreateSubscriptionDto,
  CancelSubscriptionDto,
  VerifyPaymentDto,
} from './dto/payment.dto';
import { PaymentProvider } from './types/payment.types';

@Controller('api/v1/payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private paymentService: PaymentService,
    private webhookHandlers: WebhookHandlers,
  ) {}

  /**
   * Get available payment providers
   */
  @Get('providers')
  getAvailableProviders() {
    return {
      providers: this.paymentService.getAvailableProviders(),
      message: 'Available payment providers',
    };
  }

  /**
   * Create a payment with specified provider
   */
  @Post('create')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createPayment(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    if (!dto.provider || !Object.values(PaymentProvider).includes(dto.provider)) {
      throw new BadRequestException('Invalid payment provider');
    }

    if (!dto.subscriptionId || !dto.amount) {
      throw new BadRequestException('Missing required fields');
    }

    this.logger.log(
      `Creating payment with ${dto.provider} for org ${organizationId}`,
    );

    try {
      const payment = await this.paymentService.createPayment(dto.provider, {
        organizationId,
        subscriptionId: dto.subscriptionId,
        amount: dto.amount,
        currency: dto.currency || 'USD',
        metadata: {
          ...dto.metadata,
          userId,
        },
      });

      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      this.logger.error(`Payment creation failed: ${error.message}`);
      throw new BadRequestException(`Payment creation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment status
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async verifyPayment(
    @Tenant() organizationId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    try {
      const payment = await this.paymentService.getPayment(
        dto.provider,
        dto.paymentId,
      );

      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      throw new BadRequestException(
        `Payment verification failed: ${error.message}`,
      );
    }
  }

  /**
   * Refund a payment
   */
  @Post('refund')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async refundPayment(
    @Tenant() organizationId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    if (!dto.paymentId) {
      throw new BadRequestException('Payment ID is required');
    }

    try {
      const payment = await this.paymentService.getPayment(
        PaymentProvider.STRIPE,
        dto.paymentId,
      );

      const refund = await this.paymentService.refundPayment(
        PaymentProvider.STRIPE,
        {
          paymentId: dto.paymentId,
          amount: dto.amount,
          reason: dto.reason,
        },
      );

      return {
        success: true,
        data: refund,
      };
    } catch (error) {
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Create a customer
   */
  @Post('customers/create')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createCustomer(
    @Tenant() organizationId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    if (!dto.provider || !dto.email || !dto.name) {
      throw new BadRequestException('Missing required fields');
    }

    try {
      // Get provider
      const provider = dto.provider;

      const customer = await this.paymentService.getProvider(provider)
        .createCustomer({
        organizationId,
        email: dto.email,
        name: dto.name,
        description: dto.description,
      });

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      throw new BadRequestException(
        `Customer creation failed: ${error.message}`,
      );
    }
  }

  /**
   * Add payment method to customer
   */
  @Post('payment-methods/add')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async addPaymentMethod(
    @Tenant() organizationId: string,
    @Body() dto: AddPaymentMethodDto,
  ) {
    if (
      !dto.customerId ||
      !dto.provider ||
      !dto.type ||
      !dto.billingEmail ||
      !dto.billingName
    ) {
      throw new BadRequestException('Missing required fields');
    }

    try {
      const provider = dto.provider;

      const paymentMethod = await this.paymentService.getProvider(provider)
        .addPaymentMethod(dto.customerId, {
        provider,
        type: dto.type,
        billingDetails: {
          billingEmail: dto.billingEmail,
          billingName: dto.billingName,
          billingAddress: dto.billingAddress,
          billingCity: dto.billingCity,
          billingState: dto.billingState,
          billingZip: dto.billingZip,
          billingCountry: dto.billingCountry,
        },
      });

      return {
        success: true,
        data: paymentMethod,
      };
    } catch (error) {
      throw new BadRequestException(
        `Payment method creation failed: ${error.message}`,
      );
    }
  }

  /**
   * Create subscription
   */
  @Post('subscriptions/create')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createSubscription(
    @Tenant() organizationId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    if (
      !dto.provider ||
      !dto.customerId ||
      !dto.planId ||
      !dto.paymentMethodId
    ) {
      throw new BadRequestException('Missing required fields');
    }

    try {
      const subscription = await this.paymentService.createSubscription(
        dto.provider,
        organizationId,
        dto.customerId,
        dto.planId,
        dto.paymentMethodId,
        dto.trialDays,
      );

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      throw new BadRequestException(
        `Subscription creation failed: ${error.message}`,
      );
    }
  }

  /**
   * Cancel subscription
   */
  @Post('subscriptions/cancel')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async cancelSubscription(
    @Tenant() organizationId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    if (!dto.provider || !dto.externalSubscriptionId) {
      throw new BadRequestException('Missing required fields');
    }

    try {
      await this.paymentService.cancelSubscription(
        dto.provider,
        dto.externalSubscriptionId,
        organizationId,
      );

      return {
        success: true,
        message: 'Subscription cancelled successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Subscription cancellation failed: ${error.message}`,
      );
    }
  }

  /**
   * Get payment statistics
   */
  @Get('statistics')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getPaymentStats(@Tenant() organizationId: string) {
    try {
      const stats = await this.paymentService.getPaymentStats(organizationId);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve statistics: ${error.message}`,
      );
    }
  }

  /**
   * Health check
   */
  @Get('health')
  async healthCheck() {
    try {
      const health = await this.paymentService.healthCheck();

      return {
        success: true,
        data: health,
      };
    } catch (error) {
      throw new BadRequestException(
        `Health check failed: ${error.message}`,
      );
    }
  }

  // ======================================================================
  // WEBHOOK ENDPOINTS
  // ======================================================================

  /**
   * Stripe webhook endpoint
   */
  @Post('webhooks/stripe')
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: Request,
  ) {
    const body = (request as any).rawBody || '';

    try {
      const result = await this.webhookHandlers.handleStripeWebhook(
        signature,
        body,
      );
      return result;
    } catch (error) {
      this.logger.error(`Stripe webhook error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Paystack webhook endpoint
   */
  @Post('webhooks/paystack')
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: Record<string, any>,
  ) {
    try {
      const result = await this.webhookHandlers.handlePaystackWebhook(
        signature,
        body,
      );
      return result;
    } catch (error) {
      this.logger.error(`Paystack webhook error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Flutterwave webhook endpoint
   */
  @Post('webhooks/flutterwave')
  async flutterwaveWebhook(
    @Headers('verif-hash') signature: string,
    @Body() body: Record<string, any>,
  ) {
    try {
      const result = await this.webhookHandlers.handleFlutterwaveWebhook(
        signature,
        body,
      );
      return result;
    } catch (error) {
      this.logger.error(`Flutterwave webhook error: ${error.message}`);
      throw error;
    }
  }

  /**
   * PayPal webhook endpoint
   */
  @Post('webhooks/paypal')
  async paypalWebhook(
    @Headers('paypal-transmission-id') transmissionId: string,
    @Body() body: Record<string, any>,
  ) {
    try {
      const result = await this.webhookHandlers.handlePayPalWebhook(
        transmissionId,
        body,
      );
      return result;
    } catch (error) {
      this.logger.error(`PayPal webhook error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sofort webhook endpoint
   */
  @Post('webhooks/sofort')
  async sofortWebhook(
    @Headers('x-signature') signature: string,
    @Body() body: Record<string, any>,
  ) {
    try {
      const result = await this.webhookHandlers.handleSofortWebhook(
        signature,
        body,
      );
      return result;
    } catch (error) {
      this.logger.error(`Sofort webhook error: ${error.message}`);
      throw error;
    }
  }
}
