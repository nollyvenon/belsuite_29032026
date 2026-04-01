# BelSuite Growth OS - Production Architecture

This document defines the deployable architecture for BelSuite as a growth automation platform designed to replace CRM, SEO operations, email automation, and call-center tooling.

## 1) System Architecture

### Runtime topology

- Frontend: Next.js App Router in `src/app/*`
- Backend API: NestJS monolith in `src/backend/*`
- Database: PostgreSQL accessed through Prisma (`prisma/schema.prisma`)
- Queue: BullMQ with Redis connection configured in `src/backend/app.module.ts`
- AI layer: Unified AI services in `src/backend/ai/*`
- Delivery providers:
  - Email: SendGrid/Mailgun/SES/Postmark via `src/backend/email/*`
  - SMS/Voice/WhatsApp: Twilio callbacks + dispatch in `src/backend/marketing-automation/*`

### Module map

- Module 1: Lead Generation Engine
  - API: `src/backend/lead-engine/*`
  - Frontend: `src/app/lead-engine/page.tsx`
- Module 2: SEO Engine
  - API: `src/backend/seo-engine/*`
  - Frontend: existing marketing/SEO surfaces under `src/app/marketing/*`
- Module 3: CRM Conversion Engine
  - API: `src/backend/crm-engine/*`
  - Frontend: `src/app/crm-engine/page.tsx`
- Module 4: Omni-Channel Marketing Automation
  - API: `src/backend/marketing-automation/*`
  - Frontend: `src/app/marketing-automation/page.tsx`

## 2) Database Schema Strategy

BelSuite currently uses production-safe schema reuse to ship fast without migration bottlenecks:

- Lead, CRM, and automation runtime telemetry: `AnalyticsEvent` model
- Workflow definitions and actions: `Workflow` and `WorkflowAction` models
- Email delivery and tracking: `Email`, `EmailLog`, `EmailTemplate`
- Marketing and A/B analytics: `MarketingCampaign`, `Ad`, `AdVariant`, `ABTest`, `CampaignPerformance`

### Core tables currently used by growth modules

- `Workflow`, `WorkflowAction` in `prisma/schema.prisma`
- `AnalyticsEvent` in `prisma/schema.prisma`
- `Email`, `EmailTemplate`, `EmailLog` in `prisma/schema.prisma`

### Event contract examples

- `lead.scraped`, `lead.enriched`, `lead.visitor.tracked`
- `crm.lead.imported`, `crm.pipeline.stage_changed`, `crm.conversion.marked`
- `marketing.automation.run_started`, `marketing.automation.message_sent`, `marketing.automation.provider_status`

## 3) API Endpoints (Growth Core)

### Lead Engine (`/api/lead-engine`)

- `POST /scrape`
- `GET /leads`
- `POST /leads/:leadId/enrich`
- `POST /strategy/predict`
- `POST /visitors/track`
- `GET /stats`

### CRM Engine (`/api/crm-engine`)

- `POST /leads/import`
- `GET /pipeline`
- `PATCH /pipeline/stage`
- `POST /outreach/sequence/plan`
- `POST /outreach/sequence/start`
- `POST /outreach/dispatch`
- `POST /conversions/mark`
- `GET /stats`

### Marketing Automation (`/api/marketing-automation`)

- `POST /campaigns`
- `GET /campaigns`
- `GET /campaigns/:campaignId`
- `PATCH /campaigns/:campaignId`
- `POST /campaigns/:campaignId/activate`
- `POST /campaigns/:campaignId/deactivate`
- `POST /campaigns/:campaignId/launch`
- `POST /events/trigger`
- `POST /ai/copy/generate`
- `POST /ai/send-time/optimize`
- `POST /ai/ab-tests/optimize`
- `GET /stats`
- `POST /webhooks/twilio/status`
- `POST /webhooks/twilio/voice-status`

## 4) Backend Code Layout (Deployable)

- App wiring: `src/backend/app.module.ts`
- Global guards + public bypass:
  - `src/backend/common/decorators/public.decorator.ts`
  - `src/backend/common/guards/tenant.guard.ts`
  - `src/backend/common/guards/permission.guard.ts`
  - `src/backend/common/guards/billing-enforcement.guard.ts`
- Queue processor:
  - `src/backend/marketing-automation/processors/marketing-automation.processor.ts`
- Channel dispatcher and provider integration:
  - `src/backend/marketing-automation/services/channel-dispatch.service.ts`
- Twilio callback ingestion:
  - `src/backend/marketing-automation/marketing-automation.controller.ts`
  - `src/backend/marketing-automation/marketing-automation.service.ts`

## 5) Frontend Structure (Module Parity)

- Lead frontend: `src/app/lead-engine/page.tsx`, `src/hooks/useLeadEngine.ts`
- CRM frontend: `src/app/crm-engine/page.tsx`, `src/hooks/useCrmEngine.ts`
- Marketing automation frontend:
  - `src/app/marketing-automation/page.tsx`
  - `src/components/marketing-automation/MarketingAutomationDashboard.tsx`
  - `src/hooks/useMarketingAutomation.ts`

## 6) AI Prompt System

### Services

- Core generation: `src/backend/ai/ai.service.ts`
- Engine/routing: `src/backend/ai/services/ai-engine.service.ts`

### Prompt categories currently used in growth stack

- Lead strategy scoring prompts (Module 1)
- CRM outreach sequence planning prompts (Module 3)
- Marketing copy and A/B winner prompts (Module 4)
- AI voice script generation prompts (Module 4)

### Prompt quality rules

- Structured output with strict JSON where machine parsing is required
- Low temperature for deterministic operations
- Higher temperature only for creative variant generation
- Attach campaign/contact context in prompt payload

## 7) Automation Workflow Runtime

### Design

- Workflow definitions are persisted in `Workflow` and `WorkflowAction`
- Runtime executions are queued in BullMQ (`marketing-automation` queue)
- Processor dispatches per step/channel and logs immutable telemetry
- Provider callbacks update delivery state via status events

### Workflow trigger modes

- Manual launch
- Event-triggered launch
- Scheduled trigger support via trigger payload

### Reliability controls

- Queue retries with exponential backoff
- Delivery event persistence for audit trails
- Provider callback verification for Twilio signature

## 8) DevOps Setup

### Local and CI build

- Backend build: `npm run build:backend`
- Frontend build: `npm run build:frontend`
- Repo build: `npm run build`

### Required runtime services

- PostgreSQL
- Redis
- Backend API service
- Next.js frontend service

### Environment variables (minimum)

- Database: `DATABASE_URL`
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (optional)
- JWT: `JWT_SECRET`
- AI: `OPENAI_API_KEY` and configured provider keys
- Email: `SENDGRID_API_KEY` (or other configured email provider keys)
- Twilio:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_SMS_FROM`
  - `TWILIO_WHATSAPP_FROM`
  - `TWILIO_VOICE_FROM`

### Callback endpoints

- Twilio message status callback:
  - `POST /api/marketing-automation/webhooks/twilio/status`
- Twilio voice status callback:
  - `POST /api/marketing-automation/webhooks/twilio/voice-status`

### Scaling approach for millions of users

- Horizontal API replicas behind load balancer
- Dedicated queue worker replicas per channel
- Redis cluster for queue throughput
- Postgres read replicas for analytics-heavy endpoints
- Partitioned event storage strategy for `AnalyticsEvent`
- Centralized observability (logs, queue metrics, provider callback latency)

## 9) Expansion Plan (Step-by-Step)

1. Foundation complete: architecture + lead + CRM + module 4 dispatch and callbacks.
2. Add self-serve campaign builder UI (drag-and-drop graph editor) against existing `builderNodes` and `builderEdges` payload.
3. Add webhook adapters for additional providers (Meta WhatsApp direct status webhooks, provider-agnostic callback normalization).
4. Add dedicated normalized analytics tables for high-cardinality events while retaining event sourcing compatibility.
5. Add autoscaling workers and workload partitioning per organization tier.
