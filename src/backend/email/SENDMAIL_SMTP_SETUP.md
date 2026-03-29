# Sendmail & SMTP Email Providers - Setup Guide

## Overview

Two new email providers have been added to BelSuite's email system:
- **Sendmail**: Uses the system `sendmail` command for local mail delivery
- **SMTP**: Uses NodeMailer for generic SMTP connections to any mail server

Both providers follow the same interface as existing providers (SendGrid, Mailgun, SES, Postmark) and integrate seamlessly with the multi-provider failover system.

---

## Quick Comparison

| Feature | Sendmail | SMTP |
|---------|----------|------|
| **Setup** | Local system command | Remote mail server |
| **Configuration** | Minimal (binary path) | Host, port, credentials |
| **Use Case** | Development, localhost deployment | Production, any mail server |
| **Dependencies** | sendmail binary | NodeMailer |
| **Reliability** | High (local) | Depends on server |
| **Tracking** | Database only | Database only |

---

## Sendmail Provider Configuration

### Prerequisites

Sendmail must be installed on your system:

```bash
# Ubuntu/Debian
sudo apt-get install sendmail

# CentOS/RHEL
sudo yum install sendmail

# macOS (usually pre-installed)
brew install sendmail
```

Verify installation:
```bash
which sendmail
/usr/sbin/sendmail
```

### Environment Setup

Add to `.env.local`:

```env
# Sendmail Configuration
EMAIL_PROVIDER=sendmail
SENDMAIL_PATH=/usr/sbin/sendmail
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Belsuite
```

### Configuration Details

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_PROVIDER` | No | sendgrid | Set to `sendmail` to use this provider |
| `SENDMAIL_PATH` | No | /usr/sbin/sendmail | Path to sendmail binary |
| `EMAIL_FROM` | No | noreply@belsuite.com | Sender email address |
| `EMAIL_FROM_NAME` | No | Belsuite | Sender display name |

### Health Check

```bash
curl -X GET http://localhost:3000/api/email/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
{
  "healthy": true,
  "provider": "sendmail",
  "timestamp": "2026-03-29T10:00:00Z"
}
```

### Send Email Example

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<p>Hello from Sendmail!</p>",
    "text": "Hello from Sendmail!"
  }'
```

### Sendmail Limitations

- **No Native Tracking**: Tracking is database-only (no open/click tracking)
- **No Webhooks**: Bounce/complaint handling not available
- **Queue Depth**: Limited by system mail queue
- **Batch Processing**: Sends one at a time (slower for large batches)

### Use Cases

✓ **Development**: Quick local testing without external services  
✓ **Localhost Deployment**: Single-server installations  
✓ **Internal Systems**: Local network email delivery  
✗ Do NOT use for production on shared hosting  
✗ Do NOT use for high-volume sending

---

## SMTP Provider Configuration

### Prerequisites

- NodeMailer is included in dependencies (already installed)
- Access to an SMTP server (Gmail, Office 365, Mailgun, custom server, etc.)

### Environment Setup

Add to `.env.local`:

```env
# SMTP Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Belsuite
```

### Configuration Details

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_PROVIDER` | No | sendgrid | Set to `smtp` to use this provider |
| `SMTP_HOST` | **Yes** | localhost | SMTP server hostname |
| `SMTP_PORT` | No | 587 | SMTP port (587=TLS, 465=SSL, 25=plain) |
| `SMTP_SECURE` | No | false | Use SSL/TLS (true for port 465, false for 587) |
| `SMTP_USER` | No | - | SMTP authentication username |
| `SMTP_PASSWORD` | No | - | SMTP authentication password |
| `EMAIL_FROM` | No | noreply@belsuite.com | Sender email address |
| `EMAIL_FROM_NAME` | No | Belsuite | Sender display name |

### Common SMTP Servers

#### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use app password, not account password
```

**Note**: Enable "Less secure app access" or use 2FA with app passwords.

#### Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@company.com
SMTP_PASSWORD=your-password
```

#### Mailgun (SMTP Gateway)

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASSWORD=your-smtp-password
```

#### SendGrid (SMTP Gateway)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_sendgrid_api_key
```

#### AWS SES SMTP

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

#### Custom/Local Server

```env
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASSWORD=password
```

### Health Check

```bash
curl -X GET http://localhost:3000/api/email/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
{
  "healthy": true,
  "provider": "smtp",
  "timestamp": "2026-03-29T10:00:00Z"
}
```

### Send Email Example

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<p>Hello from SMTP!</p>",
    "text": "Hello from SMTP!",
    "priority": "high",
    "replyTo": "support@yourdomain.com"
  }'
```

### SMTP Features

✓ **Attachments**: Full attachment support  
✓ **CC/BCC**: Supported  
✓ **Priority**: Email priority headers  
✓ **Custom Headers**: Full header customization  
✓ **Connection Pooling**: Efficient connection management  
✓ **Error Handling**: Intelligent retry logic  
✓ **Batch Processing**: Sequential with small delays  

### SMTP Limitations

- **No Native Tracking**: Tracking is database-only
- **No Webhooks**: Bounce/complaint handling requires external configuration
- **Connection Dependent**: Reliability depends on mail server
- **Rate Limits**: Subject to server's rate limits

### Troubleshooting

**Error: "SMTP connection refused"**
```
Solution: Check host, port, and firewall rules
```

**Error: "Authentication failed"**
```
Solution: Verify credentials, check if 2FA is enabled (requires app password)
```

**Error: "Connection timeout"**
```
Solution: Check SMTP_HOST is correct, ensure port is accessible
```

**Email not sending but no error**
```
Solution: Check SMTP server logs, verify sender domain is allowed
```

### Use Cases

✓ **Production**: Any production SMTP server  
✓ **High Volume**: SendGrid/Mailgun SMTP gateways  
✓ **Enterprise**: Corporate mail servers  
✓ **Specific Domain**: Custom domain requirements  
✓ **Cost Reduction**: Alternative to API-based providers  

---

## Failover Configuration

Both providers can be used in the multi-provider failover chain.

### Example `.env.local` with all 6 providers:

```env
# Primary provider
EMAIL_PROVIDER=sendgrid

# SendGrid
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_WEBHOOK_SECRET=your_secret

# Mailgun
MAILGUN_API_KEY=mg-your_key_here
MAILGUN_DOMAIN=mg.yourdomain.com

# AWS SES
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Postmark
POSTMARK_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Sendmail
SENDMAIL_PATH=/usr/sbin/sendmail

# SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Common
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Belsuite
```

### Failover Order

The multi-provider service will try providers in this order:

1. **SendGrid** - Most reliable, highest volume
2. **Mailgun** - Good alternative
3. **Postmark** - Premium service
4. **SMTP** - Generic mail server
5. **AWS SES** - If AWS infrastructure
6. **Sendmail** - Local fallback

Customize the order in `multi-provider.service.ts`:

```typescript
private readonly PRIMARY_PROVIDER: EmailProviderType = 'sendgrid';
private readonly FALLBACK_PROVIDERS: EmailProviderType[] = [
  'mailgun',
  'postmark',
  'smtp',
  'ses',
  'sendmail',
];
```

---

## Monitoring & Maintenance

### Check Which Providers Are Configured

```bash
curl -X GET http://localhost:3000/api/email/providers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
{
  "configured": ["sendgrid", "mailgun", "smtp"],
  "available": ["sendgrid", "mailgun", "ses", "postmark", "sendmail", "smtp"],
  "primary": "sendgrid"
}
```

### Monitor Provider Health

```bash
curl -X GET http://localhost:3000/api/email/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response shows health of primary provider
# Check all:
curl -X GET http://localhost:3000/api/email/providers/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Logs

Check application logs for provider errors:

```bash
# Development
npm run dev

# Production with logging
docker logs belsuite-api | grep -i "email\|sendmail\|smtp"
```

### Database Metrics

Monitor email statistics:

```bash
curl -X GET http://localhost:3000/api/email/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Security Notes

### Sendmail

- Runs with server process permissions
- No external credentials stored
- Local only (no network exposure)

### SMTP

- **Never commit credentials** to git
- Use `.env.local` (gitignored)
- Consider using service accounts for production
- Rotate passwords regularly

### Environment Variables

Store sensitive values in:
```
.env.local          # Local development (gitignored)
.env.production     # Production secrets (secure vault)
Secrets management  # Docker, Kubernetes, cloud providers
```

---

## Performance Notes

### Sendmail

- **Latency**: 100-500ms (system dependent)
- **Throughput**: 10-50 emails/second
- **Memory**: Low
- **CPU**: Low
- **Storage**: Depends on sendmail queue

### SMTP

- **Latency**: 500ms-2s (server dependent)
- **Throughput**: 10-100 emails/second
- **Memory**: Connection pooling by NodeMailer
- **CPU**: Low-medium
- **Connections**: 5-10 default pool size

### Optimization Tips

1. **Sendmail** - For low volume, use sendmail
2. **SMTP** - For reliable delivery, use SMTP with SendGrid/Mailgun gateway
3. **Batch** - Use batch endpoints for bulk sending
4. **Failover** - Configure multiple providers for resilience

---

## What's Next?

After setting up Sendmail or SMTP:

1. **Send test emails** - Verify both single and batch sending
2. **Check delivery** - Confirm emails reach inbox
3. **Monitor logs** - Watch for any errors
4. **Setup failover** - Configure multiple providers
5. **Integrate** - Use in your application workflow

See [PROVIDERS_SETUP.md](./PROVIDERS_SETUP.md) for additional provider guides.
