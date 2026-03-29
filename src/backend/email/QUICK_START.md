/**
 * BELSUITE EMAIL SYSTEM - QUICK START GUIDE
 * 
 * This guide will get you up and running with the email system in 20 minutes.
 */

// ============================================================================
// WHAT'S BEEN CREATED
// ============================================================================

/**
 * Email System Files Created:
 * 
 * Core Types & Interfaces:
 * ├── src/backend/email/types/
 * │   └── email.types.ts                    (Type definitions)
 * 
 * Services:
 * ├── src/backend/email/services/
 * │   ├── email-template.service.ts         (Template management)
 * │   ├── email-provider.service.ts         (Provider base class)
 * │   ├── email-queue.service.ts            (Queue management)
 * │   ├── email-analytics.service.ts        (Analytics & tracking)
 * │   └── email-service-orchestrator.ts     (Main coordinator)
 * 
 * Provider Implementations:
 * ├── src/backend/email/providers/
 * │   ├── sendgrid-provider.ts              (SendGrid integration)
 * │   ├── resend-provider.ts                (Resend integration)
 * │   └── smtp-provider.ts                  (SMTP fallback)
 * 
 * Templates & Examples:
 * ├── src/backend/email/templates/
 * │   └── default-templates.ts              (7 pre-built templates)
 * 
 * ├── src/backend/email/examples/
 * │   └── email-usage-examples.ts           (Implementation examples)
 * 
 * Documentation:
 * ├── src/backend/email/
 * │   ├── CONFIG.md                         (Setup and configuration)
 * │   ├── SYSTEM_ARCHITECTURE.md            (Complete reference)
 * │   └── QUICK_START.md                    (This file)
 */

// ============================================================================
// STEP 1: INSTALL DEPENDENCIES
// ============================================================================

/**
 * Required packages:
 * npm install @sendgrid/mail resend ioredis bull-board
 * 
 * Optional but recommended:
 * npm install dotenv zod          (Env validation)
 * npm install jest @types/jest   (Testing)
 * npm install pino               (Logging)
 */

// ============================================================================
// STEP 2: ENVIRONMENT SETUP (.env.local)
// ============================================================================

/**
 * Copy these to your .env.local file:

# Email Providers
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@belsuite.com
EMAIL_FROM_NAME=Belsuite Team

# Application
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/belsuite_dev

# Email Service Config
EMAIL_SERVICE_ENABLED=true
EMAIL_AGGREGATION_ENABLED=true
EMAIL_AGGREGATION_WINDOW=60000
EMAIL_TRACKING_ENABLED=true
EMAIL_RATE_LIMIT=100
EMAIL_DAILY_CAP=10000

# Redis (for queue)
REDIS_URL=redis://localhost:6379

# SMTP Fallback (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app_password
 */

// ============================================================================
// STEP 3: UPDATE PRISMA SCHEMA
// ============================================================================

/**
 * Add to prisma/schema.prisma:

model EmailTemplate {
  id            String   @id @default(cuid())
  name          String   @unique
  subject       String
  htmlTemplate  String   @db.Text
  textTemplate  String?  @db.Text
  category      String   // AUTH, NOTIFICATION, PAYMENT, MARKETING
  variables     String[] // JSON array of variable names
  active        Boolean  @default(true)
  organizationId String?
  organization  Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)

  version       Int      @default(1)
  createdBy     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([organizationId])
  @@index([category])
}

model EmailDispatch {
  id             String   @id @default(cuid())
  messageId      String   @unique
  template       String
  category       String
  to             String
  cc             String?
  bcc            String?
  subject        String
  provider       String
  status         String   // sent, delivered, opened, clicked, bounced, complained, failed
  organizationId String
  userId         String?

  sentAt         DateTime
  openedAt       DateTime?
  clickedAt      DateTime?
  failureReason  String?
  retryCount     Int      @default(0)

  variables      Json?
  tags           String[]
  metadata       Json?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([to])
  @@index([organizationId])
  @@index([status])
  @@index([createdAt])
}

model EmailQueue {
  id             String   @id @default(cuid())
  messageId      String   @unique
  template       String
  to             String
  organizationId String
  userId         String?

  status         String   // pending, processing, sent, failed
  variables      Json
  tags           String[]

  retryCount     Int      @default(0)
  lastRetry      DateTime?
  nextRetry      DateTime?

  priority       String   @default("normal")

  createdAt      DateTime @default(now())
  processedAt    DateTime?

  @@index([status])
  @@index([nextRetry])
  @@index([organizationId])
}

model EmailAggregationQueue {
  id             String   @id @default(cuid())
  messageId      String   @unique
  to             String
  organizationId String
  category       String

  template       String
  variables      Json

  aggregatedAt   DateTime?
  digestId       String?

  createdAt      DateTime @default(now())

  @@index([to])
  @@index([category])
  @@index([aggregatedAt])
}

model EmailDigest {
  id             String   @id @default(cuid())
  subject        String
  to             String
  organizationId String

  messageIds     String[]
  emailCount     Int
  categories     String[]

  sentAt         DateTime @default(now())
  openedAt       DateTime?

  @@index([to])
  @@index([organizationId])
}
 */

// ============================================================================
// STEP 4: RUN MIGRATIONS
// ============================================================================

/**
 * Create and run Prisma migration:
 * 
 * npm run prisma:migrate
 * 
 * Or manually:
 * npx prisma migrate dev --name add_email_tables
 */

// ============================================================================
// STEP 5: CREATE INITIALIZATION CODE
// ============================================================================

/**
 * Create src/lib/email-service.ts:

import { EmailServiceOrchestrator } from '@/backend/email/services/email-service-orchestrator';
import { initializeEmailService } from '@/backend/email/examples/email-usage-examples';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let emailOrchestrator: EmailServiceOrchestrator;

export async function getEmailService(): Promise<EmailServiceOrchestrator> {
  if (!emailOrchestrator) {
    emailOrchestrator = await initializeEmailService(prisma, {
      primaryProvider: process.env.EMAIL_SERVICE_PROVIDER || 'sendgrid',
      trackingEnabled: process.env.EMAIL_TRACKING_ENABLED === 'true',
    });
  }
  return emailOrchestrator;
}

export { emailOrchestrator };
 */

// ============================================================================
// STEP 6: CREATE FIRST API ENDPOINT
// ============================================================================

/**
 * Create pages/api/email/send.ts:

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getEmailService } from '@/lib/email-service';
import { EmailRequest } from '@/backend/email/types/email.types';
import { authOptions } from './[...nextauth]'; // Your NextAuth config

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify session
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const request: EmailRequest = req.body;
    
    // Set organization context from session
    request.organizationId = session.user.organizationId;
    request.userId = session.user.id;

    // Get orchestrator and send
    const emailService = await getEmailService();
    const result = await emailService.send(request);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Email API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
 */

// ============================================================================
// STEP 7: SEND YOUR FIRST EMAIL
// ============================================================================

/**
 * Example: Send welcome email from your user registration flow
 * 
 * In your registration handler:

import { getEmailService } from '@/lib/email-service';
import { EmailRequest, EmailCategory } from '@/backend/email/types/email.types';

async function registerUser(email: string, firstName: string) {
  // ... create user in database ...
  
  try {
    const emailService = await getEmailService();
    
    const request: EmailRequest = {
      to: email,
      templateName: 'welcome',
      category: EmailCategory.AUTH,
      organizationId: user.organizationId,
      userId: user.id,
      variables: {
        firstName,
        organizationName: user.organization.name,
        dashboardUrl: `${process.env.APP_URL}/dashboard`,
      },
      tags: ['onboarding', 'welcome'],
      priority: 'high',
    };

    const result = await emailService.send(request);
    
    if (!result.success) {
      console.error('Welcome email failed:', result.error);
      // Don't block registration, but log error
    }
  } catch (error) {
    console.error('Email service error:', error);
  }
}
 */

// ============================================================================
// STEP 8: TEST THE SYSTEM
// ============================================================================

/**
 * Test checklist:
 * 
 * ✓ npm run dev              (Start app)
 * ✓ Check DB tables created  (SELECT * FROM "EmailTemplate";)
 * ✓ Post to /api/email/send  (Test email send)
 * ✓ Check EmailDispatch log  (Verify stored in DB)
 * ✓ Check email in inbox    (Verify delivery)
 * ✓ Test template rendering (Check variables replaced)
 * ✓ Check analytics        (Verify tracking pixel)
 */

/**
 * Test request example:

curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "templateName": "welcome",
    "variables": {
      "firstName": "John",
      "organizationName": "Test Corp",
      "dashboardUrl": "http://localhost:3000/dashboard"
    }
  }'
 */

// ============================================================================
// STEP 9: CONFIGURE WEBHOOKS
// ============================================================================

/**
 * SendGrid Webhooks:
 * 1. Go to SendGrid Dashboard > Settings > Mail Send
 * 2. Click "Event Notifications"
 * 3. Enter Webhook URL: https://yourapp.com/api/email/webhooks/sendgrid
 * 4. Select events: Sent, Open, Click, Bounce, Complaint
 * 5. Click "Test Your Integration"
 * 6. Save
 * 
 * Resend Webhooks:
 * 1. Go to Resend Dashboard > Settings > Webhooks
 * 2. Click "Create Webhook"
 * 3. Enter URL: https://yourapp.com/api/email/webhooks/resend
 * 4. Select events: All events
 * 5. Copy signing secret to .env
 * 6. Save
 */

// ============================================================================
// STEP 10: MONITOR & ITERATE
// ============================================================================

/**
 * Key things to monitor:
 * 
 * 1. Email delivery rate
 *    SELECT COUNT(CASE WHEN status = 'delivered' THEN 1 END) * 100.0 / COUNT(*)
 *    FROM "EmailDispatch"
 *    WHERE createdAt > NOW() - INTERVAL '24 hours';
 * 
 * 2. Provider performance
 *    SELECT provider, COUNT(*), AVG(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)
 *    FROM "EmailDispatch"
 *    GROUP BY provider;
 * 
 * 3. Queue depth
 *    SELECT status, COUNT(*) FROM "EmailQueue" GROUP BY status;
 * 
 * 4. Failed emails
 *    SELECT * FROM "EmailDispatch"
 *    WHERE status = 'failed'
 *    ORDER BY createdAt DESC
 *    LIMIT 10;
 * 
 * 5. Error rates
 *    Set up monitoring/alerting for:
 *    - Queue depth > 1000
 *    - Delivery rate < 95%
 *    - Provider down
 */

// ============================================================================
// NEXT STEPS
// ============================================================================

/**
 * After getting started:
 * 
 * 1. Create more templates for your use cases
 *    - Payment notifications
 *    - Subscription updates
 *    - Content notifications
 *    - Daily digests
 * 
 * 2. Set up email preferences
 *    - Let users choose notification frequency
 *    - Unsubscribe management
 *    - Category preferences
 * 
 * 3. Implement A/B testing
 *    - Create template versions
 *    - Compare open/click rates
 *    - Iterate on best versions
 * 
 * 4. Advanced features
 *    - Scheduled sends
 *    - Campaign tracking
 *    - Personalization beyond variables
 *    - Bounce/complaint management
 * 
 * 5. Build dashboards
 *    - Real-time email volume
 *    - Delivery metrics
 *    - Open/click trends
 *    - Provider comparison
 * 
 * 6. Integrate with other systems
 *    - CRM sync
 *    - Analytics platforms
 *    - Slack notifications for delivery issues
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * Problem: "Provider not configured"
 * Solution: Make sure registerProvider() is called with correct provider name
 * 
 * Problem: Email not sending
 * 1. Check API key in .env
 * 2. Verify sender email is verified with provider
 * 3. Check template exists: SELECT * FROM "EmailTemplate"
 * 4. Look for errors in logs: journalctl -f -u app
 * 
 * Problem: Templates not rendering
 * 1. Check variables match template: {{variableName}}
 * 2. Verify all required variables provided
 * 3. Check for special characters in variables
 * 
 * Problem: Webhooks not working
 * 1. Verify webhook URL is accessible
 * 2. Check firewall/security groups
 * 3. Verify webhook signature verification
 * 4. Check logs for webhook events
 * 
 * Problem: High email latency
 * 1. Check provider rate limits
 * 2. Review queue depth
 * 3. Add more workers/processes
 * 4. Consider switching to faster provider
 */

/**
 * Get help:
 * - SendGrid docs: https://docs.sendgrid.com
 * - Resend docs: https://resend.com/docs
 * - System Architecture: See SYSTEM_ARCHITECTURE.md
 * - Configuration: See CONFIG.md
 * - Examples: See email-usage-examples.ts
 */

export const quickStartGuide = {
  steps: 10,
  estimatedTime: '20 minutes',
  complexity: 'Medium',
  readyToProduction: true,
};
