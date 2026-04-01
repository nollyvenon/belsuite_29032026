# BelSuite Module Delivery Standard

Every product module must ship as a backend + frontend pair.

## Required for every module

- Backend module (`src/backend/<module>/*`) with:
  - Controller endpoints
  - Service orchestration
  - Queue integration if async work exists
  - Runtime telemetry events
- Frontend module (`src/app/<module>/page.tsx`) with:
  - Functional dashboard view
  - Data hooks under `src/hooks/*`
  - Operator controls for primary actions
- Documentation updates:
  - API contract
  - Data model usage
  - Operational runbook

## Definition of done

- Repo backend build passes: `npm run build:backend`
- Frontend page exists and is routable
- Telemetry event types are defined and emitted
- Authentication and public webhook access are explicit and secure

## Current module parity status

- Module 1 Lead Generation: backend + frontend complete
- Module 2 SEO Engine: backend complete, frontend present through marketing surfaces
- Module 3 CRM Engine: backend + frontend complete
- Module 4 Marketing Automation: backend + frontend complete
