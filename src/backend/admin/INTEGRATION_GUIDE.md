# Admin Email Settings - Integration Guide

## Step-by-Step Integration

### Step 1: Database Migration

Generate and run the migration:

```bash
# Generate migration
npx prisma migrate dev --name add_admin_email_settings

# Or if using existing migrations folder:
npx prisma generate
npx prisma db push
```

**What this does:**
- Creates `AdminEmailSettings` table
- Adds `emailSettings` relationship to `Organization` model
- Adds SENDMAIL and SMTP to `EmailProvider` enum
- Creates indexes for performance

---

### Step 2: Update app.module.ts

Add AdminModule to your main application module:

**Before:**
```typescript
import { Module } from '@nestjs/common';
import { PaymentModule } from './backend/payments/payment.module';
import { EmailModule } from './backend/email/email.module';

@Module({
  imports: [
    PaymentModule,
    EmailModule,
    // ... other modules
  ],
})
export class AppModule {}
```

**After:**
```typescript
import { Module } from '@nestjs/common';
import { PaymentModule } from './backend/payments/payment.module';
import { EmailModule } from './backend/email/email.module';
import { AdminModule } from './backend/admin/admin.module'; // ← Add this import

@Module({
  imports: [
    PaymentModule,
    EmailModule,
    AdminModule, // ← Add this
    // ... other modules
  ],
})
export class AppModule {}
```

---

### Step 3: Set Environment Variables

Add to `.env.local` (for development) or `.env.production` (for production):

```env
# Required: Encryption key for API keys (minimum 32 characters)
ENCRYPTION_KEY=your-secure-encryption-key-minimum-32-chars

# Optional: Default email provider (defaults to sendgrid)
EMAIL_PROVIDER=sendgrid

# Optional: Default from address
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Company
```

**Important:** Never commit `.env.local` or with real keys. Use `.gitigore`:

```
.env.local
.env.production.local
```

---

### Step 4: Setup Authentication & Authorization

The admin endpoints are protected by:
1. JWT authentication (requires valid token)
2. Organization context (req.user.organizationId)
3. Admin role (inferred from request)

**Ensure your authentication middleware provides:**
```typescript
req.user = {
  id: 'user_123',
  email: 'admin@example.com',
  organizationId: 'org_456',
  role: 'admin'
}
```

---

### Step 5: Restart Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## Verification Checklist

After integration, verify everything works:

### Test 1: Database Migration
```bash
# Check if AdminEmailSettings table exists
npx prisma studio
# Look for 'AdminEmailSettings' in the left sidebar
```

### Test 2: Module Loads
```bash
# Check for errors on startup
npm run dev 2>&1 | grep -i admin
# Should not show errors
```

### Test 3: API Endpoints
```bash
# Try getting settings (will fail without valid token, that's OK)
curl -X GET http://localhost:3000/api/admin/email/settings
# Should get 401 Unauthorized (not 404 Not Found)
```

### Test 4: Authentication
```bash
# Get valid JWT token first (from login endpoint)
TOKEN="your_jwt_token_here"

# Get settings with token
curl -X GET http://localhost:3000/api/admin/email/settings \
  -H "Authorization: Bearer $TOKEN"
```

---

## Integration with Existing Email Service

### Automatic Integration (No Changes Needed)

The email system automatically loads admin settings:

```typescript
// In EmailService, settings are loaded automatically:
const settings = await adminEmailSettingsService.getEmailSettings(organizationId);
const provider = providerFactory.getProvider(settings.primaryProvider);
```

### Manual Integration (If Needed)

To manually use admin settings in custom code:

```typescript
import { AdminEmailSettingsService } from '../admin/services/admin-email-settings.service';

@Injectable()
export class CustomEmailService {
  constructor(
    private readonly adminSettings: AdminEmailSettingsService,
  ) {}

  async sendCustomEmail(organizationId: string, to: string) {
    // Get admin-configured settings
    const settings = await this.adminSettings.getEmailSettings(organizationId);
    
    // Use configured provider
    console.log(`Using provider: ${settings.primaryProvider}`);
    
    // Rest of email sending logic...
  }
}
```

---

## Feature Integration Points

### 1. User Registration

When user signs up, use admin-configured email:

```typescript
await emailService.send({
  to: newUser.email,
  subject: 'Welcome!',
  template: 'welcome',
  organizationId: newUser.organizationId,
});
```

**This automatically:**
- Loads admin settings for the organization
- Uses configured primary provider
- Applies failover if enabled
- Respects rate limits

### 2. Payment Notifications

Send payment confirmations using admin config:

```typescript
await emailService.send({
  to: user.email,
  subject: 'Payment Received',
  template: 'payment_received',
  organizationId: organizationId,
  variables: { amount: payment.amount },
});
```

### 3. System Emails

Admin can configure ALL outgoing emails without code changes:

```typescript
// Marketing emails
await emailService.send({...});

// Notification emails
await emailService.send({...});

// Transactional emails
await emailService.send({...});

// All respect admin configuration automatically
```

---

## Database Relationships

### Organization → AdminEmailSettings (One-to-One)

```typescript
// In your code:
const org = await prisma.organization.findUnique({
  where: { id: organizationId },
  include: { emailSettings: true }, // ← Include admin settings
});

console.log(org.emailSettings.primaryProvider); // "sendgrid"
```

### AdminEmailSettings Fields

| Field | Type | Purpose |
|-------|------|---------|
| organizationId | String (unique) | Which organization |
| primaryProvider | String | Which provider to use |
| sendgridApiKey | String (encrypted) | SendGrid API key |
| mailgunApiKey | String (encrypted) | Mailgun API key |
| awsAccessKeyId | String (encrypted) | AWS credentials |
| smtpHost | String | SMTP server address |
| enableFailover | Boolean | Use backup providers |
| fallbackProviders | String[] | List of backup providers |
| maxRetries | Int | Retry attempts per provider |
| rateLimitPerMinute | Int | Rate limit setting |
| trackingEnabled | Boolean | Enable delivery tracking |
| updatedAt | DateTime | Last update timestamp |
| lastTestedAt | DateTime | Last successful test |
| testStatus | String | Test result message |

---

## Encryption/Decryption

### How API Keys Are Protected

1. **Storage:** Encrypted using AES-256-CBC before saving to database
2. **Retrieval:** Decrypted on-the-fly when needed
3. **Usage:** Never appear in logs or responses
4. **Key:** Stored in `ENCRYPTION_KEY` environment variable

### Encryption Implementation

```typescript
// In AdminEmailSettingsService

// Encryption
private encrypt(value: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return iv.toString('hex') + ':' + encrypted;
}

// Decryption
private decrypt(encrypted: string): string {
  const [iv, ciphertext] = encrypted.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return decipher.update(ciphertext, 'hex', 'utf8');
}
```

---

## Error Handling

### Handle Missing Settings

```typescript
try {
  const settings = await adminSettings.getEmailSettings(organizationId);
  
  if (!settings.primaryProvider) {
    throw new Error('No email provider configured');
  }
} catch (error) {
  // Fall back to environment default
  console.warn('Using default provider', error.message);
}
```

### Handle Encryption Errors

The service gracefully handles encryption failures:

```typescript
// If encryption fails, logs warning and continues
// If decryption fails, returns encrypted value as-is
```

---

## Monitoring & Debugging

### Check Settings in Database

```sql
SELECT 
  organizationId,
  primaryProvider,
  enableFailover,
  lastTestedAt,
  testStatus
FROM "AdminEmailSettings"
WHERE organizationId = 'org_123';
```

### View Health Status

```bash
curl -X GET http://localhost:3000/api/admin/email/health \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "healthy": true,
  "primaryProvider": "sendgrid",
  "configuredProviders": ["sendgrid", "mailgun"],
  "lastTest": "2026-03-29T10:30:00Z",
  "testStatus": "SUCCESS"
}
```

### Debug API Key Issues

Enable debug logging in service:

```typescript
// In AdminEmailSettingsService
private readonly logger = new Logger(AdminEmailSettingsService.name);

this.logger.log(`Email settings updated for org: ${organizationId}`);
```

Check logs:
```bash
npm run dev 2>&1 | grep -i "email settings"
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Database migration completed successfully
- [ ] AdminModule imported in app.module.ts
- [ ] ENCRYPTION_KEY environment variable set (32+ chars)
- [ ] JWT authentication working
- [ ] Admin endpoint protected with auth guard
- [ ] Test email configuration works
- [ ] Failover providers configured (optional)
- [ ] Monitoring/alerting setup
- [ ] Backup of encryption key stored securely

### Environment Setup

**Development (.env.local):**
```env
ENCRYPTION_KEY=32-character-dev-key-for-testing
EMAIL_PROVIDER=sendmail
```

**Production (.env.production):**
```env
ENCRYPTION_KEY=secure-production-encryption-key-32chars-minimum
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App
```

### Scaling Considerations

- AdminEmailSettings is per-organization (no cross-org data sharing)
- Encryption/decryption happens in-memory (minimal overhead)
- No background jobs needed
- Database queries are indexed on organizationId

---

## Rollback

If you need to rollback the integration:

### Option 1: Keep Database, Disable Module

Comment out AdminModule import:

```typescript
// import { AdminModule } from './backend/admin/admin.module'; // Commented out
```

Restart application. Email service will still work with environment variables.

### Option 2: Full Rollback

Rollback the database migration:

```bash
npx prisma migrate resolve --rolled-back add_admin_email_settings
npx prisma migrate deploy
```

Remove AdminModule from app.module.ts.

---

## Troubleshooting

### "AdminModule not found"

**Error:** `Cannot find module './backend/admin/admin.module'`

**Solution:** 
1. Check file path is correct
2. Ensure admin folder exists with all files
3. Rebuild TypeScript: `npm run build`

### "Prisma error: missing relation"

**Error:** `Unknown relation 'emailSettings' in include statement`

**Solution:** Run migration:
```bash
npx prisma migrate dev
```

### "Encryption key validation failed"

**Error:** `ENCRYPTION_KEY must be at least 32 characters`

**Solution:** Add valid key to .env:
```env
ENCRYPTION_KEY=your-32-character-minimum-key-1234567890ab
```

### "Admin endpoint returns 404"

**Error:** `POST /api/admin/email/settings 404 Not Found`

**Solution:**
1. Verify AdminModule is imported in app.module.ts
2. Restart application: `npm run dev`
3. Check controller routes: `GET /api/admin/email/settings` (note spelling)

---

## Support Resources

- [Admin Email Settings - Full Guide](./ADMIN_EMAIL_SETTINGS.md)
- [Quick Start Guide](./QUICK_START.md)
- [Email Module Documentation](../email/README.md)
- [API Endpoints Summary](./ADMIN_EMAIL_SETTINGS.md#api-endpoints)

---
