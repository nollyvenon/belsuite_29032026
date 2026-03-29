# Admin Email Settings Panel - Complete Guide

## Overview

The Admin Email Settings Panel allows administrators to configure and manage email providers directly from the admin interface without code changes. Supports all 6 email providers with validation, testing, and failover configuration.

---

## Architecture

### File Structure

```
src/backend/admin/
├── admin.module.ts                          ← Main module
├── index.ts                                 ← Exports
├── controllers/
│   └── admin-email-settings.controller.ts   ← HTTP endpoints (10 routes)
├── services/
│   └── admin-email-settings.service.ts      ← Business logic
└── dtos/
    └── email-settings.dto.ts                ← Request/response types
```

### Database Model

```prisma
model AdminEmailSettings {
  id                 String   @id
  organizationId     String   @unique
  
  // Provider configs (encrypted)
  primaryProvider    String    // Which provider to use
  sendgridApiKey     String?   // Encrypted
  mailgunApiKey      String?   // Encrypted
  awsAccessKeyId     String?   // Encrypted
  postmarkApiKey     String?   // Encrypted
  smtpPassword       String?   // Encrypted
  sendmailPath       String?
  
  // Failover & Rate Limiting
  enableFailover     Boolean
  fallbackProviders  String[]
  maxRetries         Int
  rateLimitPerMinute Int
  rateLimitPerHour   Int
  
  // Features
  trackingEnabled    Boolean
  webhooksEnabled    Boolean
  
  // Audit
  updatedAt          DateTime
  lastTestedAt       DateTime?
  testStatus         String?
}
```

---

## API Endpoints

### 1. Get Current Email Settings

**Endpoint:** `GET /api/admin/email/settings`

**Authentication:** JWT token required, admin role

**Response:**
```json
{
  "organizationId": "org_123",
  "primaryProvider": "sendgrid",
  "emailFrom": "noreply@yourdomain.com",
  "emailFromName": "Your Company",
  "sendgridApiKey": "SG.xxx...",
  "sendgridWebhookSecret": "whsec_xxx...",
  "enableFailover": true,
  "fallbackProviders": ["mailgun", "postmark", "ses"],
  "maxRetries": 3,
  "retryDelayMs": 5000,
  "rateLimitPerMinute": 100,
  "rateLimitPerHour": 10000,
  "trackingEnabled": true,
  "webhooksEnabled": true,
  "attachmentsEnabled": true,
  "updatedAt": "2026-03-29T10:00:00Z",
  "lastTestedAt": "2026-03-29T10:30:00Z",
  "testStatus": "SUCCESS"
}
```

---

### 2. Update Email Settings

**Endpoint:** `PUT /api/admin/email/settings`

**Authentication:** JWT token required, admin role

**Request Body:**
```json
{
  "primaryProvider": "sendgrid",
  "sendgridApiKey": "SG.new_key_here",
  "sendgridDomain": "mail.yourdomain.com",
  "emailFrom": "noreply@yourdomain.com",
  "emailFromName": "Your Company",
  "enableFailover": true,
  "fallbackProviders": ["mailgun", "postmark"],
  "maxRetries": 3,
  "rateLimitPerMinute": 100
}
```

**Response:** Same as Get settings (updated data)

**Validation Rules:**
- At least one provider must be configured
- API keys are encrypted before storage
- Provider-specific fields required per provider type
- Fallback providers must be valid provider names

---

### 3. Get Available Providers

**Endpoint:** `GET /api/admin/email/providers`

**Authentication:** JWT token required

**Response:**
```json
[
  {
    "id": "sendgrid",
    "name": "SendGrid",
    "description": "Professional email delivery service",
    "configFields": [
      {
        "name": "sendgridApiKey",
        "label": "API Key",
        "type": "password",
        "required": true,
        "description": "Your SendGrid API key"
      }
    ],
    "pricing": "Pay-as-you-go",
    "maxEmailsPerSecond": 100,
    "features": ["Tracking", "Webhooks", "Templates", "Batch sending"]
  },
  {
    "id": "mailgun",
    "name": "Mailgun",
    "description": "Email delivery platform",
    "configFields": [
      {
        "name": "mailgunApiKey",
        "label": "API Key",
        "type": "password",
        "required": true
      }
    ],
    "pricing": "Free tier + paid",
    "maxEmailsPerSecond": 50,
    "features": ["Tracking", "Webhooks", "Templates"]
  },
  {
    "id": "postmark",
    "name": "Postmark",
    "description": "Premium email API"
  },
  {
    "id": "ses",
    "name": "AWS SES",
    "description": "Amazon Simple Email Service"
  },
  {
    "id": "smtp",
    "name": "Generic SMTP",
    "description": "Any SMTP server (Gmail, Office 365, etc.)"
  },
  {
    "id": "sendmail",
    "name": "Sendmail",
    "description": "Local system sendmail command"
  }
]
```

---

### 4. List Configured Providers

**Endpoint:** `GET /api/admin/email/configured`

**Authentication:** JWT token required

**Response:**
```json
["sendgrid", "mailgun", "smtp"]
```

Returns only providers that have configuration set up.

---

### 5. Check Email Configuration Health

**Endpoint:** `GET /api/admin/email/health`

**Authentication:** JWT token required

**Response:**
```json
{
  "healthy": true,
  "primaryProvider": "sendgrid",
  "configuredProviders": ["sendgrid", "mailgun", "smtp"],
  "lastTest": "2026-03-29T10:30:00Z",
  "testStatus": "SUCCESS"
}
```

**Status Values:**
- `healthy: true` - At least one provider configured and last test passed
- `healthy: false` - No providers or last test failed

---

### 6. Send Test Email

**Endpoint:** `POST /api/admin/email/test`

**Authentication:** JWT token required

**Request Body:**
```json
{
  "testEmail": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "provider": "sendgrid",
  "message": "Test email sent successfully via sendgrid"
}
```

**What Test Email Does:**
1. Uses current primary provider
2. Sends to specified email address
3. Updates `lastTestedAt` and `testStatus` in database
4. Provides clear success/failure feedback

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid API key for SendGrid provider"
}
```

---

## Provider Configuration Examples

### SendGrid Implementation

**API Key:** Get from SendGrid dashboard → Settings → API Keys

**Configuration:**
```json
{
  "primaryProvider": "sendgrid",
  "sendgridApiKey": "SG.7vvKG8x9vRJ4qKl9x4qKl9x4qKl9x4qKl",
  "sendgridDomain": "mail.yourdomain.com",
  "sendgridWebhookSecret": "whsec_xxx..."
}
```

**Setup Steps:**
1. Create SendGrid account and verify domain
2. Generate API token (with Mail Send permission)
3. Add API key to admin panel
4. Send test email to verify
5. (Optional) Configure webhooks for bounce tracking

---

### Mailgun Implementation

**Configuration:**
```json
{
  "primaryProvider": "mailgun",
  "mailgunApiKey": "key-xxx...",
  "mailgunDomain": "mg.yourdomain.com"
}
```

**Setup Steps:**
1. Create Mailgun account
2. Verify domain (add DNS records)
3. Get API key from dashboard
4. Add to admin panel
5. Test email sending

---

### AWS SES Implementation

**Configuration:**
```json
{
  "primaryProvider": "ses",
  "awsAccessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "awsSecretAccessKey": "wJalrXUtnFEMI/K7MDENG/...",
  "awsRegion": "us-east-1"
}
```

**Setup Steps:**
1. Create AWS account with SES service
2. Verify domain in SES console
3. Create IAM user with SES permissions
4. Generate access keys
5. Add to admin panel

---

### Generic SMTP Implementation (Gmail Example)

**Configuration:**
```json
{
  "primaryProvider": "smtp",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpSecure": false,
  "smtpUser": "your-email@gmail.com",
  "smtpPassword": "xxxx xxxx xxxx xxxx"
}
```

**Gmail Setup:**
1. Enable 2-Factor Authentication on Gmail
2. Generate app-specific password
3. Use app password (without spaces) as password
4. Configure as shown above

**Other Common SMTP Servers:**
- Office 365: smtp.office365.com:587
- Mailgun: smtp.mailgun.org:587
- SendGrid: smtp.sendgrid.net:587
- Custom: your-mail-server.com:25/587/465

---

### Postmark Implementation

**Configuration:**
```json
{
  "primaryProvider": "postmark",
  "postmarkApiKey": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "postmarkDomain": "mail.yourdomain.com"
}
```

---

### Sendmail Implementation

**Configuration:**
```json
{
  "primaryProvider": "sendmail",
  "sendmailPath": "/usr/sbin/sendmail"
}
```

**Setup:**
- Linux/macOS systems usually have sendmail or compatible
- Verify: `which sendmail`
- For development only (production not recommended)

---

## Security Features

### 1. Encryption

- All sensitive fields (API keys, passwords) encrypted in database
- Uses AES-256-CBC encryption
- Encryption key from environment: `ENCRYPTION_KEY`
- Decrypted only when needed

### 2. Access Control

- Admin endpoint requires JWT authentication
- Admin role authorization enforced
- Organization isolation (can only configure own org)
- Audit trail of configuration changes

### 3. Data Protection

- API keys never exposed in logs
- Test email validation (must be valid email format)
- Provider validation before saving
- Input sanitization on all fields

---

## Failover Configuration

### How Failover Works

1. **Primary Provider:** First choice for sending emails
2. **Fallback Providers:** Used if primary fails
3. **Retry Logic:** 3 retries per provider before moving to next
4. **Exponential Backoff:** 5 second delay between retries

### Configure Failover

```json
{
  "enableFailover": true,
  "primaryProvider": "sendgrid",
  "fallbackProviders": ["mailgun", "postmark", "smtp"],
  "maxRetries": 3,
  "retryDelayMs": 5000
}
```

### Automatic Failover Example

1. System tries to send email via SendGrid
2. SendGrid API returns 503 (service unavailable)
3. System retries SendGrid (3 times total)
4. All SendGrid retries fail
5. System automatically fails over to Mailgun
6. Email sends successfully via Mailgun

---

## Rate Limiting

### Configuration

```json
{
  "rateLimitPerMinute": 100,
  "rateLimitPerHour": 10000
}
```

### Recommended Values

| Use Case | Per Minute | Per Hour |
|----------|-----------|----------|
| Development | 10 | 100 |
| Small App | 50 | 5,000 |
| Medium App | 100 | 10,000 |
| Large App | 500 | 100,000 |
| Enterprise | 1000+ | 1000000+ |

---

## Features Management

### Tracking
- Email open tracking (pixel-based)
- Click tracking
- Bounce/complaint tracking
- Default: Enabled

### Webhooks
- Receive real-time delivery events
- Bounce/complaint notifications
- Delivery confirmations
- Default: Enabled

### Attachments
- Support for file attachments
- File size limits per provider
- Default: Enabled

---

## Admin Panel UI Layout (Suggested)

```
┌─────────────────────────────────────────────────┐
│ Email Configuration                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─ Primary Provider ─────────────────────────┐  │
│ │ [Dropdown: SendGrid ▼]                      │  │
│ │                                             │  │
│ │ API Key: [•••••••••••••] [Show/Hide]       │  │
│ │ Domain:  [mail.company.com]                │  │
│ │                                             │  │
│ └─────────────────────────────────────────────┘  │
│                                                 │
│ ┌─ Failover Providers ───────────────────────┐  │
│ │ ☑ Enable Failover                          │  │
│ │ Fallback Order:                             │  │
│ │ 1. [Mailgun ✕]                             │  │
│ │ 2. [Postmark ✕]                            │  │
│ │ 3. [SMTP ✕]                                │  │
│ │                                             │  │
│ │ [+ Add Provider]                            │  │
│ └─────────────────────────────────────────────┘  │
│                                                 │
│ ┌─ General Settings ────────────────────────┐   │
│ │ From Email: [noreply@company.com]          │   │
│ │ From Name:  [Your Company]                 │   │
│ │ Reply-To:   [support@company.com]          │   │
│ │                                             │   │
│ │ Rate Limit: [100] emails per minute        │   │
│ └─────────────────────────────────────────────┘  │
│                                                 │
│ ┌─ Features ────────────────────────────────┐   │
│ │ ☑ Enable Tracking                          │   │
│ │ ☑ Enable Webhooks                          │   │
│ │ ☑ Enable Attachments                       │   │
│ └─────────────────────────────────────────────┘  │
│                                                 │
│ ┌─ Test Configuration ──────────────────────┐   │
│ │ Send test email to:                         │   │
│ │ [admin@example.com] [Send Test Email →]    │   │
│ │                                             │   │
│ │ Last Test: 2026-03-29 10:30 AM ✓            │   │
│ └─────────────────────────────────────────────┘  │
│                                                 │
│ [← Cancel] [Save Changes] [Save & Test Email]   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Integration with Email Module

### Automatic Integration

The admin settings automatically integrate with the existing email service:

1. When email is sent, system loads admin settings
2. Uses configured primary provider
3. Applies failover providers if enabled
4. Respects rate limits
5. Updates database with delivery status

### No Code Changes Required

After configuring in admin panel:
- All emails automatically use configured provider
- New emails respect new settings immediately
- Failover happens automatically
- No restart needed

---

## Error Handling

### Common Errors & Solutions

**"Invalid API Key"**
- Verify API key is correct
- Check provider dashboard to confirm key is active
- Ensure key has correct permissions

**"Domain verification failed"**
- Verify domain ownership with provider
- Add required DNS records
- Wait for propagation (can take 24 hours)

**"SMTP connection timeout"**
- Check hostname is correct
- Verify port is accessible
- Check firewall rules
- Try different port (587 vs 465)

**"All providers failed"**
- Configure at least one provider
- Verify API keys are correct
- Send test email to verify

---

## Audit & Compliance

### Audit Trail

Changes to email settings are logged:
- Who changed the settings (userId)
- When changes were made (timestamp)
- What was changed (field names)
- Old vs new values

Query audit log:
```sql
SELECT * FROM AuditLog 
WHERE resource = 'email_settings' 
AND organizationId = 'org_123'
ORDER BY createdAt DESC;
```

### Data Encryption

- API keys encrypted at rest
- Encryption key from environment: `ENCRYPTION_KEY`
- Never logged in plaintext
- Audit logs don't show encrypted values

---

## Deployment Checklist

- [ ] Database migration run (`npm run prisma:migrate`)
- [ ] AdminModule imported in app.module.ts
- [ ] ENCRYPTION_KEY environment variable set
- [ ] Admin endpoints protected with auth guard
- [ ] Admin role required for access
- [ ] Test email configuration
- [ ] Verify failover providers work
- [ ] Monitor email delivery in production

---

## Next Steps

After setting up admin email settings:

1. **Access Admin Panel**
   - Navigate to /admin/email-settings
   - Log in with admin account

2. **Configure Primary Provider**
   - Select SendGrid, Mailgun, SES, Postmark, SMTP, or Sendmail
   - Add API key/credentials
   - Save

3. **Test Configuration**
   - Enter test email address
   - Click "Send Test Email"
   - Verify email received

4. **Setup Failover** (Optional)
   - Enable failover
   - Add backup providers in order
   - Test failover scenarios

5. **Monitor**
   - Check email health status
   - Review delivery statistics
   - Alert on failures

---

## Technical References

- [AdminEmailSettingsService](./services/admin-email-settings.service.ts) - Business logic
- [AdminEmailSettingsController](./controllers/admin-email-settings.controller.ts) - HTTP routes
- [Email Settings DTO](./dtos/email-settings.dto.ts) - Request/response types
- [Prisma Schema](../../prisma/schema.prisma) - Database model

---
