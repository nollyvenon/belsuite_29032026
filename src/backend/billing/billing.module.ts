import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from '../payments/payment.module';
import { CreditBillingController } from './billing.controller';
import { BillingApiService } from './services/billing-api.service';
import { CreditService } from './services/credit.service';
import { PricingEngineService } from './services/pricing-engine.service';
import { UsageMeterService } from './services/usage-meter.service';
import { StripeBillingService } from './gateways/stripe.service';
import { PaystackService } from './gateways/paystack.service';
import { MpesaService } from './gateways/mpesa.service';
import { CryptoPaymentService } from './gateways/crypto-payment.service';

@Module({
  imports: [ConfigModule, PaymentModule],
  controllers: [CreditBillingController],
  providers: [
    BillingApiService,
    CreditService,
    PricingEngineService,
    UsageMeterService,
    StripeBillingService,
    PaystackService,
    MpesaService,
    CryptoPaymentService,
  ],
  exports: [BillingApiService, CreditService, PricingEngineService, UsageMeterService],
})
export class BillingModule {}
