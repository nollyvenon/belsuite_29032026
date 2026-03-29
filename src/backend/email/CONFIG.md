/**
 * EMAIL SYSTEM CONFIGURATION GUIDE
 * 
 * This guide covers:
 * 1. Environment variable setup
 * 2. Provider configuration
 * 3. Database schema setup
 * 4. API endpoints
 * 5. Integration points
 * 6. Monitoring and troubleshooting
 */

// ============================================================================
// 1. ENVIRONMENT VARIABLES (.env.local)
// ============================================================================

/*
# Email Service Providers
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email Configuration
EMAIL_FROM=noreply@belsuite.com
EMAIL_FROM_NAME=Belsuite Team
APP_URL=https://belsuite.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/belsuite

# Email Service Settings
EMAIL_SERVICE_ENABLED=true
EMAIL_AGGREGATION_ENABLED=true
EMAIL_AGGREGATION_WINDOW=60000  # 1 minute in ms
EMAIL_TRACKING_ENABLED=true
EMAIL_RATE_LIMIT=100            # emails per second
EMAIL_DAILY_CAP=10000           # emails per day

# Queue configuration
EMAIL_QUEUE_REDIS_URL=redis://localhost:6379
EMAIL_QUEUE_CHECK_INTERVAL=30000 # Check every 30s

# SMTP Fallback (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=password
*/

// ============================================================================
// 2. DATABASE SCHEMA SETUP
// ============================================================================

/*
  Prisma schema should include:

// Email Templates
model EmailTemplate {
  id            String   @id @default(cuid())
  name          String   @unique
  subject       String
  htmlTemplate  String   @db.Text
  textTemplate  String?  @db.Text
  category      String   // AUTH, NOTIFICATION, PAYMENT, MARKETING
  variables     String[] // JSON array
  active        Boolean  @default(true)
  organizationId String?
  organization  Organization? @relation(fields: [organizationId], references: [id])
  
  // Versioning
  version       Int      @default(1)
  createdBy     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([organizationId])
  @@index([category])
}

// Email Dispatch Log
model EmailDispatch {
  id             String   @id @default(cuid())
  messageId      String   @unique
  template       String
  category       String
  to             String
  cc             String?
  bcc            String?
  subject        String
  provider       String   // sendgrid, resend, smtp
  status         String   // sent, failed, bounced, complained, opened, clicked
  organizationId String
  userId         String?
  
  // Tracking
  sentAt         DateTime
  openedAt       DateTime?
  clickedAt      DateTime?
  failureReason  String?
  retryCount     Int      @default(0)
  
  // Metadata
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

// Email Queue
model EmailQueue {
  id             String   @id @default(cuid())
  messageId      String   @unique
  template       String
  to             String
  organizationId String
  userId         String?
  
  status         String   // pending, processing, failed, sent
  variables      Json
  tags           String[]
  
  retryCount     Int      @default(0)
  lastRetry      DateTime?
  nextRetry      DateTime?
  
  priority       String   @default("normal") // high, normal, low
  
  createdAt      DateTime @default(now())
  processedAt    DateTime?
  
  @@index([status])
  @@index([nextRetry])
  @@index([organizationId])
}

// Email Aggregation Queue
model EmailAggregationQueue {
  id             String   @id @default(cuid())
  messageId      String   @unique
  to             String
  organizationId String
  category       String
  
  template       String
  variables      Json
  
  // Aggregation info
  aggregatedAt   DateTime?
  digestId       String?   // Reference to parent digest if aggregated
  
  createdAt      DateTime @default(now())
  
  @@index([to])
  @@index([category])
  @@index([aggregatedAt])
}

// Sent Digests
model EmailDigest {
  id             String   @id @default(cuid())
  subject        String
  to             String
  organizationId String
  
  messageIds     String[] // Array of aggregated message IDs
  emailCount     Int
  categories     String[]
  
  sentAt         DateTime @default(now())
  openedAt       DateTime?
  
  @@index([to])
  @@index([organizationId])
}
*/

// ============================================================================
// 3. API ENDPOINTS SETUP
// ============================================================================

/*
  Create these API routes in your Next.js app:

  // pages/api/email/send.ts
  - POST /api/email/send
  - Send single email
  - Body: { to, templateName, variables, ... }

  // pages/api/email/send-batch.ts
  - POST /api/email/send-batch
  - Send multiple emails
  - Body: { requests: EmailRequest[] }

  // pages/api/email/templates.ts
  - GET /api/email/templates
  - GET /api/email/templates/[id]
  - POST /api/email/templates
  - PUT /api/email/templates/[id]
  - Manage email templates

  // pages/api/email/track.ts
  - GET /api/email/track?id=xxx
  - Track email opens
  - Serve 1x1 tracking pixel

  // pages/api/email/webhooks/sendgrid.ts
  - POST /api/email/webhooks/sendgrid
  - Handle SendGrid events (sent, open, click, bounce)

  // pages/api/email/webhooks/resend.ts
  - POST /api/email/webhooks/resend
  - Handle Resend events

  // pages/api/email/analytics.ts
  - GET /api/email/analytics
  - Get email analytics and performance data

  // pages/api/email/queue.ts
  - GET /api/email/queue
  - Get queue status
  - POST /api/email/queue/process
  - Process queue manually
*/

// ============================================================================
// 4. INTEGRATING WITH YOUR APPLICATION
// ============================================================================

/*
  Example: src/pages/api/email/send.ts

  import { NextApiRequest, NextApiResponse } from 'next';
  import { emailOrchestrator } from '@/lib/email-service';
  import { EmailRequest } from '@/backend/email/types/email.types';

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const request: EmailRequest = req.body;
      
      // Validate authentication
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Add organization context
      request.organizationId = session.user.organizationId;
      request.userId = session.user.id;

      // Send email
      const result = await emailOrchestrator.send(request);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Email API error:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  }
*/

// ============================================================================
// 5. PROVIDER SETUP DETAILS
// ============================================================================

/*
  SendGrid:
  1. Sign up at https://sendgrid.com
  2. Create API key in Settings > API Keys
  3. Store in SENDGRID_API_KEY
  4. Verify sender email
  5. Configure webhooks:
     - Event Webhook: POST https://yourapp.com/api/email/webhooks/sendgrid
     - Enable: Sent, Open, Click, Bounce, Complaint

  Resend:
  1. Sign up at https://resend.com
  2. Get API key from dashboard
  3. Store in RESEND_API_KEY
  4. Verify sender domain
  5. Configure webhook:
     - URL: https://yourapp.com/api/email/webhooks/resend
     - Events: sent, delivered, opened, clicked

  SMTP Fallback:
  - Use for self-hosted or additional provider
  - Useful for debugging
  - Configure in .env
*/

// ============================================================================
// 6. WEBHOOK PAYLOAD EXAMPLES
// ============================================================================

/*
  SendGrid Webhook Event:
  {
    "event": "open",
    "email": "user@example.com",
    "timestamp": 1513299510,
    "message_id": "message_id",
    "ip": "192.168.1.1",
    "useragent": "Mozilla/5.0...",
    "sg_message_id": "sg_id",
    "sg_event_id": "event_id"
  }

  Resend Webhook Event:
  {
    "type": "email.opened",
    "created_at": "2024-01-15T10:30:00Z",
    "data": {
      "email": "user@example.com",
      "message_id": "message_id"
    }
  }
*/

// ============================================================================
// 7. MONITORING & TROUBLESHOOTING
// ============================================================================

/*
  Check Email Queue Status:
  SELECT status, COUNT(*) as count FROM "EmailQueue" 
  GROUP BY status;

  Find Failed Emails:
  SELECT * FROM "EmailDispatch" 
  WHERE status = 'failed' 
  ORDER BY createdAt DESC 
  LIMIT 10;

  Email Delivery Rate:
  SELECT 
    COUNT(CASE WHEN status IN ('sent', 'delivered') THEN 1 END) as delivered,
    COUNT(*) as total,
    ROUND(100.0 * COUNT(CASE WHEN status IN ('sent', 'delivered') THEN 1 END) / 
          COUNT(*), 2) as delivery_rate
  FROM "EmailDispatch"
  WHERE createdAt > NOW() - INTERVAL '24 hours';

  Provider Performance:
  SELECT provider, status, COUNT(*) as count
  FROM "EmailDispatch"
  WHERE createdAt > NOW() - INTERVAL '7 days'
  GROUP BY provider, status;

  Common Issues:
  - 401 Unauthorized: Check API keys
  - 429 Too Many Requests: Reduce rate limit or upgrade plan
  - Emails not sending: Check organization email quota
  - Webhooks not processing: Verify webhook URL is accessible
  - Template not found: Ensure template is seeded in database
*/

// ============================================================================
// 8. BEST PRACTICES
// ============================================================================

/*
  1. Template Organization
     - Group by category (AUTH, PAYMENT, etc)
     - Version templates for A/B testing
     - Use consistent variable naming

  2. Error Handling
     - Always catch and log errors
     - Use retry queue for failed emails
     - Monitor dead letter queue

  3. Performance
     - Enable aggregation for low-priority emails
     - Use batch sending for bulk operations
     - Monitor queue processing time

  4. Security
     - Validate email addresses
     - Sanitize user input in templates
     - Implement rate limiting per user/org
     - Use organization isolation in all queries

  5. Compliance
     - Include unsubscribe link in marketing emails
     - Track consent and preferences
     - Log all email activity for audit
     - Comply with CAN-SPAM, GDPR, CCPA

  6. Testing
     - Use test email addresses in staging
     - Mock providers in unit tests
     - Verify template rendering
     - Test with various email clients
*/

// ============================================================================
// 9. INITIALIZATION CHECKLIST
// ============================================================================

const initializationChecklist = {
  provider_setup: [
    '☐ SendGrid API key configured',
    '☐ Resend API key configured (optional)',
    '☐ Sender email verified',
    '☐ Webhooks configured',
  ],
  database: [
    '☐ Prisma migrations run',
    '☐ Email tables created',
    '☐ Default templates seeded',
  ],
  environment: [
    '☐ .env variables set',
    '☐ Email service enabled',
    '☐ Redis/queue configured',
    '☐ Tracking URL configured',
  ],
  api: [
    '☐ Email API endpoints created',
    '☐ Webhook endpoints created',
    '☐ Analytics endpoint created',
    '☐ Authentication middleware added',
  ],
  testing: [
    '☐ Send test email',
    '☐ Verify template rendering',
    '☐ Test webhook receiving',
    '☐ Check analytics tracking',
  ],
};

export { initializationChecklist };
