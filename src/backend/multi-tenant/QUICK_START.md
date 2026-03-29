# Multi-Tenant Integration Guide

## Installation Steps

### 1. Database Migration

Run Prisma migration to create all multi-tenant tables:

```bash
npx prisma migrate dev --name add_multi_tenant_architecture
```

This creates:
- `DomainMapping` - Domain routing table
- `TenantUsage` - Usage tracking table
- `TenantRateLimitQuota` - Rate limit configuration
- `TenantRateLimitUsage` - Real-time usage tracking
- `TenantOnboarding` - Onboarding state
- `ApiRateLimitState` - API rate limit state

### 2. Add to App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MultiTenantModule } from './backend/multi-tenant';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // ... existing modules
    MultiTenantModule,  // Add this
  ],
})
export class AppModule {}
```

### 3. Environment Configuration

Add to `.env`:

```env
# Multi-tenancy
BELSUITE_BASE_DOMAIN=belsuite.com
ENABLE_RATE_LIMITING=true
ENABLE_USAGE_TRACKING=true

# Pricing (per unit per month)
AI_TOKEN_PRICE=0.0001
API_CALL_PRICE=0.001
STORAGE_PRICE=0.10
EMAIL_PRICE=0.001
```

### 4. Prisma Schema Update

Ensure your schema.prisma includes:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  // ... existing fields
  
  // Multi-tenant relationships
  tenantDomains           DomainMapping[]       @relation("TenantDomains")
  tenantUsage             TenantUsage[]         @relation("TenantUsage")
  tenantRateLimits        TenantRateLimitQuota? @relation("TenantRateLimits")
  tenantRateLimitUsage    TenantRateLimitUsage[] @relation("TenantRateLimitUsage")
  tenantOnboarding        TenantOnboarding?     @relation("TenantOnboarding")
  apiRateLimitState       ApiRateLimitState[]   @relation("ApiRateLimitState")
}

// Include all multi-tenant models (DomainMapping, TenantUsage, etc.)
```

### 5. Check Middleware Is Applied

The middleware is automatically applied to all routes via the module configuration.

Verify in logs:
```
[TenantMiddleware] Tenant resolved from hostname: acme.belsuite.com → org_123
```

## API Endpoints

### Create Tenant

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ACME Corp",
    "slug": "acme",
    "email": "admin@acme.com",
    "companyName": "ACME Corporation",
    "website": "https://acme.com",
    "industry": "SaaS"
  }'
```

### Get Tenant Details

```bash
curl http://localhost:3000/api/tenants/org_123
```

### Request from Tenant

The tenant is automatically resolved from:

**Option 1: Subdomain**
```bash
curl http://acme.belsuite.com/api/profile
# Request.tenantId = org_123
```

**Option 2: Custom Domain**
```bash
curl http://app.acme.com/api/profile
# Request.tenantId = org_123
```

**Option 3: Header (API)**
```bash
curl -H "X-Tenant-Id: org_123" http://localhost:3000/api/profile
```

### Access Tenant in Controllers

```typescript
import { Controller, Get, Request } from '@nestjs/common';

@Controller('profile')
export class ProfileController {
  @Get()
  async getProfile(@Request() req: Express.Request) {
    const tenantId = req.tenantId;  // Automatically injected
    const tenant = req.tenant;      // Full tenant info
    
    // Use tenantId in queries
    const profile = await this.db.profile.findFirst({
      where: {
        userId: req.user.id,
        organizationId: tenantId,  // Automatic tenant isolation
      },
    });
    
    return profile;
  }
}
```

## Rate Limiting Integration

### Add Rate Limit Guards to Endpoints

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RateLimitService } from '@belsuite/multi-tenant';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.tenantId;

    if (!tenantId) {
      return true; // Skip if not a tenant request
    }

    // Check rate limit
    const check = await this.rateLimitService.checkApiRequestLimit(tenantId, 'minute');
    
    if (!check.allowed) {
      // Record violation
      throw new TooManyRequestsException('Rate limit exceeded');
    }

    return true;
  }
}

// Use in controllers
@Controller('api')
@UseGuards(RateLimitGuard)
export class ApiController {
  @Get('data')
  async getData() {
    // Protected with rate limiting
  }
}
```

### Record Usage Automatically

```typescript
import { UsageTrackingService } from '@belsuite/multi-tenant';

@Injectable()
export class ApiService {
  constructor(private usageTracking: UsageTrackingService) {}

  async processRequest(tenantId: string, request: any) {
    // Record API call
    await this.usageTracking.recordApiCall(tenantId);
    
    // Process request...
    
    return result;
  }

  async useAiTokens(tenantId: string, tokens: number) {
    // Record AI token usage
    await this.usageTracking.recordAiTokens(tenantId, tokens);
  }
}
```

## Usage Tracking Integration

### Track Events

```typescript
import { UsageTrackingService } from '@belsuite/multi-tenant';

@Injectable()
export class EmailService {
  constructor(private usageTracking: UsageTrackingService) {}

  async sendEmail(tenantId: string, to: string, subject: string) {
    // Send email...
    
    // Record sent
    await this.usageTracking.recordEmailSent(tenantId);
    
    return result;
  }

  async handleEmailEvent(
    tenantId: string,
    event: 'DELIVERED' | 'BOUNCED' | 'OPENED' | 'CLICKED'
  ) {
    await this.usageTracking.recordEmailEvent(tenantId, event);
  }
}
```

### Get Usage for Dashboard

```typescript
@Controller('dashboard')
export class DashboardController {
  constructor(private usageTracking: UsageTrackingService) {}

  @Get('usage')
  async getUsageMetrics(@Request() req) {
    const tenantId = req.tenantId;
    
    const usage = await this.usageTracking.getCurrentMonthUsage(tenantId);
    const alerts = await this.usageTracking.getUsageAlerts(tenantId);
    const history = await this.usageTracking.getUsageHistory(tenantId, 12);

    return {
      current: usage,
      alerts,
      trend: history,
    };
  }
}
```

## Onboarding Integration

### Render Onboarding Flow

```typescript
@Controller('onboard')
export class OnboardingController {
  constructor(private onboardingService: TenantOnboardingService) {}

  @Get(':slug')
  async getOnboardingPage(@Param('slug') slug: string) {
    const tenant = await this.tenantService.getTenantBySlug(slug);
    const status = await this.onboardingService.getOnboardingStatus(tenant.id);
    const stepInfo = this.onboardingService.getStepInfo(status.step);

    return {
      tenant,
      status,
      step: stepInfo,
    };
  }

  @Post(':slug/complete-step')
  async completeStep(
    @Param('slug') slug: string,
    @Body() data: OnboardingStepData
  ) {
    const tenant = await this.tenantService.getTenantBySlug(slug);
    const status = await this.onboardingService.getOnboardingStatus(tenant.id);

    return await this.onboardingService.completeStep(
      tenant.id,
      status.step,
      data
    );
  }
}
```

## Domain Management

### Add Custom Domain

```typescript
@Controller('settings/domains')
export class DomainController {
  constructor(private domainService: DomainMappingService) {}

  @Post()
  async addDomain(@Request() req, @Body() dto: AddDomainDto) {
    const tenantId = req.tenantId;

    const domain = await this.domainService.addDomain(tenantId, dto);

    // If custom domain, return DNS verification record
    if (domain.dnsVerificationRecord) {
      return {
        success: true,
        domain,
        instructions: `Add this DNS record to your domain:
          CNAME: ${domain.dnsVerificationRecord}
          
          Then verify by calling /domains/${domain.id}/verify
        `,
      };
    }

    return { success: true, domain };
  }

  @Get()
  async getDomains(@Request() req) {
    return await this.domainService.getTenantDomains(req.tenantId);
  }
}
```

## Billing Integration

### Generate Monthly Bill

```typescript
// After month ends
async function generateBill(organizationId: string) {
  const usage = await usageTracking.getMonthUsage(organizationId, '2024-01');

  const bill = {
    month: '2024-01',
    items: [
      {
        description: `AI Tokens: ${usage.aiTokensUsed}`,
        cost: (usage.aiTokensUsed / 1000) * 0.0001,
      },
      {
        description: `API Calls: ${usage.apiCallsCount}`,
        cost: (usage.apiCallsCount / 1000) * 0.001,
      },
      {
        description: `Storage: ${(usage.storageUsedBytes / 1024 / 1024 / 1024).toFixed(2)}GB`,
        cost: (usage.storageUsedBytes / 1024 / 1024 / 1024) * 0.10,
      },
      {
        description: `Emails: ${usage.emailsSent}`,
        cost: usage.emailsSent * 0.001,
      },
    ],
    total: usage.estimatedCost,
  };

  return bill;
}
```

## Testing

### Test Middleware

```typescript
import { Test } from '@nestjs/testing';
import { TenantMiddleware } from '@belsuite/multi-tenant';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;

  beforeEach(() => {
    middleware = new TenantMiddleware(prismaService);
  });

  it('should resolve tenant from subdomain', async () => {
    const req = {
      hostname: 'acme.belsuite.com',
      headers: {},
      path: '/',
    } as any;

    const res = {} as any;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.tenantId).toBe('org_123');
    expect(next).toHaveBeenCalled();
  });
});
```

### Test Rate Limiting

```typescript
describe('RateLimitService', () => {
  let service: RateLimitService;

  it('should enforce rate limits', async () => {
    // Check 100 requests in a minute
    for (let i = 0; i < 100; i++) {
      const check = await service.checkApiRequestLimit(tenantId, 'minute');
      expect(check.allowed).toBe(i < 60); // Limit is 60/min
    }
  });
});
```

## Deployment

### 1. Pre-deployment

```bash
# Verify schema
npx prisma validate

# Run migrations in staging
npx prisma migrate deploy --skip-generate
```

### 2. Deploy Services

- Deploy middleware first (affects all requests)
- Deploy controllers/services
- Update frontend to use new endpoints

### 3. Monitor

```bash
# Check rate limit violations
SELECT COUNT(*) FROM TenantRateLimitUsage 
WHERE limitExceededCount > 0;

# Check usage patterns
SELECT organizationId, SUM(estimatedCost) 
FROM TenantUsage 
GROUP BY organizationId 
ORDER BY SUM(estimatedCost) DESC;

# Onboarding funnel
SELECT step, COUNT(*) 
FROM TenantOnboarding 
GROUP BY step;
```

### 4. Rollback

If needed:
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

## Troubleshooting

### Tenant Not Resolved

1. Check hostname resolution
   ```bash
   nslookup acme.belsuite.com
   ```

2. Verify subdomain in database
   ```sql
   SELECT * FROM DomainMapping WHERE subdomain = 'acme';
   ```

3. Check logs for middleware errors
   ```bash
   grep "TenantMiddleware" logs/*
   ```

### Rate Limit Not Working

1. Verify enforcement is enabled
   ```sql
   SELECT enforceRateLimits FROM TenantRateLimitQuota WHERE organizationId = 'org_123';
   ```

2. Check usage records
   ```sql
   SELECT * FROM TenantRateLimitUsage WHERE organizationId = 'org_123';
   ```

### High Memory Usage

- Check cleanup jobs are running
- Look for leaked database connections
- Monitor usage record accumulation

## Performance Optimization

### Database Indexes (Already In Place)
- `DomainMapping`: organizationId, domain, subdomain, isActive
- `TenantUsage`: organizationId, period, startDate
- `TenantRateLimitUsage`: organizationId, periodStart, period

### Caching Opportunities
- Cache domain resolution (5 min TTL)
- Cache rate limit quotas (1 hour TTL)
- Cache organization lookups (5 min TTL)

### Query Optimization
- Use selective field projection
- Batch operations when possible
- Consider connection pooling

## Next Steps

1. Run database migration
2. Add module to app
3. Update controllers with tenant context
4. Implement guards for rate limiting
5. Add monitoring and alerts
6. Deploy to production

For full architecture details, see [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md)
