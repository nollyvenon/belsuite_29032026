# Admin Email Settings - Quick Start Guide

## 30-Second Setup

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add_admin_email_settings
```

### 2. Import AdminModule

Open `src/app.module.ts` and add:

```typescript
import { AdminModule } from './backend/admin/admin.module';

@Module({
  imports: [
    // ... existing imports
    AdminModule,  // ← Add this
  ],
})
export class AppModule {}
```

### 3. Set Encryption Key (Important!)

Add to `.env.local`:

```env
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

If not set, defaults to development key (insecure).

### 4. Access Admin Panel

Navigate to:
```
http://localhost:3000/api/admin/email/settings
```

---

## API Usage Examples

### Get Current Settings

```bash
curl -X GET http://localhost:3000/api/admin/email/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Configure SendGrid

```bash
curl -X PUT http://localhost:3000/api/admin/email/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryProvider": "sendgrid",
    "sendgridApiKey": "SG.your_key_here",
    "emailFrom": "noreply@yourdomain.com",
    "emailFromName": "Your Company"
  }'
```

### Configure Gmail SMTP

```bash
curl -X PUT http://localhost:3000/api/admin/email/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryProvider": "smtp",
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpSecure": false,
    "smtpUser": "your-email@gmail.com",
    "smtpPassword": "your-app-password",
    "emailFrom": "your-email@gmail.com",
    "emailFromName": "Your Company"
  }'
```

### Send Test Email

```bash
curl -X POST http://localhost:3000/api/admin/email/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testEmail": "admin@example.com"
  }'
```

### Get Available Providers

```bash
curl -X GET http://localhost:3000/api/admin/email/providers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Health

```bash
curl -X GET http://localhost:3000/api/admin/email/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Configuration Templates

### For Development (Sendmail)

```json
{
  "primaryProvider": "sendmail",
  "sendmailPath": "/usr/sbin/sendmail",
  "emailFrom": "dev@localhost",
  "emailFromName": "Dev Environment"
}
```

### For Staging (Gmail SMTP)

```json
{
  "primaryProvider": "smtp",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpSecure": false,
  "smtpUser": "staging-email@gmail.com",
  "smtpPassword": "app-specific-password",
  "emailFrom": "staging@yourdomain.com",
  "emailFromName": "Your App - Staging",
  "enableFailover": false
}
```

### For Production (SendGrid + Failover)

```json
{
  "primaryProvider": "sendgrid",
  "sendgridApiKey": "SG.production_key_here",
  "emailFrom": "noreply@yourdomain.com",
  "emailFromName": "Your Company",
  "enableFailover": true,
  "fallbackProviders": ["mailgun", "postmark", "smtp"],
  "maxRetries": 3,
  "retryDelayMs": 5000,
  "rateLimitPerMinute": 500,
  "rateLimitPerHour": 100000,
  "trackingEnabled": true,
  "webhooksEnabled": true
}
```

---

## Features

✓ **6 Email Providers**
- SendGrid
- Mailgun
- Postmark
- AWS SES
- Generic SMTP
- Sendmail

✓ **Security**
- API keys encrypted at rest
- Admin-only access
- Organization isolation
- Audit trail

✓ **Reliability**
- Automatic failover
- Retry logic
- Health checks
- Test email verification

✓ **Management**
- No code changes needed
- Instant configuration
- Rate limiting
- Feature toggles

---

## File Structure

```
src/backend/admin/
├── admin.module.ts                           Main module
├── index.ts                                  Exports
├── controllers/
│   └── admin-email-settings.controller.ts    6 GET endpoints
│                                             1 PUT endpoint
│                                             1 POST endpoint
├── services/
│   └── admin-email-settings.service.ts       Business logic
│                                             Encryption/Decryption
│                                             Provider management
├── dtos/
│   └── email-settings.dto.ts                 Types & validation
└── ADMIN_EMAIL_SETTINGS.md                   Full documentation
```

---

## Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/email/settings` | Get current settings |
| PUT | `/api/admin/email/settings` | Update settings |
| GET | `/api/admin/email/providers` | List available providers |
| POST | `/api/admin/email/test` | Send test email |
| GET | `/api/admin/email/health` | Check configuration health |
| GET | `/api/admin/email/configured` | List configured providers |

---

## Troubleshooting

### Module Not Found

**Error:** `Cannot find module '@nestjs/common'`

**Solution:** Ensure AdminModule is imported after NestJS modules

```typescript
import { AdminModule } from './backend/admin/admin.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [AdminModule],
})
export class AppModule {}
```

### Encryption Key Not Set

**Warning:** "ENCRYPTION_KEY not found, using default dev key"

**Solution:** Add to `.env.local`:

```env
ENCRYPTION_KEY=your-32-character-minimum-key-here
```

### API Key Still Shows in Response

**Issue:** Sensitive data visible in API response

**Solution:** Keys are intentionally returned (encrypted in DB). Add masking in frontend if needed.

### Test Email Not Sending

**Issue:** Test email POST returns error

**Solutions:**
1. Verify API key is correct
2. Check provider is configured
3. Verify domain is registered with provider
4. Check DNS records (SPF, DKIM, DMARC)

---

## Next Steps

1. **Run migrations** - Set up database
2. **Import module** - Add to app.module.ts
3. **Set encryption key** - Secure API keys
4. **Test configuration** - Send test email
5. **Setup failover** - Configure backup providers
6. **Monitor** - Check health status

---

## For Complete Documentation

See [ADMIN_EMAIL_SETTINGS.md](./ADMIN_EMAIL_SETTINGS.md)

---
