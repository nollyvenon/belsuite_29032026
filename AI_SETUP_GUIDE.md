# BelSuite AI Setup Guide

Complete guide to configuring and deploying the AI abstraction layer with multi-provider support, smart routing, and usage limits.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Provider Configuration](#provider-configuration)
4. [Environment Setup](#environment-setup)
5. [Database Setup](#database-setup)
6. [API Integration](#api-integration)
7. [Frontend Integration](#frontend-integration)
8. [Testing](#testing)
9. [Monitoring & Usage](#monitoring--usage)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The BelSuite AI layer provides:

- **Multi-Provider Support**: OpenAI, Claude, Local models (Ollama), extensible for Gemini
- **Smart Routing**: 5 routing strategies (cheapest, fastest, best_quality, balanced, custom)
- **Token Tracking**: Real-time token usage and cost calculation
- **Intelligent Caching**: 24-hour TTL with SHA-256 hashing
- **Usage Limits**: Per-subscription-tier rate limiting and monthly quotas
- **Content Generation**: 7 specialized generators (blog, social, ad, email, product, video, headlines)
- **Image Generation**: DALL-E 3 integration with customizable sizes
- **Analytics Dashboard**: Real-time usage metrics and cost breakdown

---

## Prerequisites

### Required Services

- **Node.js 18+** - Runtime environment
- **PostgreSQL 12+** - Database for usage tracking
- **Redis (optional)** - For distributed caching in production

### API Keys Needed

- OpenAI API key (for GPT models and DALL-E)
- Anthropic API key (for Claude models)
- Ollama (optional, local models)
- Gemini API key (optional, future)

### Environment Variables

See `.env.example` for complete list. Minimum required:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/belcoms"

# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
OLLAMA_BASE_URL="http://localhost:11434"

# JWT
JWT_SECRET="your-secret-key"
```

---

## Provider Configuration

### 1. OpenAI Setup

#### Get API Key

1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign in or create account
3. Go to **API keys** → **Create new secret key**
4. Copy the key immediately (you won't see it again)

#### Add to Environment

```bash
OPENAI_API_KEY="sk-your-key-here"
```

#### Available Models

- **GPT-4 Turbo** (recommended for quality)
  - Input: $0.01 per 1K tokens
  - Output: $0.03 per 1K tokens
- **GPT-4** (quality, more expensive)
  - Input: $0.03 per 1K tokens
  - Output: $0.06 per 1K tokens
- **GPT-3.5 Turbo** (cheapest, fast)
  - Input: $0.0015 per 1K tokens
  - Output: $0.002 per 1K tokens

#### Features

- ✅ Text generation (chat completions)
- ✅ Image generation (DALL-E 3)
- ✅ Code generation and more

---

### 2. Anthropic (Claude) Setup

#### Get API Key

1. Visit [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Go to **Keys** → **Create Key**
4. Copy and store securely

#### Add to Environment

```bash
ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

#### Available Models

- **Claude 3 Opus** (best quality)
  - Input: $0.015 per 1K tokens
  - Output: $0.075 per 1K tokens
- **Claude 3 Sonnet** (balanced)
  - Input: $0.003 per 1K tokens
  - Output: $0.015 per 1K tokens
- **Claude 3 Haiku** (fastest, cheapest Claude)
  - Input: $0.00025 per 1K tokens
  - Output: $0.00125 per 1K tokens

#### Features

- ✅ Text generation
- ✅ Code generation
- ✅ Analysis and summarization

---

### 3. Ollama (Local Models) Setup

#### Installation

**macOS**
```bash
brew install ollama
```

**Linux**
```bash
curl https://ollama.ai/install.sh | sh
```

**Windows**
Download from [ollama.ai](https://ollama.ai)

#### Start Ollama Server

```bash
ollama serve
# Server runs on http://localhost:11434
```

#### Pull Models

```bash
# Llama 2 (7B model, ~4GB)
ollama pull llama2

# Mistral (7B model, ~4GB)
ollama pull mistral

# Other options
ollama pull neural-chat
ollama pull dolphin-mixtral
```

#### Configure in BelSuite

```bash
OLLAMA_BASE_URL="http://localhost:11434"
```

#### Features

- ✅ **Free** - No API costs
- ✅ Private - Data stays on device
- ✅ Fast - Runs locally
- ⚠️ Quality varies by model
- ⚠️ Requires local VRAM

---

## Environment Setup

### 1. Copy Example File

```bash
cp .env.example .env
```

### 2. Fill in Required Values

```bash
# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL="postgresql://postgres:password@localhost:5432/belcoms?schema=public"

# ============================================================================
# APPLICATION
# ============================================================================
APP_URL="http://localhost:3000"
NODE_ENV="development"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# ============================================================================
# AI PROVIDERS - Fill in your API keys
# ============================================================================

# OpenAI (for GPT-4, GPT-3.5, DALL-E)
OPENAI_API_KEY="sk-your-openai-key"

# Anthropic (for Claude models)
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"

# Ollama (local models - runs on localhost)
OLLAMA_BASE_URL="http://localhost:11434"

# ============================================================================
# AI RATE LIMITING BY TIER
# ============================================================================
AI_REQUESTS_PER_MINUTE_FREE=10
AI_REQUESTS_PER_MINUTE_STARTER=50
AI_REQUESTS_PER_MINUTE_PROFESSIONAL=200
AI_REQUESTS_PER_MINUTE_ENTERPRISE=1000

AI_TOKENS_PER_MONTH_FREE=100000
AI_TOKENS_PER_MONTH_STARTER=1000000
AI_TOKENS_PER_MONTH_PROFESSIONAL=10000000
AI_TOKENS_PER_MONTH_ENTERPRISE=100000000
```

### 3. Validate Configuration

```bash
# Check that database is accessible
npm run prisma:validate

# Test API key connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## Database Setup

### 1. Run Migrations

```bash
# Apply all pending migrations
npm run prisma:migrate

# Or with specific name
npx prisma migrate deploy
```

This creates:
- `AIUsage` table - tracks all AI requests
- `PromptTemplate` table - stores custom and built-in prompts
- Related indexes for performance

### 2. Seed Built-in Prompt Templates

```bash
# Run seed script
npx ts-node prisma/seeds/seed-prompt-templates.ts

# Or with npm script (if configured in package.json)
npm run db:seed:prompts
```

This creates 7 built-in templates:
1. Blog Post
2. Social Media
3. Ad Copy
4. Video Script
5. Email Campaign
6. Product Description
7. Headlines/Titles

### 3. Verify Setup

```bash
# Open Prisma Studio
npx prisma studio

# Check that PromptTemplate table has 7 records
# Check that AIUsage table is empty (ready for data)
```

---

## API Integration

### Backend Setup

#### 1. Register AIModule

Update `src/backend/app.module.ts`:

```typescript
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    // ... other modules
    AIModule,  // ✅ Already configured
  ],
})
export class AppModule {}
```

#### 2. Verify Endpoints

All endpoints are under `/api/ai/` and require JWT authentication:

**Text Generation**
- `POST /api/ai/text` - Custom prompt
- `POST /api/ai/blog-post` - Blog posts
- `POST /api/ai/social-post` - Social media
- `POST /api/ai/ad-copy` - Advertisements
- `POST /api/ai/video-script` - Video scripts
- `POST /api/ai/product-description` - Product descriptions
- `POST /api/ai/email-campaign` - Email campaigns
- `POST /api/ai/headlines` - Multiple headlines

**Image Generation**
- `POST /api/ai/image` - DALL-E image generation

**Templates**
- `GET /api/ai/templates` - List all templates
- `GET /api/ai/templates/category` - Filter by category

**Usage & Analytics**
- `GET /api/ai/usage/stats` - Usage statistics
- `GET /api/ai/usage/check` - Check current limits
- `GET /api/ai/cache/stats` - Cache performance

#### 3. Test with cURL

```bash
# Get JWT token first (from login or test)
TOKEN="your-jwt-token"

# Test text generation
curl -X POST http://localhost:3000/api/ai/text \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short poem about AI",
    "maxTokens": 200
  }'

# Check usage
curl -X GET http://localhost:3000/api/ai/usage/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## Frontend Integration

### 1. AI Hub Page

**Route**: `/ai`

Shows overview of AI features, pricing tiers, and CTA buttons.

```bash
src/app/ai/page.tsx
```

### 2. Content Generator Page

**Route**: `/ai/generate`

Interactive generator allowing users to select content type and generate.

```bash
src/app/ai/generate/page.tsx
```

Uses `AIContentGenerator.tsx` component.

### 3. Analytics Dashboard

**Route**: `/ai/dashboard`

Real-time usage metrics, cost tracking, and provider status.

```bash
src/app/ai/dashboard/page.tsx
```

Uses `AIDashboard.tsx` component.

### 4. Add Navigation Links

Update your navigation to include links:

```tsx
<Link href="/ai">AI Generation</Link>
<Link href="/ai/generate">Generate Content</Link>
<Link href="/ai/dashboard">Analytics</Link>
```

---

## Testing

### 1. Unit Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### 2. Integration Tests

```bash
# Test API endpoints
npm run test:api

# Test with different providers
npm run test:providers
```

### 3. Manual Testing Checklist

- [ ] Generate blog post (test cheapest routing)
- [ ] Generate social post (test fastest routing)
- [ ] Generate image (test OpenAI)
- [ ] Test usage limits (hit limit for tier)
- [ ] Verify cache hit (same prompt twice)
- [ ] Check dashboard stats
- [ ] Test with different models
- [ ] Verify cost calculations

### 4. Load Testing

```bash
# Simulate concurrent requests
npm run load-test

# Or with custom settings
npm run load-test -- --users=100 --ramp=10
```

---

## Monitoring & Usage

### View Usage Dashboard

1. Navigate to `/ai/dashboard`
2. Select time range (24h, 7d, 30d)
3. View metrics:
   - Total requests
   - Total cost
   - Total tokens
   - Cache hit rate
   - Usage by model
   - Usage by provider

### Check Usage Limits

```bash
# API endpoint
curl -X GET http://localhost:3000/api/ai/usage/check \
  -H "Authorization: Bearer $TOKEN"

# Response shows current usage vs limits
{
  "allowed": true,
  "currentUsage": {
    "requestsThisMinute": 5,
    "tokensThisMonth": 50000
  },
  "limits": {
    "requestsPerMinute": 50,
    "tokensPerMonth": 1000000,
    "tier": "STARTER"
  },
  "remaining": {
    "requestsThisMinute": 45,
    "tokensThisMonth": 950000
  }
}
```

### Cost Analysis

Each request returns cost breakdown:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "...",
    "provider": "openai",
    "model": "gpt-4-turbo",
    "tokens": {
      "prompt": 50,
      "completion": 150,
      "total": 200
    },
    "cost": 0.0065,
    "cached": false
  }
}
```

### Monthly Cost Estimation

Based on tier and usage patterns:

| Tier | Requests/Month | Tokens/Month | Avg Cost/Token | Est. Monthly Cost |
|------|---|---|---|---|
| Free | 43,200 | 100K | $0.0006 | ~$60 |
| Starter | 216,000 | 1M | $0.0006 | ~$600 |
| Professional | 864,000 | 10M | $0.0004 | ~$4,000 |
| Enterprise | 4,320,000 | 100M | $0.0003 | ~$30,000 |

---

## Troubleshooting

### Issue: "No provider available for model"

**Cause**: Provider credentials not configured

**Solution**:
```bash
# Check environment variables
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# Test provider connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: "Monthly token limit exceeded"

**Cause**: User has reached their tier's monthly quota

**Solution**:
- Upgrade subscription tier
- Wait until next month (quota resets)
- Use cheaper model (GPT-3.5 instead of GPT-4)

### Issue: "Request limit exceeded"

**Cause**: User making too many requests per minute

**Solution**:
- Implement request queuing on frontend
- Use `useCache` to reduce duplicate requests
- Upgrade to higher tier

### Issue: Ollama not connecting

**Cause**: Ollama server not running

**Solution**:
```bash
# Start Ollama
ollama serve

# Or run in background
ollama serve &

# Test connection
curl http://localhost:11434/api/tags
```

### Issue: High costs

**Cause**: Using expensive models unnecessarily

**Solution**:
- Use `cheapest` routing strategy
- Enable caching
- Use Claude Haiku or GPT-3.5 for simple tasks
- Use local Ollama for free models

### Issue: Cache not working

**Cause**: Different requests or cache TTL expired

**Solution**:
- Cache is 24 hours TTL
- Identical prompts with same model return cached
- Clear cache: `POST /api/ai/cache/clear`

---

## Production Deployment

### 1. Environment Variables

Set all variables in production:
```bash
# Never commit .env to git
git add .env.example  # Only this
git ignore .env       # Not this
```

### 2. Database

Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.):
```bash
DATABASE_URL="postgresql://user:password@aws.rds.amazonaws.com:5432/belcoms"
```

### 3. Caching

For distributed systems, use Redis:
```bash
REDIS_URL="redis://redis-server:6379"
```

### 4. API Keys

Use secrets manager:
- AWS Secrets Manager
- HashiCorp Vault
- GitHub Secrets
- Environment-specific `.env` files

### 5. Monitoring

Set up logging:
```bash
# Sentry for error tracking
SENTRY_DSN="https://..."

# Log level
LOG_LEVEL="info"
```

### 6. Rate Limiting

Verify limits are appropriate:
```bash
AI_REQUESTS_PER_MINUTE_FREE=10
AI_REQUESTS_PER_MINUTE_STARTER=50
AI_REQUESTS_PER_MINUTE_PROFESSIONAL=200
AI_REQUESTS_PER_MINUTE_ENTERPRISE=1000
```

---

## FAQ

**Q: Can I use multiple providers simultaneously?**
A: Yes! Smart routing automatically selects the best provider based on your strategy.

**Q: How long are results cached?**
A: 24 hours by default. Configure with `CACHE_TTL` in env.

**Q: Can I add custom models?**
A: Yes! Extend `BaseAIProvider` and add to the provider list.

**Q: How much does it cost?**
A: Depends on model and usage. GPT-3.5 is ~$0.0015 per 1K input tokens.

**Q: Can I run models locally?**
A: Yes! Use Ollama for free, private model execution.

**Q: How do I track spending?**
A: View `/ai/dashboard` for real-time cost breakdown.

---

## Support & Resources

- **Documentation**: See `AI_API_DOCS.md`
- **Examples**: Check `src/components/AIContentGenerator.tsx`
- **Issues**: Open GitHub issue with error logs
- **Updates**: Subscribe to changelog

---

## Changelog

### Version 1.0.0 (March 2026)

- ✅ Multi-provider support (OpenAI, Claude, Ollama)
- ✅ Smart routing with 5 strategies
- ✅ Token tracking and cost calculation
- ✅ Intelligent caching system
- ✅ Usage limits by subscription tier
- ✅ 7 content type generators
- ✅ Image generation (DALL-E)
- ✅ Real-time analytics dashboard
- ✅ Prompt template system
