# Belsuite AI Control Tower

This document defines the production architecture and operating model for Belsuite's centralized AI model switching and orchestration layer.

## 1) System Architecture

- API ingress: `AIGatewayController` receives requests for generation, batch generation, budget, and health.
- Core orchestration: `AIGatewayService` executes the request pipeline, model dispatch, failover loop, cache integration, and usage logging.
- Routing and policy: `TaskRouterService` combines task capability matching, task-route overrides, feature assignments, and strategy-based scoring.
- Model source of truth: `ModelRegistryService` maintains enabled models, dynamic model metadata, and in-memory cache refresh for low-latency reads.
- Control plane: `AdminGatewayController` + `GatewayControlService` provide privileged runtime controls for limits, routes, toggles, credentials, and audit logs.
- Reliability: `FailoverService` applies circuit breaker behavior and model health states.
- Cost and quality optimization: `CostOptimizerService` computes weighted decisions for cheapest/fastest/quality/balanced routing.
- Observability: `UsageTrackerService` aggregates usage, latency, and cost metrics; webhook and audit events are persisted in DB.

## 2) Data Model (Prisma)

Primary runtime tables:

- `AIGatewayModel`: model registry with provider, cost, quality/speed scores, limits, enablement.
- `AIGatewayRequest`: immutable request/response usage ledger for every gateway call.
- `AIFeatureModelAssignment`: feature-level primary/fallback mapping with strategy and constraints.
- `AIBudgetConfig`: tenant/plan/global budget controls.
- `AIProviderHealth`: model-level health and circuit telemetry.

Additional control-plane schema added:

- `AITask`: admin task catalog (`taskKey`, activation, labels).
- `AIRoutingRule`: task-level route policy (`primaryModelId`, fallbacks, strategy, thresholds).
- `AIUsageLog`: canonical analytics ledger for token/cost/margin/perf reporting.

## 3) Backend Implementation (NestJS)

Implemented modules and key components:

- `src/backend/ai-gateway/ai-gateway.module.ts`
- `src/backend/ai-gateway/ai-gateway.service.ts`
- `src/backend/ai-gateway/services/model-registry.service.ts`
- `src/backend/ai-gateway/services/task-router.service.ts`
- `src/backend/ai-gateway/services/gateway-control.service.ts`
- `src/backend/ai-gateway/controllers/admin-gateway.controller.ts`
- `src/backend/ai-gateway/controllers/ai-gateway.controller.ts`

Recent production upgrades:

- Task-route override map (`getTaskRouteMap`/`setTaskRoute`) with audit logging.
- Admin model registration API (upsert by `provider + modelId`).
- Strict route/model validation before persistence.
- Encrypted model credentials at rest with runtime decryption and masking.
- Webhook idempotency and status tracking across payment providers.

## 4) API Endpoints

Required operations are available through admin and runtime APIs:

- Register model:
  - `POST /admin/ai-gateway/models/register`
- Assign model to task:
  - `PUT /admin/ai-gateway/task-routes`
  - `GET /admin/ai-gateway/task-routes`
- Update routing strategy:
  - `PUT /admin/ai-gateway/task-routes`
  - `PUT /admin/ai-gateway/control-profile` (global cheap/balanced/premium/auto-like profile control)
- Get usage stats:
  - `GET /admin/ai-gateway/stats`
  - `GET /admin/ai-gateway/usage`
  - `GET /admin/ai-gateway/dashboard`

Additional enterprise control endpoints:

- `PUT /admin/ai-gateway/feature-assignments`
- `PUT /admin/ai-gateway/feature-model-limits`
- `PUT /admin/ai-gateway/tenant-feature-model-limits`
- `PUT /admin/ai-gateway/model-credentials`
- `POST /admin/ai-gateway/model-credentials/test`

## 5) Routing Engine Logic

Routing precedence in production:

1. Task-level route override (`task-routes`) if active and model healthy.
2. Feature-level assignment (`feature-assignments`) if active and model healthy.
3. Strategy-based optimization (`cheapest`, `fastest`, `best_quality`, `balanced`, `custom`) using model cost/quality/speed and constraints.
4. Circuit breaker filtering excludes open/unhealthy providers.
5. Failover chain attempts candidates sequentially with telemetry writes.

## 6) Admin Dashboard Structure

Primary admin pages:

- `src/app/admin/ai-gateway/page.tsx`: model stats, routing controls, model switcher, credential controls, consumption guide.
- `src/app/admin/control-center/page.tsx`: unified AI + tenant + billing control center.

Operator workflows supported:

- Register provider models and pricing profiles.
- Configure task-level and feature-level routing.
- Force mode shifts (cheap/premium/balanced profile).
- Set global/tenant limits and model allowlists.
- Test provider credentials per model before activation.

## 7) Example Request Flow

1. Request enters `POST /ai-gateway/generate`.
2. `AIGatewayService.generate()` validates feature toggle and tenant/global limits.
3. Cache lookup by deterministic hash key.
4. `TaskRouterService.buildPlan()` selects candidates from task route/feature assignment/strategy scoring.
5. Provider call executes for top candidate.
6. On failure, circuit breaker records error and failover tries next candidate.
7. On success, response is cached, usage persisted, and result returned with cost/tokens/latency metadata.

## 8) Failover and Reliability

- Circuit breaker per model: open/half-open/closed transitions based on failure windows.
- Automatic fallback chain with bounded failover width.
- Usage/error telemetry on every failed attempt.
- Webhook idempotency for billing provider events prevents duplicate credits.
- Admin audit logging on route and credential changes.

## 9) Security and Governance

- Admin endpoints protected by permission enforcement (`manage:organization`).
- Model API keys encrypted at rest (`MODEL_CREDENTIAL_ENCRYPTION_KEY`) and masked in reads.
- Request rate limiting and hardened bootstrap defaults.
- Audit events emitted for control-plane mutations.

## 10) Scalability and Performance

- In-memory hot caches for registry and credential maps.
- Async orchestration queue for multi-stage workflows.
- Compression + proxy-aware rate limiting at ingress.
- Deterministic queue job IDs to prevent duplicate stage execution.
- Provider adapter abstraction supports incremental expansion with minimal blast radius.
