# BelSuite Multi-Tenant Architecture

## Overview

BelSuite implements a comprehensive multi-tenant SaaS architecture supporting 1000+ organizations with complete data isolation, custom domains, rate limiting, and usage tracking.

## Architecture Decision: Shared Database + Tenant ID

We chose the **shared database + tenant_id** pattern for the following reasons:

### Advantages
- **Cost-effective**: Single PostgreSQL instance scales to millions of tenants
- **Simple maintenance**: Single database to backup, upgrade, monitor
- **Operational efficiency**: Simpler deployment and operations
- **Data sharing possible**: Can create cross-tenant aggregated analytics
- **Faster onboarding**: New tenants instantly available

### Tradeoffs Considered
- **Schema per tenant**: More isolated but operationally complex
- **Full separate databases**: Expensive and hard to manage at scale

## Database Models

### Core Multi-Tenant Models

#### 1. **DomainMapping** - Domain to Tenant Resolution
Maps domains/subdomains to organizations for multi-tenant routing.

```prisma
model DomainMapping {
  id                      String     @id @default(cuid())
  organizationId          String
  organization            Organization @relation("TenantDomains", fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Domain types
  subdomain               String?    @unique  // "acme" for acme.belsuite.com
  domain                  String?    @unique  // "acme.example.com" for custom domains
  domainType              DomainType          // SUBDOMAIN or CUSTOM
  
  // Domain management
  isPrimary               Boolean    @default(false)
  isActive                Boolean    @default(true)
  
  // SSL/TLS
  sslCertificate          String?
  sslKey                  String?    @db.Text
  sslVerified             Boolean    @default(false)
  
  // DNS verification (for custom domains)
  dnsVerificationToken    String?    @unique
  dnsVerificationRecord   String?    // belsuite-verify=token
  
  // Redirects
  redirectUrl             String?
  
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @updatedAt
  
  @@index([organizationId])
  @@index([domain])
  @@index([subdomain])
  @@index([isActive])
  @@index([isPrimary])
}

enum DomainType {
  SUBDOMAIN
  CUSTOM
}
```

#### 2. **TenantUsage** - Monthly Usage Tracking
Tracks consumption metrics for billing and quotas.

```prisma
model TenantUsage {
  id                      String     @id @default(cuid())
  organizationId          String
  organization            Organization @relation("TenantUsage", fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Period tracking
  period                  String     // "YYYY-MM"
  startDate               DateTime
  endDate                 DateTime
  
  // Usage metrics
  aiTokensUsed            Int        @default(0)
  aiRequestsCount         Int        @default(0)
  storageUsedBytes        BigInt     @default(0)
  apiCallsCount           Int        @default(0)
  
  // Email metrics
  emailsSent              Int        @default(0)
  emailsDelivered         Int        @default(0)
  emailsBounced           Int        @default(0)
  emailsOpened            Int        @default(0)
  emailsClicked           Int        @default(0)
  
  // Content metrics
  contentCount            Int        @default(0)
  activeUsers             Int        @default(0)
  
  // Billing
  estimatedCost           Float      @default(0)
  
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @updatedAt
  
  @@unique([organizationId, period])
  @@index([organizationId])
  @@index([period])
  @@index([startDate])
}
```

#### 3. **TenantRateLimitQuota** - Rate Limit Configuration
Defines per-tenant quotas for API, email, and AI usage.

```prisma
model TenantRateLimitQuota {
  id                      String     @id @default(cuid())
  organizationId          String     @unique
  organization            Organization @relation("TenantRateLimits", fields: [organizationId], references: [id], onDelete: Cascade)
  
  // API rate limits
  apiRequestsPerMinute    Int        @default(60)
  apiRequestsPerHour      Int        @default(5000)
  apiRequestsPerDay       Int        @default(100000)
  
  // Email rate limits
  emailsPerMinute         Int        @default(10)
  emailsPerHour           Int        @default(500)
  emailsPerDay            Int        @default(5000)
  
  // AI token limits
  aiTokensPerMinute       Int        @default(100000)
  aiTokensPerHour         Int        @default(10000000)
  aiTokensPerDay          Int        @default(100000000)
  
  // Resource limits
  maxStorageGB            Int        @default(10)
  maxConcurrentRequests   Int        @default(10)
  maxConcurrentUploads    Int        @default(5)
  
  // Custom limits (JSON for flexibility)
  customLimits            Json?
  
  // Enforcement
  enforceRateLimits       Boolean    @default(true)
  softLimitNotifyAt       Int        @default(80) // Notify at 80% of limit
  
  // Tier
  effectiveFrom           DateTime   @default(now())
  
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @updatedAt
  
  @@index([organizationId])
  @@index([effectiveFrom])
}
```

#### 4. **TenantRateLimitUsage** - Real-Time Usage Tracking
Tracks current period usage for rate limit enforcement.

```prisma
model TenantRateLimitUsage {
  id                      String     @id @default(cuid())
  organizationId          String
  organization            Organization @relation("TenantRateLimitUsage", fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Period tracking
  period                  RateLimitPeriod     // MINUTE, HOUR, or DAY
  periodStart             DateTime
  periodEnd               DateTime
  
  // Usage tracking
  apiRequestsUsed         Int        @default(0)
  emailsUsed              Int        @default(0)
  aiTokensUsed            Int        @default(0)
  
  // Resource usage
  storageUsedGB           Float      @default(0)
  concurrentRequests      Int        @default(0)
  concurrentUploads       Int        @default(0)
  
  // Enforcement
  limitExceededCount      Int        @default(0)
  lastExceededAt          DateTime?
  
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @updatedAt
  
  @@unique([organizationId, period, periodStart])
  @@index([organizationId])
  @@index([periodStart])
  @@index([period])
}

enum RateLimitPeriod {
  MINUTE
  HOUR
  DAY
}
```

#### 5. **TenantOnboarding** - Onboarding State Machine
Tracks new tenant onboarding progress.

```prisma
model TenantOnboarding {
  id                      String     @id @default(cuid())
  organizationId          String     @unique
  organization            Organization @relation("TenantOnboarding", fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Onboarding step
  step                    OnboardingStep
  completed               Boolean    @default(false)
  completedAt             DateTime?
  
  // Company info
  companyName             String?
  website                 String?
  logo                    String?
  industry                String?
  
  // Domain setup
  subdomainChosen         String?
  customDomainChosen      String?
  
  // Settings
  defaultLanguage         String     @default("en")
  defaultTimezone         String     @default("UTC")
  
  // Team
  teamMembersInvited      Boolean    @default(false)
  invitedMembersCount     Int        @default(0)
  
  // Billing
  billingMethodAdded      Boolean    @default(false)
  paymentMethodId         String?
  
  // Features
  featurePreferences      Json?      // Flexible JSON for feature flags
  
  // Abandonment
  abandonedAt             DateTime?
  
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @updatedAt
  
  @@index([organizationId])
  @@index([step])
  @@index([completed])
}

enum OnboardingStep {
  WELCOME
  COMPANY_INFO
  DOMAIN_SETUP
  TEAM_SETUP
  PAYMENT_SETUP
  FEATURE_SELECTION
  COMPLETED
}
```

#### 6. **ApiRateLimitState** - Real-Time API Rate Limiting
Tracks concurrent requests for real-time rate limiting enforcement.

```prisma
model ApiRateLimitState {
  id                      String     @id @default(cuid())
  organizationId          String
  organization            Organization @relation("ApiRateLimitState", fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Real-time tracking
  requestCount            Int        @default(0)
  requestTimestamp        DateTime
  
  // Violations
  violationCount          Int        @default(0)
  blockedUntil            DateTime?
  
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @updatedAt
  
  @@unique([organizationId, requestTimestamp])
  @@index([organizationId])
  @@index([requestTimestamp])
  @@index([blockedUntil])
}
```

## Architecture Components

### 1. Tenant Middleware (`tenant.middleware.ts`)

**Purpose**: Resolves which tenant the current request belongs to.

**Tenant Resolution Order**:
1. `X-Tenant-Id` header (for API calls from trusted clients)
2. Hostname (subdomain or custom domain)
3. URL path segment

**Features**:
- Subdomain parsing (acme.belsuite.com → acme)
- Custom domain resolution
- Reserved subdomain blocking
- System hostname filtering
- Attaches tenant context to Express Request

**Usage Example**:
```typescript
// In request handler
@Get('profile')
async getProfile(@Request() req: Express.Request) {
  const tenantId = req.tenantId;
  // All queries now filtered by tenant
}
```

### 2. Tenant Service (`tenant.service.ts`)

**Core Operations**:
- `createTenant()` - Create new organization with auto-generated subdomain
- `getTenant()` - Fetch tenant by ID or slug
- `listTenants()` - List all tenants (admin)
- `updateTenant()` - Update tenant settings
- `deleteTenant()` - Soft delete
- `getTenantUsage()` - Get monthly usage metrics
- `getTenantUsageHistory()` - Get 12-month usage history

**Validation**:
- Slug format validation (lowercase, hyphens, 3-63 chars)
- Duplicate slug detection
- Automatic subdomain creation

### 3. Domain Mapping Service (`domain-mapping.service.ts`)

**Domain Management**:
- `addDomain()` - Add subdomain or custom domain
- `getTenantDomains()` - List all domains for tenant
- `setPrimaryDomain()` - Configure primary domain
- `removeDomain()` - Deactivate domain
- `verifyDomainDNS()` - Verify custom domain ownership

**Features**:
- Subdomain reservation system (api, www, mail, etc. reserved)
- Custom domain validation
- DNS verification for custom domains
- SSL certificate storage
- Auto-generated DNS verification tokens

**Reserved Subdomains**:
```
www, mail, admin, api, auth, docs, blog, status, support,
staging, dev, test, ftp, smtp, imap, pop, calendar, files,
drive, download, upload, cdn, static, assets, images, videos,
media, app, dashboard, console, iam, oauth, sso, billing,
payments, invoice, webhook, _dmarc, _acme-challenge
```

### 4. Rate Limiting Service (`rate-limit.service.ts`)

**Multi-Level Rate Limiting**:
- Per-minute limits (bursts)
- Per-hour limits (sustained usage)
- Per-day limits (monthly quota)

**Limit Types**:
- API requests
- Emails sent
- AI tokens
- Storage (aggregate)
- Concurrent requests/uploads

**Features**:
- Soft limits (notify at 80%)
- Hard limits (block requests)
- Per-tenant customizable quotas
- Real-time usage tracking
- Automatic cache cleanup

**Usage Example**:
```typescript
// Check before allowing request
const checkResult = await rateLimitService.checkApiRequestLimit(
  organizationId,
  'minute'
);

if (!checkResult.allowed) {
  // Return 429 with retry-after header
  res.set('Retry-After', checkResult.retryAfter);
  throw new TooManyRequestsException();
}

// Record the request
await rateLimitService.recordApiRequest(organizationId);
```

### 5. Usage Tracking Service (`usage-tracking.service.ts`)

**Usage Recording**:
- `recordAiTokens()` - Track AI token consumption
- `recordAiRequest()` - Track AI API calls
- `recordApiCall()` - Track general API usage
- `recordEmailSent()` - Track email sending
- `recordEmailEvent()` - Track email delivery/bounce/open/click
- `recordStorageUsage()` - Track storage consumption

**Reporting**:
- `getCurrentMonthUsage()` - Get current month metrics
- `getMonthUsage()` - Get metrics for specific month
- `getUsageHistory()` - Get 12-month trend
- `getUsageAlerts()` - Get capacity warnings
- `exportUsageReport()` - Export as CSV or JSON

**Automatic Cost Calculation**:
```
- AI Tokens: $0.0001 per 1000 tokens
- API Calls: $0.001 per 1000 calls
- Storage: $0.10 per GB per month
- Emails: $0.001 per email
```

### 6. Onboarding Service (`tenant-onboarding.service.ts`)

**State Machine**:
```
WELCOME → COMPANY_INFO → DOMAIN_SETUP → TEAM_SETUP → 
PAYMENT_SETUP → FEATURE_SELECTION → COMPLETED
```

**Operations**:
- `getOnboardingStatus()` - Get current progress
- `completeStep()` - Complete current step and move to next
- `skipStep()` - Skip optional steps (Team, Payment, Features)
- `completeOnboarding()` - Mark as fully complete
- `resetOnboarding()` - Start over
- `markAbandoned()` - Track abandonment for analytics

**Analytics**:
- Completion rate
- Abandonment rate
- Average completion time
- Dropoff by step

### 7. Tenant Controller (`tenant.controller.ts`)

**Endpoints**:

#### Tenant Management
- `POST /api/tenants` - Create tenant
- `GET /api/tenants` - List tenants (admin)
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant (admin)

#### Usage & Billing
- `GET /api/tenants/:id/usage` - Current usage + alerts
- `GET /api/tenants/:id/usage/history` - 12-month history

#### Rate Limits
- `GET /api/tenants/:id/rate-limits` - Get quotas
- `PUT /api/tenants/:id/rate-limits` - Update quotas (admin)

#### Domain Management
- `GET /api/tenants/:id/domains` - List domains
- `POST /api/tenants/:id/domains` - Add domain
- `PUT /api/tenants/:id/domains/:domainId/primary` - Set primary
- `DELETE /api/tenants/:id/domains/:domainId` - Remove domain
- `POST /api/tenants/:id/domains/:domainId/verify` - Verify DNS

#### Onboarding
- `GET /api/tenants/:id/onboarding` - Get status
- `POST /api/tenants/:id/onboarding/:step/complete` - Complete step
- `POST /api/tenants/:id/onboarding/:step/skip` - Skip step
- `POST /api/tenants/:id/onboarding/reset` - Reset onboarding
- `GET /api/tenants/analytics/onboarding` - Analytics (admin)

## Multi-Tenant Module

Ties everything together in a NestJS module:

```typescript
@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    TenantService,
    DomainMappingService,
    RateLimitService,
    TenantOnboardingService,
    UsageTrackingService,
  ],
  controllers: [TenantController],
  exports: [/* all services */],
})
export class MultiTenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
```

## Integration with App Module

```typescript
@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AdminModule,
    MultiTenantModule,  // Add here
    // ... other modules
  ],
})
export class AppModule {}
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/belsuite

# Multi-tenancy
BELSUITE_BASE_DOMAIN=belsuite.com
ENABLE_RATE_LIMITING=true
ENABLE_USAGE_TRACKING=true

# DNS verification (for custom domains)
DNS_CHECK_INTERVAL=3600

# Pricing
AI_TOKEN_PRICE=0.0001
API_CALL_PRICE=0.001
STORAGE_PRICE=0.1
EMAIL_PRICE=0.001
```

## Usage Examples

### Create a Tenant

```bash
POST /api/tenants
{
  "name": "ACME Corp",
  "slug": "acme",
  "email": "admin@acme.com",
  "companyName": "ACME Corporation",
  "website": "https://acme.com",
  "industry": "SaaS"
}

Response:
{
  "success": true,
  "tenant": {
    "id": "org_123",
    "slug": "acme",
    "name": "ACME Corp",
    "tier": "starter"
  },
  "onboardingUrl": "/onboard/acme"
}
```

### Add Custom Domain

```bash
POST /api/tenants/org_123/domains
{
  "domainType": "CUSTOM",
  "domain": "app.acme.com"
}

Response:
{
  "success": true,
  "domain": {
    "id": "dom_456",
    "domain": "app.acme.com",
    "domainType": "CUSTOM",
    "dnsVerificationRecord": "belsuite-verify=abc123def456"
  },
  "nextStep": "Verify DNS record: belsuite-verify=abc123def456"
}
```

### Check Rate Limits

```bash
GET /api/tenants/org_123/rate-limits

Response:
{
  "apiRequestsPerMinute": 60,
  "apiRequestsPerHour": 5000,
  "apiRequestsPerDay": 100000,
  "emailsPerMinute": 10,
  "emailsPerDay": 5000,
  "enforceRateLimits": true
}
```

### Get Usage & Alerts

```bash
GET /api/tenants/org_123/usage

Response:
{
  "current": {
    "month": "2024-01",
    "aiTokensUsed": 1000000,
    "emailsSent": 5000,
    "storageUsedBytes": 5368709120,
    "estimatedCost": 2.50
  },
  "alerts": [
    {
      "type": "WARNING",
      "metric": "Storage",
      "current": 5.0,
      "limit": 10,
      "percentageOfLimit": 50,
      "message": "Storage usage at 50% of limit"
    }
  ],
  "summary": {
    "avgMonthlyUsage": {
      "emails": 4500,
      "storageGB": 4
    },
    "monthlyTrend": "12.5%"
  }
}
```

## Security Considerations

### Data Isolation
- All queries include `WHERE organizationId = ?`
- Middleware enforces tenant context on every request
- Foreign key constraints ensure data integrity

### Rate Limiting
- Protects against DDoS and abuse
- Per-tenant quotas prevent one customer affecting others
- Soft limits provide warnings before hard blocks

### Domain Verification
- DNS verification for custom domains
- SSL certificate management
- Prevents domain hijacking

### Encryption
- Sensitive data (API keys) encrypted with AES-256-CBC
- Encryption keys per tenant

## Scaling Considerations

### Database Scaling
- Current: Single PostgreSQL instance scales to millions of tenants
- Future: Horizontal sharding by `organizationId` if needed

### Rate Limiting Scaling
- Use Redis for distributed rate limiting at scale
- Implement sliding window algorithm for accuracy

### Usage Tracking
- Current: Monthly aggregation in Postgres
- Future: Time-series database (InfluxDB, TimescaleDB) for advanced analytics

### Domain Resolution
- DNS cache in memory for fast subdomain resolution
- Cache invalidation on domain changes

## Monitoring & Operations

### Key Metrics
- Tenant count and growth
- API request volume per tenant
- Rate limit violations
- Onboarding completion rate
- Average response times by tenant

### Alarms
- High rate limit violation rate
- Unusual storage usage patterns
- Failed email deliveries
- Onboarding abandonment spikes

### Cleanup Tasks
- Daily: Remove usage records older than 30 days
- Monthly: Generate billing reports
- Quarterly: Archive completed onboarding stages

## Next Steps

1. **Database Migration**: `npx prisma migrate dev --name add_multi_tenant_architecture`
2. **Deploy middleware**: Apply to production after testing
3. **Client integration**: Update frontend to use tenant-aware APIs
4. **Monitoring**: Set up alerts for rate limits and usage
5. **Billing integration**: Connect usage tracking to billing system

## Support & Documentation

- API docs: `/api/docs#/tenants`
- Integration guide: See `INTEGRATION_GUIDE.md`
- Admin panel: `/admin/tenants`
