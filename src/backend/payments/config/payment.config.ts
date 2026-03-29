/**
 * Payment Provider Configuration
 */

export const paymentProviderConfig = {
  stripe: {
    name: 'Stripe',
    regions: ['GLOBAL'],
    currencies: [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'AUD',
      'CAD',
      'SGD',
      'HKD',
      'CHF',
      'SEK',
      'NZD',
    ],
    features: [
      'ONE_TIME_PAYMENTS',
      'SUBSCRIPTIONS',
      'ACH_TRANSFERS',
      'BANK_DEBITS',
      'PAYOUTS',
      'DISPUTES',
      'REFUNDS',
    ],
    requirements: {
      secretKey: 'STRIPE_SECRET_KEY',
      publishableKey: 'STRIPE_PUBLISHABLE_KEY',
      webhookSecret: 'STRIPE_WEBHOOK_SECRET',
    },
    docs: 'https://stripe.com/docs/api',
  },

  paystack: {
    name: 'Paystack',
    regions: ['AFRICA'],
    currencies: [
      'NGN',
      'GHS',
      'KES',
      'TZS',
      'UGX',
      'RWF',
      'ZAR',
      'USD',
      'EUR',
    ],
    features: [
      'ONE_TIME_PAYMENTS',
      'SUBSCRIPTIONS',
      'MOBILE_MONEY',
      'BANK_TRANSFERS',
      'REFUNDS',
    ],
    requirements: {
      secretKey: 'PAYSTACK_SECRET_KEY',
      publicKey: 'PAYSTACK_PUBLIC_KEY',
    },
    docs: 'https://paystack.com/docs/api',
  },

  flutterwave: {
    name: 'Flutterwave',
    regions: ['AFRICA', 'GLOBAL'],
    currencies: [
      'NGN',
      'GHS',
      'KES',
      'UGX',
      'ZAR',
      'RWF',
      'USD',
      'EUR',
      'GBP',
    ],
    features: [
      'ONE_TIME_PAYMENTS',
      'RECURRING_PAYMENTS',
      'MOBILE_MONEY',
      'BANK_TRANSFERS',
      'CARD_PAYMENTS',
      'REFUNDS',
    ],
    requirements: {
      secretKey: 'FLUTTERWAVE_SECRET_KEY',
      publicKey: 'FLUTTERWAVE_PUBLIC_KEY',
      webhookSecret: 'FLUTTERWAVE_WEBHOOK_SECRET',
    },
    docs: 'https://docs.flutterwave.com',
  },

  paypal: {
    name: 'PayPal',
    regions: ['GLOBAL'],
    currencies: [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'AUD',
      'CAD',
      'CHF',
      'CNY',
      'CZK',
      'DKK',
      'HKD',
      'HUF',
      'INR',
      'ILS',
      'MXN',
      'MYR',
      'NOK',
      'NZD',
      'PHP',
      'PLN',
      'RUB',
      'SGD',
      'SEK',
      'THB',
      'TRY',
      'TWD',
      'VND',
      'ZAR',
    ],
    features: [
      'ONE_TIME_PAYMENTS',
      'SUBSCRIPTIONS',
      'BILLING_PLANS',
      'REFUNDS',
      'DISPUTES',
    ],
    requirements: {
      clientId: 'PAYPAL_CLIENT_ID',
      clientSecret: 'PAYPAL_CLIENT_SECRET',
      mode: 'PAYPAL_MODE', // sandbox or live
      webhookId: 'PAYPAL_WEBHOOK_ID',
      productId: 'PAYPAL_PRODUCT_ID',
    },
    docs: 'https://developer.paypal.com',
  },

  sofort: {
    name: 'Sofort (Klarna)',
    regions: ['EUROPE'],
    currencies: [
      'EUR',
      'CHF',
      'GBP',
      'DKK',
      'NOK',
      'SEK',
      'PLN',
      'CZK',
      'HUF',
      'RON',
    ],
    features: [
      'BANK_TRANSFERS',
      'REFUNDS',
      'ONE_TIME_PAYMENTS',
      'IDEAL',
      'GIROPAY',
      'EPS',
      'SOFORTUEBERWEISUNG',
    ],
    requirements: {
      merchantId: 'SOFORT_MERCHANT_ID',
      apiKey: 'SOFORT_API_KEY',
    },
    docs: 'https://www.sofort.com/eng/api/',
  },
};

/**
 * Get provider configuration
 */
export function getProviderConfig(provider: string) {
  return paymentProviderConfig[provider as keyof typeof paymentProviderConfig];
}

/**
 * Validate payment provider configuration
 */
export function validateProviderConfig(provider: string): boolean {
  const config = getProviderConfig(provider);
  if (!config) return false;

  const requirements = config.requirements as Record<string, string>;
  return Object.values(requirements).every(
    (envVar) => process.env[envVar],
  );
}

/**
 * Get all configured providers
 */
export function getConfiguredProviders(): string[] {
  return Object.keys(paymentProviderConfig).filter((provider) =>
    validateProviderConfig(provider),
  );
}
