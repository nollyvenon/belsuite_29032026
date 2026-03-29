# Phase 2: Multi-Payment Gateway Integration

## Overview

Phase 2 implements comprehensive multi-payment gateway support for Belsuite with Stripe, Paystack, Flutterwave, PayPal, and Sofort (Klarna). This enables global payment processing across all major regions.

## Supported Payment Providers

### 1. **Stripe** 🟠
- **Regions:** Global
- **Currencies:** 135+ currencies
- **Features:** One-time payments, subscriptions, bank transfers, payouts
- **Best For:** Global SaaS, advanced features, high volume
- **Docs:** https://stripe.com/docs/api

### 2. **Paystack** 🔵
- **Regions:** Africa (Nigeria, Ghana, Kenya, Tanzania, Uganda, Rwanda, South Africa)
- **Currencies:** NGN, GHS, KES, TZS, UGX, RWF, ZAR, USD, EUR
- **Features:** One-time payments, subscriptions, mobile money, bank transfers
- **Best For:** African markets
- **Docs:** https://paystack.com/docs/api

### 3. **Flutterwave** 🟢
- **Regions:** Africa + Global
- **Currencies:** 150+ supported
- **Features:** One-time payments, recurring, mobile money, card payments
- **Best For:** African and emerging markets
- **Docs:** https://docs.flutterwave.com

### 4. **PayPal** 💙
- **Regions:** Global (190+ countries)
- **Currencies:** 25+ major currencies
- **Features:** One-time payments, subscriptions, billing plans, disputes
- **Best For:** Global audience, existing PayPal users
- **Docs:** https://developer.paypal.com

### 5. **Sofort (Klarna)** 🟣
- **Regions:** Europe
- **Currencies:** EUR, CHF, GBP, DKK, NOK, SEK, PLN, CZK, HUF, RON
- **Features:** Bank transfers, iDEAL, Giropay, EPS, SOFORT
- **Best For:** European customers, instant bank transfers
- **Docs:** https://www.sofort.com/eng/api/

## Environment Configuration

Add these environment variables to `.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK_xxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_xxxxx
FLUTTERWAVE_WEBHOOK_SECRET=whsec_xxxxx

# PayPal
PAYPAL_CLIENT_ID=ACxxxxx
PAYPAL_CLIENT_SECRET=ECxxxxx
PAYPAL_MODE=live  # sandbox or live
PAYPAL_WEBHOOK_ID=WH-xxxxx

# Sofort
SOFORT_MERCHANT_ID=xxxxx
SOFORT_API_KEY=xxxxx

# General
APP_URL=https://app.belsuite.com
API_URL=https://api.belsuite.com
```

## Database Schema

### Payment-Related Models

```typescript
// Subscription with multi-provider support
model Subscription {
  id                      String
  organizationId          String
  
  // Provider subscription IDs
  stripeSubscriptionId    String?
  paystackSubscriptionId  String?
  flutterSubscriptionId   String?
  paypalSubscriptionId    String?
  sofortSubscriptionId    String?
  
  primaryPaymentMethod    PaymentProvider
  
  // ... other fields
}

// Payment transaction model
model Payment {
  id                  String
  subscriptionId      String
  provider            PaymentProvider
  externalPaymentId   String
  amount              Float
  currency            String
  status              PaymentStatus
  
  // Retry logic
  attemptNumber       Int
  nextRetryAt         DateTime?
  
  // Refunds
  refunds             PaymentRefund[]
  refundedAmount      Float
  
  // ... timestamps
}

// Payment method storage
model PaymentMethod {
  id                  String
  billingProfileId    String
  provider            PaymentProvider
  
  // External IDs
  stripePaymentMethodId    String?
  paystackAuthCode         String?
  flutterwaveTokenId       String?
  paypalTokenId            String?
  sofortToken              String?
  
  // Card/Account details
  last4               String?
  brand               String?
  
  isDefault           Boolean
  isActive            Boolean
}

// Refund tracking
model PaymentRefund {
  id                  String
  paymentId           String
  provider            PaymentProvider
  externalRefundId    String?
  amount              Float
  status              RefundStatus
  reason              String?
}

// Webhook tracking
model PaymentWebhook {
  id                  String
  provider            PaymentProvider
  eventType           String
  paymentId           String?
  data                String  // JSON
  status              WebhookStatus
  processedAt         DateTime?
}
```

## API Endpoints

### Payment Management

```
POST   /api/v1/payments/create
       Create a one-time payment

POST   /api/v1/payments/verify
       Verify payment status

POST   /api/v1/payments/refund
       Refund a payment

GET    /api/v1/payments/providers
       Get available providers

GET    /api/v1/payments/statistics
       Get payment statistics

GET    /api/v1/payments/health
       Health check all providers
```

### Customer Management

```
POST   /api/v1/payments/customers/create
       Create customer in provider system

POST   /api/v1/payments/payment-methods/add
       Add payment method to customer
```

### Subscriptions

```
POST   /api/v1/payments/subscriptions/create
       Create recurring subscription

POST   /api/v1/payments/subscriptions/cancel
       Cancel subscription
```

### Webhooks

```
POST   /api/v1/payments/webhooks/stripe
POST   /api/v1/payments/webhooks/paystack
POST   /api/v1/payments/webhooks/flutterwave
POST   /api/v1/payments/webhooks/paypal
POST   /api/v1/payments/webhooks/sofort
```

## Implementation Examples

### Create a Payment

```bash
curl -X POST http://localhost:3001/api/v1/payments/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "stripe",
    "subscriptionId": "sub_123",
    "amount": 99.99,
    "currency": "USD",
    "metadata": {
      "email": "customer@example.com",
      "name":"John Doe"
    }
  }'

Response:
{
  "success": true,
  "data": {
    "id": "pi_stripe_123456",
    "externalPaymentId": "pi_123456",
    "status": "pending",
    "amount": 99.99,
    "currency": "USD",
    "provider": "stripe",
    "redirectUrl": "https://stripe.com/...",
    "clientSecret": "pi_123456_secret"
  }
}
```

### Create a Subscription

```bash
curl -X POST http://localhost:3001/api/v1/payments/subscriptions/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paystack",
    "customerId": "CUS_xxxxx",
    "planId": "PLN_xxxxx",
    "paymentMethodId": "AUTH_xxxxx",
    "trialDays": 14
  }'

Response:
{
  "success": true,
  "data": {
    "externalSubscriptionId": "SUB_xxxxx",
    "status": "active",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "provider": "paystack",
    "nextPaymentDate": "2024-02-01T00:00:00Z"
  }
}
```

### Verify Payment

```bash
curl -X POST http://localhost:3001/api/v1/payments/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "stripe",
    "paymentId": "pi_123456"
  }'

Response:
{
  "success": true,
  "data": {
    "id": "pi_stripe_123456",
    "status": "completed",
    "amount": 99.99,
    "paidAt": "2024-01-15T10:30:00Z"
  }
}
```

### Refund Payment

```bash
curl -X POST http://localhost:3001/api/v1/payments/refund \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pi_123456",
    "amount": 50.00,
    "reason": "Customer requested refund"
  }'

Response:
{
  "success": true,
  "data": {
    "id": "re_stripe_789",
    "externalRefundId": "re_123456789",
    "status": "completed",
    "amount": 50.00,
    "currency": "USD"
  }
}
```

## Webhook Setup

Each payment provider requires webhook configuration:

### Stripe
1. Go to https://dashboard.stripe.com/webhooks
2. Create new endpoint:
   - URL: `https://api.belsuite.com/api/v1/payments/webhooks/stripe`
   - Events: `charge.succeeded`, `charge.failed`, `charge.refunded`
3. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Paystack
1. Go to https://dashboard.paystack.com/settings/developers/webhooks
2. Set webhook URL: `https://api.belsuite.com/api/v1/payments/webhooks/paystack`
3. Enable events

### Flutterwave
1. Go to https://dashboard.flutterwave.com/settings/webhooks
2. Set webhook URL: `https://api.belsuite.com/api/v1/payments/webhooks/flutterwave`
3. Copy webhook secret to `FLUTTERWAVE_WEBHOOK_SECRET`

### PayPal
1. Go to https://sandbox.developer.paypal.com/dashboard
2. Create webhook listener for:
   - URL: `https://api.belsuite.com/api/v1/payments/webhooks/paypal`
   - Events: `PAYMENT.CAPTURE.COMPLETED`, `BILLING.SUBSCRIPTION.CREATED`
3. Copy webhook ID to `PAYPAL_WEBHOOK_ID`

### Sofort
1. Go to https://www.sofort.com/integrations/webhooks/
2. Configure webhook:
   - URL: `https://api.belsuite.com/api/v1/payments/webhooks/sofort`
   - Authentication: API key provided

## Architecture

```
┌─────────────────────────────────────┐
│       Payment Controller            │
│  (Auth, Validation, Routing)        │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│       Payment Service               │
│  (Orchestration, Logic)             │
└────┬──────┬───┬──────┬────┬─────────┘
     │      │   │      │    │
┌────▼──┐ ┌─▼───▼─┐ ┌──▼──┐ ┌──▼──┐ ┌─▼────┐
│Stripe │ │Paystack│ │Flutt.│ │PayPal│ │Sofort│
│Prov.  │ │Provider│ │Prov. │ │Prov. │ │Prov. │
└───────┘ └───────┘ └──────┘ └──────┘ └──────┘
     │      │   │      │    │
     └──────┴───┴──────┴────┴─────────────┐
                                         │
                    ┌────────────────────▼──────┐
                    │      Database             │
                    │  (Payments, Refunds,      │
                    │   Webhooks, Methods)      │
                    └───────────────────────────┘
```

## Error Handling

All payment operations include:

1. **Validation**: DTOs validate input
2. **Retry Logic**: Failed payments retry up to 3 times with exponential backoff
3. **Idempotency**: Uses unique IDs for duplicate prevention
4. **Webhook Verification**: All webhooks verified with provider signatures
5. **Logging**: All operations logged for audit trail

## Security Considerations

✅ **Secret Management**
- All API keys in environment variables
- Never logged or cached
- Rotated regularly

✅ **Webhook Security**
- Signature verification required
- Replay attack prevention via timestamps
- HTTPS only

✅ **Payment Data**
- PCI compliance via provider SDKs
- No raw card data stored
- Payment methods tokenized

✅ **Tenant Isolation**
- All payments scoped to organization
- Cannot access other org's payments
- RBAC enforced on all endpoints

## Testing

### Test Credentials

**Stripe (Sandbox):**
```
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

**Paystack (Sandbox):**
```
Authorization Code: AUTH_72qt6xij
```

**Flutterwave (Sandbox):**
- Use test cards from docs

**PayPal (Sandbox):**
- Create test account at sandbox.paypal.com

**Sofort (Test):**
- Use demo credentials

### Health Check

```bash
curl http://localhost:3001/api/v1/payments/health

Response:
{
  "success": true,
  "data": {
    "stripe": true,
    "paystack": true,
    "flutterwave": false,  // Not configured
    "paypal": true,
    "sofort": true
  }
}
```

## Monitoring

### Payment Statistics

```bash
curl http://localhost:3001/api/v1/payments/statistics \
  -H "Authorization: Bearer <token>"

Response:
{
  "success": true,
  "data": {
    "totalPayments": 150,
    "totalAmount": 14999.50,
    "completedAmount": 14500.00,
    "pendingAmount": 499.50,
    "byStatus": {
      "completed": 145,
      "pending": 3,
      "failed": 2
    },
    "byProvider": {
      "stripe": 75,
      "paystack": 40,
      "flutterwave": 25,
      "paypal": 8,
      "sofort": 2
    }
  }
}
```

## Troubleshooting

### Payment Creation Failed
- Check provider credentials in .env
- Verify provider region supports currency
- Check organization subscription status

### Webhook Not Received
- Verify webhook URL is publicly accessible
- Check firewall/proxy allow webhooks
- Verify webhook signing secret
- Check provider dashboard logs

### Subscription Not Created
- Ensure customer exists in provider
- Verify payment method is attached
- Check plan ID is valid
- Review provider requirements

## Next Steps (Phase 3)

1. Email Service Integration (SendGrid)
2. Invoice Generation & PDFs
3. Dunning Management (retry failed payments)
4. Multi-currency Conversion
5. Tax Calculation & Compliance
6. Payment Analytics Dashboard

---

**Documentation Version:** 1.0
**Last Updated:** 2024-01-15
