# AI CEO Module Setup Guide

## Overview

The **AI CEO Module** is an autonomous business intelligence system that uses artificial intelligence to analyze company metrics and generate data-driven recommendations for:

- **Revenue Optimization** - Monitor revenue trends and growth strategies
- **Pricing Adjustment** - Analyze pricing structures and optimize pricing strategies
- **Churn Mitigation** - Identify at-risk customers and retention strategies
- **Feature Recommendation** - Recommend high-impact feature development priorities
- **Growth Strategy** - Recommend customer acquisition and retention tactics

## Architecture

### Components

1. **Decision Engines** (5 specialized AI analyzers)
   - Revenue Optimizer Engine
   - Pricing Optimizer Engine
   - Churn Analyzer Engine
   - Feature Recommender Engine
   - Growth Optimizer Engine

2. **Core Service** (AICEOService)
   - Orchestrates decision engines
   - Collects metrics from modules
   - Generates reports
   - Manages caching and job queues

3. **REST API** (AICEOController)
   - Admin dashboard endpoints
   - Decision generation and tracking
   - Report generation and retrieval

4. **Scheduled Jobs**
   - Daily analysis runs
   - Weekly report generation
   - Impact tracking

## Installation & Setup

### 1. Update Prisma Schema

Add these models to `prisma/schema.prisma`:

```prisma
// Copy from PRISMA_SCHEMA_ADDITIONS.md
model AIceoDecision { ... }
model AICEOReport { ... }
model AICEOConfig { ... }
```

Also add to Organization model:
```prisma
  aiceoEnabled      Boolean          @default(false)
  aiCeoConfig       AICEOConfig?
  aiCeoDecisions    AIceoDecision[]
  aiCeoReports      AICEOReport[]
```

### 2. Run Prisma Migration

```bash
npx prisma migrate dev --name add_ai_ceo_models
```

### 3. Install Dependencies

```bash
# Core dependencies (likely already installed)
npm install @nestjs/schedule @nestjs/bull bull redis ioredis

# Optional: for deeper AI integration
npm install langchain @langchain/openai
```

### 4. Register Module

In `src/backend/app.module.ts`:

```typescript
import { AICEOModule } from './ai-ceo/ai-ceo.module';

@Module({
  imports: [
    // ... existing imports
    AICEOModule,
  ],
})
export class AppModule {}
```

### 5. Configure Environment Variables

Add to `.env`:

```env
# AI CEO Configuration
OPENAI_API_KEY=sk-...
REDIS_HOST=localhost
REDIS_PORT=6379
AI_CEO_ENABLED=true

# Job Queue Configuration
BULL_REDIS_HOST=localhost
BULL_REDIS_PORT=6379

# Admin Dashboard
ADMIN_EMAIL=admin@yourdomain.com
```

### 6. Configure Redis & Bull

For local development:

```bash
# Install Redis (if not already installed)
brew install redis  # macOS
# or apt-get install redis-server  # Linux

# Start Redis
redis-server
```

## Module Integration

### Integrating with Billing Module

The AI CEO module needs to query billing metrics. Implement data adapters:

```typescript
// In AICEOService
private async queryBillingMetrics(organizationId: string) {
  // Query Stripe API or your billing module
  const subscriptions = await this.stripeService.getSubscriptions(organizationId);
  return {
    mrr: subscriptions.reduce((sum, s) => sum + s.amount, 0) / 100,
    arr: subscriptions.reduce((sum, s) => sum + s.amount, 0) / 100 * 12,
    growthRate: this.calculateGrowthRate(),
    // ... more metrics
  };
}
```

### Integrating with Analytics Module

Query feature usage and engagement:

```typescript
// In AICEOService
private async queryFeatureMetrics(organizationId: string) {
  // Query analytics service
  return this.analyticsService.getFeatureUsage(organizationId, {
    period: '30d',
  });
}
```

### Integrating with Organizations Module

Access customer segment data:

```typescript
// In AICEOService
private async queryGrowthMetrics(organizationId: string) {
  const orgs = await this.prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscriptions: true, users: true },
  });
  
  return {
    activeCustomers: orgs.subscriptions.length,
    paybackPeriod: this.calculatePayback(),
    // ... more metrics
  };
}
```

## API Endpoints

All endpoints require admin authentication (`JwtAuthGuard` + `AdminGuard`).

### Generate Decision

```
POST /api/admin/ai-ceo/decisions
Content-Type: application/json
Authorization: Bearer {token}

{
  "decisionType": "REVENUE_OPTIMIZATION",
  "organizationId": "org_123",
  "contextData": "Optional context"
}

Response:
{
  "id": "dec_123",
  "type": "REVENUE_OPTIMIZATION",
  "severity": "high",
  "title": "Revenue Growth Below Target",
  "description": "Current growth rate is 3.2% ...",
  "recommendation": "...",
  "estimatedImpact": {
    "metric": "MRR",
    "currentValue": 50000,
    "projectedValue": 53500,
    "percentChange": 7
  },
  "implementationSteps": [
    "Step 1...",
    "Step 2..."
  ],
  "confidence": 0.85,
  "aiModel": "gpt-4-turbo",
  "generatedAt": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-01-22T10:00:00Z"
}
```

### Generate Report

```
POST /api/admin/ai-ceo/reports
Content-Type: application/json
Authorization: Bearer {token}

{
  "frequency": "weekly",
  "organizationId": "org_123",
  "startDate": "2024-01-01",
  "endDate": "2024-01-15"
}

Response:
{
  "id": "report_123",
  "organizationId": "org_123",
  "frequency": "weekly",
  "period": {
    "start": "2024-01-08T00:00:00Z",
    "end": "2024-01-15T23:59:59Z"
  },
  "metrics": { ... },
  "decisions": [ ... ],
  "summary": {
    "keyHighlights": ["..."],
    "mainChallenges": ["..."],
    "opportunities": ["..."],
    "recommendations": ["..."]
  },
  "generatedAt": "2024-01-15T10:00:00Z",
  "nextReportDate": "2024-01-22T00:00:00Z"
}
```

### Get Dashboard Overview

```
GET /api/admin/ai-ceo/dashboard/{organizationId}
Authorization: Bearer {token}

Response:
{
  "currentMetrics": { ... },
  "activeDecisions": [ ... ],
  "recentReports": [ ... ],
  "healthCheck": {
    "status": "healthy",
    "aiModelStatus": "operational",
    "dataSourceStatus": "connected",
    "lastAnalysisTime": "2024-01-15T09:30:00Z",
    "nextScheduledAnalysis": "2024-01-16T00:00:00Z",
    "errorCount": 0,
    "successRate": 98
  },
  "trendAnalysis": { ... }
}
```

### Apply Decision

```
POST /api/admin/ai-ceo/decisions/{decisionId}/apply
Content-Type: application/json
Authorization: Bearer {token}

{
  "organizationId": "org_123"
}

Response: 204 No Content
```

### Get Decision History

```
GET /api/admin/ai-ceo/decisions/history/{organizationId}
Authorization: Bearer {token}

Response:
[
  {
    "id": "dec_123",
    "type": "REVENUE_OPTIMIZATION",
    "severity": "high",
    "title": "Revenue Growth Below Target",
    "implemented": true,
    "implementedAt": "2024-01-15T11:00:00Z",
    "actualImpact": {
      "metric": "MRR",
      "projectedValue": 53500,
      "actualValue": 54200,
      "percentChange": 8.4
    },
    "generatedAt": "2024-01-08T10:00:00Z"
  }
]
```

### Health Check

```
GET /api/admin/ai-ceo/health
Authorization: Bearer {token}

Response:
{
  "status": "healthy",
  "message": "AI CEO system operational"
}
```

## Frontend Integration

### Integrate with Admin Dashboard

Create React components:

```typescript
// src/components/admin/AIceoController.tsx
import { DashboardOverviewDto } from '@/types/ai-ceo';
import { useEffect, useState } from 'react';

export function AIceoController({ organizationId }) {
  const [dashboard, setDashboard] = useState<DashboardOverviewDto>(null);

  useEffect(() => {
    // Fetch dashboard
    fetch(`/api/admin/ai-ceo/dashboard/${organizationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setDashboard);
  }, [organizationId]);

  return (
    <div>
      {/* Display metrics, decisions, reports */}
    </div>
  );
}
```

## Scheduled Jobs

### Daily Analysis

Runs at **midnight UTC** every day:

```
- Generates all 5 types of decisions for each organization
- Queues jobs via BullMQ for processing
- Caches results in Redis
```

### Weekly Reports

Runs at **midnight UTC every Monday**:

```
- Generates comprehensive weekly reports
- Aggregates all decisions
- Uses OpenAI to generate AI-powered summaries
```

## Customization

### Configure Analysis Frequency

Update in `AICEOConfig`:

```typescript
const config = await prisma.aiCEOConfig.update({
  where: { organizationId },
  data: {
    analysisFrequency: 'daily', // or 'weekly', 'monthly'
    riskTolerance: 'aggressive', // or 'conservative', 'balanced'
    maxChurnRate: 3, // Custom churn threshold
  },
});
```

### Adjust Decision Thresholds

Edit engine severity logic in decision engine files:

```typescript
// In revenue-optimizer.engine.ts
if (growthRate < 5) {
  severity = 'high'; // Adjust threshold from 5% to custom value
  confidence = 0.85;
  // ...
}
```

### Add Custom Decision Engine

1. Create new engine (e.g., `market-analyzer.engine.ts`)
2. Implement `DecisionEngine` interface
3. Register in `AICEOModule`
4. Add decision type to `DecisionType` enum

## Caching Strategy

The system uses Redis for intelligent caching:

- **Decisions**: 7-day TTL
- **Metrics**: 24-hour TTL
- **Reports**: 7-day TTL

Cache invalidation happens when:
- New data is collected from integration modules
- Manual cache flush via admin dashboard (future)
- TTL expires

## Error Handling & Monitoring

### Logging

All operations are logged to `logs/ai-ceo.log`:

```
[NestJS] 2024-01-15 10:00:00 [AICEOService] Generating REVENUE_OPTIMIZATION decision
[NestJS] 2024-01-15 10:00:01 [RevenueOptimizerEngine] Analysis complete - confidence: 0.85
```

### Error Recovery

- Failed decisions: logged and not persisted
- Failed reports: queued for retry (3 attempts with exponential backoff)
- Service crashes: automatic restart via process manager

## Performance Considerations

- **Concurrent Decisions**: Up to 5 decisions run in parallel
- **Report Generation**: ~5-10 seconds per organization
- **OpenAI API Calls**: Batched and cached to reduce costs

## Security

- All endpoints require admin authentication
- API keys stored in environment variables
- Data access scoped to organization
- Audit logging for all decisions applied

## Troubleshooting

### Decisions Not Generating

1. Check OpenAI API key is valid
2. Verify Redis connection: `redis-cli ping`
3. Check job queue: `curl http://localhost:3000/api/admin/ai-ceo/health`

### Poor Recommendation Quality

1. Verify data integrations are returning correct metrics
2. Adjust `confidence` threshold in decision validation
3. Review decision engine thresholds

### Performance Issues

1. Reduce analysis frequency
2. Increase Redis memory allocation
3. Scale Bull job queue workers

## Next Steps

1. ✅ **Implemented** - Core decision engines
2. ✅ **Implemented** - Report generation
3. ✅ **Implemented** - REST API
4. 📋 **TODO** - Admin dashboard UI
5. 📋 **TODO** - Webhook notifications for critical decisions
6. 📋 **TODO** - A/B testing framework for decision validation
7. 📋 **TODO** - Machine learning model fine-tuning

## Support

For issues or questions:
- Check logs in `logs/ai-ceo.log`
- Review decision engine implementation
- Test OpenAI API connectivity: `curl https://api.openai.com/v1/models`

---

**Last Updated**: January 15, 2024
**Version**: 1.0.0-beta
