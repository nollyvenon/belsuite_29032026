# Payment Provider Setup Guide

Quick reference for setting up each payment provider with Belsuite.

## Prerequisites

- Belsuite backend running
- Node.js 18+ installed
- Each provider account (free sandbox available)

## 1. Stripe Setup ✅ [5-10 minutes]

### 1.1 Create Stripe Account
1. Go to https://stripe.com
2. Click "Start now"
3. Sign up and verify email
4. Activate account

### 1.2 Get API Keys
1. Navigate to Dashboard → Developers → API Keys
2. Copy:
   - **Secret Key** (starts with `sk_live_` or `sk_test_`)
   - **Publishable Key** (starts with `pk_live_` or `pk_test_`)

### 1.3 Setup Webhook
1. Go to Developers → Webhooks
2. Click "Create endpoint"
3. URL: `https://your-domain.com/api/v1/payments/webhooks/stripe`
4. Select events:
   - `charge.succeeded`
   - `charge.failed`
   - `charge.refunded`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy **Signing secret**

### 1.4 Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 1.5 Test
```bash
PROVIDER=stripe
AMOUNT=10.00
CURRENCY=USD
```

---

## 2. Paystack Setup ✅ [5-10 minutes]

### 2.1 Create Paystack Account
1. Go to https://paystack.com
2. Sign up
3. Complete KYC verification

### 2.2 Get API Keys
1. Navigate to Settings → API Keys & Webhooks
2. Copy:
   - **Secret Key** (starts with `sk_live_` or `sk_test_`)
   - **Public Key** (starts with `pk_live_` or `pk_test_`)

### 2.3 Setup Webhook
1. Go to Settings → API Keys & Webhooks
2. Webhook URL: `https://your-domain.com/api/v1/payments/webhooks/paystack`
3. Events enabled automatically
4. Test webhook delivery

### 2.4 Environment Variables
```bash
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

### 2.5 Supported Countries
- Nigeria (NGN)
- Ghana (GHS)
- Kenya (KES)
- Tanzania (TZS)
- Uganda (UGX)
- Rwanda (RWF)
- South Africa (ZAR)

---

## 3. Flutterwave Setup ✅ [5-10 minutes]

### 3.1 Create Flutterwave Account
1. Go to https://dashboard.flutterwave.com
2. Sign up
3. Complete email verification

### 3.2 Get API Keys
1. Go to Settings → API Keys
2. Copy:
   - **Secret Key** (starts with `FLWSECK_`)
   - **Public Key** (starts with `FLWPUBK_`)

### 3.3 Setup Webhook
1. Go to Settings → Webhooks
2. URL: `https://your-domain.com/api/v1/payments/webhooks/flutterwave`
3. Copy **Webhook Secret** (starts with `whsec_`)
4. Test webhook

### 3.4 Environment Variables
```bash
FLUTTERWAVE_SECRET_KEY=FLWSECK_xxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_xxxxx
FLUTTERWAVE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3.5 Supported Currencies
150+ currencies including: NGN, GHS, KES, ZAR, USD, EUR, GBP

---

## 4. PayPal Setup ✅ [10-15 minutes]

### 4.1 Create PayPal Account
1. Go to https://developer.paypal.com
2. Sign in (or create new account)
3. Verify email

### 4.2 Create Application
1. Go to Apps & Credentials
2. Create app in Sandbox environment
3. Copy:
   - **Client ID**
   - **Secret**

### 4.3 Setup Webhook (Sandbox)
1. Go to Sandbox Settings
2. Create webhook endpoint:
   - URL: `https://your-domain.com/api/v1/payments/webhooks/paypal`
   - Events:
     - `CHECKOUT.ORDER.COMPLETED`
     - `BILLING.SUBSCRIPTION.CREATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `CUSTOMER.DISPUTE.CREATED`
3. Copy **Webhook ID**

### 4.4 Create Product (for subscriptions)
1. Go to Products (in dashboard)
2. Create product:
   - Name: "Belsuite Subscription"
   - Type: "Digital"
3. Copy **Product ID**

### 4.5 Environment Variables
```bash
PAYPAL_CLIENT_ID=ACxxxxx
PAYPAL_CLIENT_SECRET=ECxxxxx
PAYPAL_MODE=sandbox  # Change to live for production
PAYPAL_WEBHOOK_ID=WH-xxxxx
PAYPAL_PRODUCT_ID=PROD-xxxxx
```

### 4.6 Test Credentials
Create sandbox buyer account:
1. PayPal Dashboard → Sandbox Accounts
2. Create Business and Personal accounts
3. Use for testing

---

## 5. Sofort (Klarna) Setup ✅ [10-15 minutes]

### 5.1 Create Sofort Account
1. Go to https://www.klarna.com/sofort/
2. Register for business account
3. Complete verification

### 5.2 Get Merchant Credentials
1. Go to Integration settings
2. Copy:
   - **Merchant ID**
   - **API Key**

### 5.3 Setup Webhook
1. Go to Webhooks
2. URL: `https://your-domain.com/api/v1/payments/webhooks/sofort`
3. Enable transaction events

### 5.4 Environment Variables
```bash
SOFORT_MERCHANT_ID=xxxxx
SOFORT_API_KEY=xxxxx
```

### 5.5 Supported Countries
- Austria
- Belgium
- Czech Republic
- Germany
- Denmark
- Spain
- Finland
- France
- Italy
- Netherlands
- Poland
- Switzerland
- Sweden

---

## Environment File Template

Create `.env` with all providers:

```bash
# === PAYMENT PROVIDERS ===

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK_xxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_xxxxx
FLUTTERWAVE_WEBHOOK_SECRET=whsec_xxxxx

# PayPal
PAYPAL_CLIENT_ID=ACxxxxx
PAYPAL_CLIENT_SECRET=ECxxxxx
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=WH-xxxxx
PAYPAL_PRODUCT_ID=PROD-xxxxx

# Sofort
SOFORT_MERCHANT_ID=xxxxx
SOFORT_API_KEY=xxxxx

# === APP CONFIG ===
APP_URL=https://app.belsuite.local
API_URL=https://api.belsuite.local
NODE_ENV=development
```

---

## Verification Steps

### Check Health
```bash
curl http://localhost:3001/api/v1/payments/health

Expected:
{
  "success": true,
  "data": {
    "stripe": true,
    "paystack": true,
    "flutterwave": true,
    "paypal": true,
    "sofort": true
  }
}
```

### Get Available Providers
```bash
curl http://localhost:3001/api/v1/payments/providers

Expected:
{
  "providers": ["stripe", "paystack", "flutterwave", "paypal", "sofort"]
}
```

---

## Testing Each Provider

### Test Stripe Payment
```bash
curl -X POST http://localhost:3001/api/v1/payments/create \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "stripe",
    "subscriptionId": "sub_test_001",
    "amount": 9.99,
    "currency": "USD",
    "metadata": {
      "email": "test@belsuite.com",
      "name": "Test User"
    }
  }'
```

Test card numbers:
- Success: `4242 4242 4242 4242`
- Failure: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Test Paystack Payment
```bash
curl -X POST http://localhost:3001/api/v1/payments/create \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paystack",
    "subscriptionId": "sub_test_001",
    "amount": 5000,
    "currency": "NGN",
    "metadata": {
      "email": "test@belsuite.com"
    }
  }'
```

### Test Flutterwave Payment
```bash
curl -X POST http://localhost:3001/api/v1/payments/create \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "flutterwave",
    "subscriptionId": "sub_test_001",
    "amount": 5000,
    "currency": "NGN",
    "metadata": {
      "email": "test@belsuite.com"
    }
  }'
```

### Test PayPal Payment
```bash
curl -X POST http://localhost:3001/api/v1/payments/create \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paypal",
    "subscriptionId": "sub_test_001",
    "amount": 9.99,
    "currency": "USD",
    "metadata": {
      "email": "test@belsuite.com"
    }
  }'
```

### Test Sofort Payment
```bash
curl -X POST http://localhost:3001/api/v1/payments/create \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "sofort",
    "subscriptionId": "sub_test_001",
    "amount": 9.99,
    "currency": "EUR",
    "metadata": {
      "email": "test@belsuite.com",
      "countryCode": "DE"
    }
  }'
```

---

## Troubleshooting

### Provider Not Responding
- Check API keys in `.env`
- Verify internet connectivity
- Check provider's status page
- Test with `curl`:
  ```bash
  curl -I https://api.stripe.com
  curl -I https://api.paystack.co
  curl -I https://api.flutterwave.com/v3
  curl -I https://api-m.sandbox.paypal.com
  curl -I https://api.sofort.com
  ```

### Webhooks Not Received
- Ensure public URL is accessible (not localhost)
- Check webhook configuration in provider dashboard
- Verify signing secrets in `.env`
- Check application logs

### Payment Creation Fails
- Verify correct provider name
- Check currency is supported by provider
- Ensure JWT token is valid
- Verify organization exists

### Webhook Signature Mismatch
- Verify webhook secret is correct in `.env`
- Check provider hasn't rotated secret
- Ensure raw request body isn't modified

---

## Provider Comparison Matrix

| Feature | Stripe | Paystack | Flutterwave | PayPal | Sofort |
|---------|--------|----------|------------|--------|--------|
| One-Time Payments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Subscriptions | ✅ | ✅ | ✅ | ✅ | ✗ |
| ACH/Bank Transfer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Card Payments | ✅ | ✅ | ✅ | ✅ | ✗ |
| Mobile Money | ✗ | ✅ | ✅ | ✗ | ✗ |
| Africa Support | Limited | Excellent | Excellent | Good | ✗ |
| Europe Support | Good | Limited | Limited | Good | Excellent |
| Global Support | Excellent | Limited | Good | Excellent | Good |
| Lowest Fee | Competitive | 1.5% + ₦100 | 1.4% + ₦100 | 2.9% + $0.30 | 0.99-1.99% |

---

## Security Best Practices

✅ **Do:**
- Store API keys in `.env` file (never commit)
- Verify webhook signatures
- Use HTTPS for all endpoints
- Rotate secrets regularly
- Test webhooks in sandbox first
- Monitor payment metrics

❌ **Don't:**
- Log sensitive data (keys, tokens, card numbers)
- Hand server-side tokens to client
- Store raw card data
- Trust client-side validation alone
- Use production keys for testing
- Leave test APIs in production

---

**Last Updated:** 2024-01-15
**Setup Time:** ~45 minutes for all providers
