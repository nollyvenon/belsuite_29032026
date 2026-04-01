# BelGrowth AI - Module 1 & 2 Implementation

This document describes the product-delivered implementations for:

- Module 1: Lead Generation Engine
- Module 2: SEO Backlink Automation Engine

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
