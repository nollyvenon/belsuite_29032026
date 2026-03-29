/**
 * EMAIL PROVIDERS SETUP & CONFIGURATION GUIDE
 * 
 * Complete guide for setting up all supported email providers:
 * - SendGrid
 * - Mailgun
 * - Amazon SES
 * - Postmark
 */

// ============================================================================
// SENDGRID SETUP
// ============================================================================

/**
 * SendGrid - Most Popular & Reliable
 * 
 * 1. Sign up at https://sendgrid.com
 * 2. Create an account (free tier available)
 * 3. Verify sender domain:
 *    - Navigate to Settings > Sender Authentication
 *    - Add a domain
 *    - Add DNS records (CNAME)
 *    - Wait for verification (can take 10 minutes)
 * 4. Create API key:
 *    - Settings > API Keys > Create API Key
 *    - Select "Full Access" permissions
 *    - Copy the API key
 * 5. Add to .env:
 *    SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
 *    EMAIL_FROM=noreply@yourdomain.com
 *    EMAIL_FROM_NAME=Your App Name
 * 
 * Webhook Configuration:
 *    - Settings > Event Webhook
 *    - URL: https://yourapp.com/api/email/webhooks/sendgrid
 *    - Select events: sent, delivered, open, click, bounce, spamreport, deferred, dropped
 *    - Test webhook
 * 
 * Pricing:
 *    - Free: 100 emails/day
 *    - Paid: 2,965-500,000 emails/month
 * 
 * Limits:
 *    - Request rate: 100 requests per second
 *    - Max recipients per email: 1000
 *    - Max batch size: 1000 emails
 */

// ============================================================================
// MAILGUN SETUP
// ============================================================================

/**
 * Mailgun - Developer Friendly
 * 
 * 1. Sign up at https://mailgun.com
 * 2. Create account
 * 3. Add domain:
 *    - Mailgun Dashboard > Domains > Add Domain
 *    - Enter your domain
 *    - Add DNS records (MX, TXT, CNAME)
 * 4. Create API key:
 *    - Settings > API Security > API Keys
 *    - Copy "Private API key"
 * 5. Add to .env:
 *    MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxx
 *    MAILGUN_DOMAIN=mg.yourdomain.com
 *    EMAIL_FROM=noreply@yourdomain.com
 *    EMAIL_FROM_NAME=Your App Name
 * 
 * Webhook Configuration:
 *    - Webhooks > Add Webhook
 *    - URL: https://yourapp.com/api/email/webhooks/mailgun
 *    - Events: delivered, opened, clicked, failed, unsubscribed, complained
 *    - Test webhook
 * 
 * Pricing:
 *    - Free: 13,000 transactional emails/month
 *    - Paid: Pay-per-send (no monthly fees)
 * 
 * Limits:
 *    - Request rate: 25 requests per second
 *    - Max recipients per email: 1000
 */

// ============================================================================
// AMAZON SES SETUP
// ============================================================================

/**
 * Amazon SES - Lowest Cost for High Volume
 * 
 * 1. AWS Account required
 * 2. Open AWS SES Console (Simple Email Service)
 * 3. Verify sender domain:
 *    - Select region (us-east-1 recommended)
 *    - Domains > Verify a Domain
 *    - Enter your domain
 *    - Add DNS records (DKIM, SPF, DMARC)
 * 4. Request production access:
 *    - SES Dashboard > Sending Limits
 *    - Request a sending limit increase
 *    - AWS typically approves within 24 hours
 * 5. Create IAM credentials:
 *    - IAM > Users > Create User
 *    - Attach policy: AmazonSESFullAccess
 *    - Create access key
 * 6. Add to .env:
 *    AWS_REGION=us-east-1
 *    AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
 *    AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
 *    EMAIL_FROM=noreply@yourdomain.com
 *    EMAIL_FROM_NAME=Your App Name
 * 
 * CloudWatch Events for Webhooks:
 *    - Create SNS topic
 *    - Configure SES to publish events
 *    - Set up HTTP endpoint listener
 * 
 * Pricing:
 *    - Outbound: $0.10 per 10,000 emails
 *    - Inbound: $0.15 per 10,000 emails
 *    - Free tier: 62,000 emails/month
 * 
 * Limits:
 *    - Initial: 200 emails/24h (sandbox)
 *    - Production: Depends on sending limit increase request
 *    - Request rate: 14 emails/second (default)
 * 
 * Important:
 *    - SES starts in sandbox mode (restrict to verified emails)
 *    - Request production access for unrestricted sending
 *    - Monitor bounce and complaint rates (>5% = suspension risk)
 */

// ============================================================================
// POSTMARK SETUP
// ============================================================================

/**
 * Postmark - Premium Service, Excellent Support
 * 
 * 1. Sign up at https://postmarkapp.com
 * 2. Create account
 * 3. Add domain:
 *    - Settings > Sender Domains > Add Domain
 *    - Enter your domain
 *    - Add DNS records for DKIM/SPF
 * 4. Create server:
 *    - Servers > Create New Server
 *    - Name your server
 *    - Copy Server Token
 * 5. Create API token:
 *    - Account > API Tokens
 *    - Copy the Account API Token
 * 6. Add to .env:
 *    POSTMARK_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *    EMAIL_FROM=noreply@yourdomain.com
 *    EMAIL_FROM_NAME=Your App Name
 * 
 * Webhook Configuration:
 *    - Server > Webhooks > Add Endpoint
 *    - URL: https://yourapp.com/api/email/webhooks/postmark
 *    - Select: Open, Click, Bounce, Spam Complaint, Link Opening
 * 
 * Pricing:
 *    - Free: 100 emails/month
 *    - Paid: Starting at 10,000 emails/month
 *    - High volume: Custom pricing
 * 
 * Features:
 *    - Email templates with variables
 *    - Built-in open/click tracking
 *    - Dedicated IP available
 *    - Excellent documentation
 */

// ============================================================================
// MULTI-PROVIDER SETUP & FAILOVER
// ============================================================================

/**
 * Use Multiple Providers for High Reliability
 * 
 * Configuration Example (.env):
 * 
 *    # Primary provider
 *    EMAIL_PROVIDER=sendgrid
 *    SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
 *    
 *    # Fallback providers
 *    MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxx
 *    MAILGUN_DOMAIN=mg.yourdomain.com
 *    
 *    POSTMARK_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *    
 *    AWS_REGION=us-east-1
 *    AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
 *    AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
 * 
 * Failover Order (default):
 * 1. SendGrid
 * 2. Mailgun
 * 3. Postmark
 * 4. AWS SES
 * 
 * Each provider is tried up to 3 times before moving to the next.
 * Total retry delay: 15 seconds (5s between retries).
 */

// ============================================================================
// ENVIRONMENT VARIABLES REFERENCE
// ============================================================================

const ENV_VARIABLES = {
  // Common
  EMAIL_FROM: 'noreply@yourdomain.com',
  EMAIL_FROM_NAME: 'Your App Name',
  EMAIL_REPLY_TO: 'support@yourdomain.com',
  EMAIL_PROVIDER: 'sendgrid', // or mailgun, ses, postmark

  // SendGrid
  SENDGRID_API_KEY: 'SG.xxxxxxxxxxxxx',
  SENDGRID_WEBHOOK_SECRET: 'xxxxxxxxxxxxx',
  SENDGRID_WEBHOOK_URL: 'https://yourapp.com/api/email/webhooks/sendgrid',

  // Mailgun
  MAILGUN_API_KEY: 'key-xxxxxxxxxxxxxxxxxx',
  MAILGUN_DOMAIN: 'mg.yourdomain.com',
  MAILGUN_WEBHOOK_SECRET: 'xxxxxxxxxxxxx',

  // AWS SES
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
  AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',

  // Postmark
  POSTMARK_API_KEY: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  POSTMARK_WEBHOOK_SECRET: 'xxxxxxxxxxxxx',
};

// ============================================================================
// TESTING SETUP
// ============================================================================

/**
 * Test Each Provider Locally:
 * 
 * 1. SendGrid Test:
 *    curl -X POST http://localhost:3000/api/email/send \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "to": "test@example.com",
 *        "subject": "Test from Belsuite",
 *        "html": "<p>This is a test email from SendGrid</p>",
 *        "text": "This is a test email from SendGrid"
 *      }'
 * 
 * 2. Verify Setup:
 *    curl http://localhost:3000/api/email/health
 *    
 *    Returns provider health status for all configured providers
 */

// ============================================================================
// PROVIDER COMPARISON
// ============================================================================

const PROVIDER_COMPARISON = {
  sendgrid: {
    reliability: '99.99%',
    pricing: 'Free + Pay-as-you-go',
    deliverability: 'Excellent',
    support: '24/7 Premium',
    webhooks: 'Comprehensive',
    bulk: '1000/batch',
    rateLimit: '100 req/s',
    best_for: 'Most applications',
  },
  mailgun: {
    reliability: '99.99%',
    pricing: 'Pay-as-you-go',
    deliverability: 'Excellent',
    support: '24/7',
    webhooks: 'Comprehensive',
    bulk: '1000/batch',
    rateLimit: '25 req/s',
    best_for: 'Developers, cost-conscious',
  },
  ses: {
    reliability: '99.99%',
    pricing: 'Lowest (if high volume)',
    deliverability: 'Excellent',
    support: 'AWS Support',
    webhooks: 'Via SNS/CloudWatch',
    bulk: 'Unlimited',
    rateLimit: '14 emails/s (configurable)',
    best_for: 'High volume, AWS users',
  },
  postmark: {
    reliability: '99.99%',
    pricing: 'Premium',
    deliverability: 'Premium',
    support: '24/7 Premium',
    webhooks: 'Comprehensive',
    bulk: 'Unlimited',
    rateLimit: 'Unlimited',
    best_for: 'Premium service, great UX',
  },
};

// ============================================================================
// COMMON ISSUES & SOLUTIONS
// ============================================================================

/**
 * Issue: Emails not being sent
 * Solutions:
 * 1. Verify API key is correct in .env
 * 2. Check sender domain is verified with provider
 * 3. Verify sender email format is correct
 * 4. Check receiving email is not in suppression list
 * 5. Check account has email credit/has not reached limit
 * 
 * Issue: Emails going to spam
 * Solutions:
 * 1. Add SPF record for domain
 * 2. Add DKIM records for domain
 * 3. Add DMARC policy
 * 4. Use provider warming up feature if available
 * 5. Check email content for spam triggers
 * 
 * Issue: Low delivery rate
 * Solutions:
 * 1. Monitor bounce rate (keep < 3%)
 * 2. Monitor complaint rate (keep < 0.1%)
 * 3. Check for hard bounces and remove from list
 * 4. Validate email addresses before sending
 * 5. Use double opt-in for lists
 * 
 * Issue: Rate limiting errors
 * Solutions:
 * 1. Implement queue system (already built-in)
 * 2. Batch emails when possible
 * 3. Reduce concurrency for sending
 * 4. Upgrade provider plan for higher limits
 * 5. Switch to provider with higher limits
 */

export const PROVIDERS_GUIDE = {
  providers: ['sendgrid', 'mailgun', 'ses', 'postmark'],
  default: 'sendgrid',
  docs_url: 'https://belsuite.docs/email/providers',
};
