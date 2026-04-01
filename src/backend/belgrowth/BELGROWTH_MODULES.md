# BelGrowth AI - Module 1, 2, 3 & 4 Implementation

This document describes the product-delivered implementations for:

- Module 1: Lead Generation Engine
- Module 2: SEO Backlink Automation Engine
- Module 3: CRM Conversion Engine
- Module 4: Omni-Channel Marketing Automation

## Module 1 - Lead Generation Engine

### API Base
`/api/lead-engine`

### Endpoints

- `POST /scrape`
  - Ingests scraped prospects from directories/social/web datasets.
  - Applies ICP-aware heuristic lead scoring (0-100).
  - Persists each lead as analytics event with compliance metadata.

- `GET /leads`
  - Lists captured and enriched leads.
  - Supports query filters: `source`, `minScore`, `q`, `page`, `limit`.

- `POST /leads/:leadId/enrich`
  - Adds enrichment attributes (industry, company size, revenue, stack, notes).
  - Re-scores lead and stores enriched version linked to parent lead.

- `POST /strategy/predict`
  - AI predicts conversion probability and outreach strategy.
  - Output includes: channel, first-touch angle, follow-up cadence, offer type.

- `POST /visitors/track`
  - Tracks website visitor events (URL/referrer/UTM/device context).

- `GET /stats?days=30`
  - Lead + visitor totals, average score, source distribution, top leads.

### Lead Data Schema (Current Persisted Shape)
Stored in `AnalyticsEvent.properties` for event types:

- `lead.scraped`
- `lead.enriched`
- `lead.visitor.tracked`

Lead object shape:

```json
{
  "campaignName": "Q2 Outreach",
  "source": "linkedin",
  "leadStatus": "new",
  "leadScore": 78,
  "prospect": {
    "fullName": "Jane Doe",
    "email": "jane@company.com",
    "phone": "+1555123456",
    "companyName": "Acme Corp",
    "website": "https://acme.com",
    "linkedinUrl": "https://linkedin.com/in/jane",
    "industry": "SaaS",
    "companySize": 120,
    "annualRevenue": 3500000
  },
  "compliance": {
    "lawfulBasis": "legitimate_interest",
    "doNotContact": false
  }
}
```

### Legal & Compliance Constraints Implemented

- No autonomous scraping execution in backend jobs.
- Ingestion expects externally gathered data with lawful basis control.
- Compliance fields are attached at ingestion time for downstream enforcement.

## Module 2 - SEO Backlink Automation Engine

### API Base
`/api/seo-engine`

### Endpoints

- `POST /content/generate`
  - Generates SEO-optimized blog content via AI content service.
  - Stores generated content in `Content` model tagged with `seo`.

- `POST /backlinks/track`
  - Tracks backlink events with quality scoring and authority impact estimate.

- `GET /backlinks`
  - Lists tracked backlinks with pagination and linkType filtering.

- `POST /backlinks/competitors/analyze`
  - AI competitor backlink opportunity analysis.

- `POST /keywords/cluster`
  - AI keyword clustering by intent with pillar/internal linking suggestions.

- `POST /outreach/email/generate`
  - AI backlink outreach email + anchor text variants + follow-ups.

- `GET /stats?days=30`
  - SEO content count, backlinks count, avg quality, estimated DA, type split.

### Backlink Tracker Schema (Current Persisted Shape)
Stored in `AnalyticsEvent.properties` for event type `seo.backlink.created`:

```json
{
  "sourceUrl": "https://partner-site.com/article",
  "targetUrl": "https://your-site.com/landing",
  "anchorText": "best AI CRM automation",
  "linkType": "guest_post",
  "sourceDomainAuthority": 64,
  "qualityScore": 82,
  "trackedAt": "2026-04-01T08:30:00.000Z"
}
```

### Domain Authority Scoring

- Estimated DA derived from backlink quality and source DA weighting.
- Backlink quality score includes anchor quality, source authority, and link type.
- Stats endpoint returns `estimatedDomainAuthority` for operating visibility.

## Product Notes

- These modules are production-usable with current schema and auth/tenant guards.
- They are implemented to ship quickly without forcing immediate migrations.
- Future phase can move event-payload data into dedicated normalized lead/backlink tables.

## Module 3 - CRM Conversion Engine

### API Base
`/api/crm-engine`

### Endpoints

- `POST /leads/import`
  - Imports leads into CRM pipeline from Module 1 lead events or direct payload.
  - Creates CRM lead identifier and initializes pipeline stage.

- `GET /pipeline`
  - Lists CRM pipeline records with filters: `stage`, `q`, `page`, `limit`.
  - Returns stage distribution for board rendering.

- `PATCH /pipeline/stage`
  - Moves a CRM lead to a new stage (`new`, `qualified`, `contacted`, `proposal`, `negotiation`, `won`, `lost`).

- `POST /outreach/sequence/plan`
  - AI-generated outreach sequence plan for a CRM lead.
  - Returns JSON strategy with channels/touches and step guidance.

- `POST /outreach/sequence/start`
  - Starts an outreach sequence for a CRM lead.
  - Optional `autoDispatch` sends sequence steps immediately.

- `POST /outreach/dispatch`
  - Sends one multichannel outreach action.
  - Email channel is live via `EmailService`; other channels are logged as simulated dispatches.

- `POST /conversions/mark`
  - Marks a lead as `won` or `lost` with optional deal value/currency.

- `GET /stats?days=30`
  - Returns pipeline size, conversion/win rates, total won value, stage distribution, top leads.

### CRM Event Schema (Current Persisted Shape)
Stored in `AnalyticsEvent.properties` for event types:

- `crm.lead.imported`
- `crm.pipeline.stage_changed`
- `crm.outreach.sequence_started`
- `crm.outreach.message_sent`
- `crm.conversion.marked`

Example `crm.lead.imported` payload:

```json
{
  "crmLeadId": "cm9x...",
  "sourceLeadEventId": "cm9w...",
  "stage": "qualified",
  "score": 74,
  "lead": {
    "fullName": "Jane Doe",
    "email": "jane@company.com",
    "phone": "+1555123456",
    "companyName": "Acme Corp",
    "industry": "SaaS",
    "source": "linkedin"
  },
  "notes": "Interested in audit",
  "importedAt": "2026-04-01T12:00:00.000Z"
}
```

## Module 4 - Omni-Channel Marketing Automation

### API Base
`/api/marketing-automation`

### Capabilities

- Campaign builder payloads for drag-and-drop UI state (`builderNodes`, `builderEdges`)
- Drip sequences with per-step delay and conditional logic
- Event-triggered workflows tied to business events
- Personalization engine via `{{token}}` replacement across all channels
- A/B message variants per step with deterministic traffic bucketing
- Queue-backed async execution via BullMQ

### Supported Channels

- Email: live via existing `EmailService`
- SMS: Twilio-backed when configured, simulated otherwise
- WhatsApp: Twilio-backed when configured, simulated otherwise
- Voice calls: Twilio Voice-backed when configured, simulated otherwise
- AI voice agents: AI-generated call script + Twilio voice execution when configured

### Key Endpoints

- `POST /campaigns`
  - Creates a marketing automation campaign stored on the existing workflow engine.

- `GET /campaigns`
  - Lists automation campaigns with search/status/trigger-mode filters.

- `PATCH /campaigns/:campaignId`
  - Updates builder config, triggers, steps, A/B settings, and activation state.

- `POST /campaigns/:campaignId/activate`
- `POST /campaigns/:campaignId/deactivate`
  - Toggles campaign execution.

- `POST /campaigns/:campaignId/launch`
  - Queues a campaign run for a contact list.

- `POST /events/trigger`
  - Fires an event-triggered workflow against a single contact payload.

- `POST /ai/copy/generate`
  - Generates email/SMS/WhatsApp/voice copy variants.

- `POST /ai/send-time/optimize`
  - Recommends top send hours from historical engagement.

- `POST /ai/ab-tests/optimize`
  - Scores message variants and recommends an automated winner split.

- `GET /stats?days=30`
  - Returns campaign counts, run counts, channel mix, and send status breakdowns.

### Execution Data Shape

Configuration is stored in existing `Workflow` and `WorkflowAction` records with:

- `trigger.engine = "marketing_automation"`
- `trigger.builder.nodes / edges`
- `actions[].config` storing each campaign step payload

Runtime telemetry is stored in `AnalyticsEvent.properties` for event types:

- `marketing.automation.run_started`
- `marketing.automation.event_triggered`
- `marketing.automation.message_sent`
- `marketing.automation.message_skipped`
