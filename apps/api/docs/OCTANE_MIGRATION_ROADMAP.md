# Belsuite Laravel Octane migration roadmap

Gradual path from **PHP-FPM / `artisan serve`** to **Octane (Swoole or RoadRunner)** for `apps/api`, without breaking Nest-backed routes or Next.js behavior.

**Reality check:** “Millions of users” requires **horizontal scale** (many Octane replicas), **stateless sessions**, **Redis**, **DB pooling**, **CDN**, and **queue isolation**—Octane alone multiplies throughput per box; it does not replace capacity planning.

---

## Laravel API modules (`apps/api`)

All of these share the same Octane worker pool and **must stay stateless** between requests (no per-request data on singletons; use `request()->attributes`, jobs, or cache).

| Module | Typical `/api/v1` surface |
|--------|---------------------------|
| **AI** | `ai/generate`, `ai/jobs/{jobId}` |
| **Auth** | `auth/register`, `auth/login`, `auth/refresh`, `auth/me`, `auth/logout` |
| **Accounting** | `accounting/subscriptions`, `invoices`, `payments` |
| **CRM** | `crm/deals/*` |
| **Content** | `content/*` |
| **HR** | `hr/teams`, `hr/members` |
| **Inventory** | `inventory/assets` |
| **Integration** | `integrations/*` (Nest bridge + native `deliver`) |
| **Marketing** | `marketing/workflows/*`, `marketing/webhook` |
| **Scheduling** | `scheduling/posts/*` |
| **Video** | `video/projects/*`, render + job status |
| **Misc** | `user` (current user JSON), `health` |

If you meant **additional** modules (e.g. billing-only, analytics), name them and we can map routes or Nest vs Laravel ownership.

---

## Phase 0 — Repository & CI gates (no runtime change)

**Goal:** Every change stays mergeable with production-style boot checks.

| Step | Action | Validate |
|------|--------|----------|
| 0.1 | Controllers replace closure routes (`/api/v1/health`, `/`) so `route:cache` works | `php artisan route:cache` |
| 0.2 | Composer script `validate:octane-migration-phase1` | `composer run validate:octane-migration-phase1` |
| 0.3 | GitHub Actions job `laravel-api.yml` on `apps/api/**` | Green PR checks |

**Done when:** CI runs Laravel tests + `config:cache` + `route:cache` on every API change.

---

## Phase 1 — Staging Octane (single region)

**Goal:** Run the same Docker image (or VM) with `php artisan octane:start` behind Nginx.

| Step | Action | Validate |
|------|--------|----------|
| 1.1 | Install Swoole **or** RoadRunner on staging hosts | `php artisan octane:install --server=swoole` (or roadrunner) |
| 1.2 | Set `.env` from `deploy/octane/env.production.example` | Health: `GET /api/v1/health` |
| 1.3 | Process manager: Supervisor/systemd samples in `deploy/octane/` | Restart worker, `autorestart` works |
| 1.4 | Keep Nest + Next rewrites unchanged (`next.config.ts`) | E2E smoke on critical flows |

**Done when:** Staging serves **only** Laravel v1 routes via Octane for 24–48h without elevated 5xx or memory alerts.

---

## Phase 2 — Performance baseline & safeguards tuning

**Goal:** Prove latency and stability vs previous stack.

| Step | Action | Validate |
|------|--------|----------|
| 2.1 | Enable `OCTANE_MAX_REQUESTS`, safeguards (`docs/octane-production.md` §5) | Logs: no unbounded `octane.memory_*` |
| 2.2 | `config:cache`, `route:cache` in deploy pipeline | Cold-boot < SLA |
| 2.3 | k6 / hey against `/api/v1/health` + top business APIs | p95 vs baseline |
| 2.4 | Tune `OCTANE_WORKERS`, `OCTANE_MEMORY_*`, DB pool size | No connection exhaustion |

**Done when:** Documented p95/p99 and worker RSS under representative load.

---

## Phase 3 — Canary production traffic

**Goal:** Small % of production hits Laravel Octane.

| Step | Action | Validate |
|------|--------|----------|
| 3.1 | Deploy Octane pool alongside existing PHP app | Nginx weighted upstream or separate subdomain |
| 3.2 | Route **read-heavy** or **low-risk** paths first | Error budget / SLO |
| 3.3 | Monitor `octane.log`, app logs, DB slow query log | Rollback playbook ready |

**Done when:** Canary holds stable for agreed duration (e.g. 1 week).

---

## Phase 4 — Full cutover for Laravel API

**Goal:** All `LARAVEL_API_URL` / Next rewrites to `/api/v1/*` hit Octane.

| Step | Action | Validate |
|------|--------|----------|
| 4.1 | Remove or decommission old PHP-FPM pool for `apps/api` | Single entrypoint |
| 4.2 | `octane:reload` in deploy script post-artifact | Zero-downtime deploy verified |
| 4.3 | Queue workers remain **separate** processes | No long jobs inside Octane workers |

**Done when:** Production on-call agrees; incident runbook updated.

---

## Phase 5 — Scale-out & platform hardening

**Goal:** Many replicas, multi-AZ, cost-aware autoscaling.

| Step | Action | Validate |
|------|--------|----------|
| 5.1 | Redis for cache + sessions (if not already) | No sticky-file assumptions |
| 5.2 | HPA / replica count from CPU + RPS + queue depth | Scale events logged |
| 5.3 | DB read replicas for read-heavy modules | Query routing reviewed |
| 5.4 | CDN for static assets; WAF in front | DDoS / bot baseline |

---

## Phase 6 — NestJS strangler: final cutover (after parity is proven)

**Goal:** All traffic that today proxies to Nest for **migrated** domains is served by Laravel Octane only; Nest becomes optional, then archived.

**Entry criteria (all must be true):**

| Gate | Evidence |
|------|----------|
| **Contract parity** | `tests/Feature/Api/V1/ContractParityTest.php` (and any module-specific suites) green against Laravel in CI; golden JSON or OpenAPI diff signed off. |
| **Route map** | `docs/migration-map.md` lists every former Nest path with Laravel owner; no “unknown” critical paths. |
| **Runtime toggles** | Staging ran with `NEST_FALLBACK_ENABLED=false` (or equivalent) for **two** release windows without SLO burn. |
| **Queues & webhooks** | All async producers/consumers that used Nest queues/webhooks are migrated or dual-published with idempotency keys verified. |
| **Observability** | Correlation IDs and tenant headers flow through Laravel logs, metrics, and traces at parity with Nest dashboards. |

**Cutover sequence (production):**

| Step | Action | Validate |
|------|--------|----------|
| 6.1 | **Freeze** Nest feature work except hotfixes; branch `nest-legacy-freeze` tag for rollback | Tag recorded in runbook |
| 6.2 | Next.js / gateway: point `BACKEND_URL` / rewrites so **no** user-facing path hits Nest for migrated modules (keep a **single** emergency bypass URL if required) | Smoke + k6 on top flows |
| 6.3 | Drain Nest workers (Bull/Redis) for migrated queues; run Laravel `queue:work` / Horizon for those queues only | Queue depth → 0, no duplicate consumers |
| 6.4 | Remove or 404 Nest routes for migrated surface; keep read-only Nest instance **one** release for forensic diff | 4xx/5xx within error budget |
| 6.5 | Decommission Nest deploy units (containers, systemd, DNS); archive repo or mark read-only | Cost / alert noise down |
| 6.6 | Update `next.config.ts` (and any API gateway) to remove dead rewrites; document final architecture | PR reviewed by platform |

**Post-cutover:** Retain **read-only** export of Nest OpenAPI + migration map for compliance; delete secrets and CI deploy keys for Nest when finance/legal sign off.

---

## Phase 7 — NestJS deprecation (end-of-life)

**Goal:** No production dependency on Nest; engineering uses Laravel as the only long-lived API runtime.

| Step | Action | Validate |
|------|--------|----------|
| 7.1 | Run `docs/deprecation-playbook.md` final section (archive, rollback snapshot) | Artifact stored |
| 7.2 | Remove Nest from `docker-compose`, Helm, Terraform, and developer `npm run dev` if it only existed for API | `grep -R` clean in CI |
| 7.3 | Retrain on-call runbooks (incident commands, dashboards, deploy playbooks) | Dry-run tabletop |

---

## Non-negotiables (every phase)

1. **Run** `composer run validate:octane-migration-phase1` (or CI equivalent) before merge.  
2. **No** new long-lived static state in `app/` (Octane workers are long-lived).  
3. **Use** existing integration safeguards: `FlushRequestScopedContainerBindings`, Octane HTTP clients (`IntegrationHttp`), `OCTANE_MAX_REQUESTS`.  
4. **Nest** remains source of truth for paths under `/api/*` not rewritten to Laravel—do not remove until **Phase 6** gates pass and cutover is executed.

---

## References

- `docs/octane-production.md` — install, env, safeguards, process managers  
- `docs/octane-performance.md` — Redis/cache, `QUEUE_AFTER_COMMIT`, benchmarks  
- `docs/deprecation-playbook.md` — Nest toggles, rollback, archive  
- `deploy/octane/` — example env, systemd, supervisord  
