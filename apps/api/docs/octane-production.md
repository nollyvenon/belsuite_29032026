# Laravel Octane — production deployment

This document covers **`apps/api`** (PHP 8.3, Laravel Octane already required in `composer.json`).

**Gradual migration plan:** see [`OCTANE_MIGRATION_ROADMAP.md`](./OCTANE_MIGRATION_ROADMAP.md) (phases, validation gates, cutover).

## 1. Install Octane server dependencies

Octane is installed as a Composer package. You still need **one** runtime backend:

### Option A — Swoole (default in `config/octane.php`)

- Install the **Swoole PHP extension** for your PHP build (PECL / OS packages).
- Verify: `php -m | grep -i swoole`

### Option B — RoadRunner

```bash
cd apps/api
composer require spiral/roadrunner-cli --dev
php artisan octane:install
# Choose "roadrunner" when prompted; set OCTANE_SERVER=roadrunner in .env
```

An empty `.rr.yaml` in the project root is created automatically; Octane passes pool settings via CLI flags.

## 2. Configure workers, memory, and recycling

Set in `.env` (see `deploy/octane/env.production.example`):

| Variable | Purpose |
|----------|---------|
| `OCTANE_SERVER` | `swoole` or `roadrunner` |
| `OCTANE_HOST` / `OCTANE_PORT` | Bind address |
| `OCTANE_WORKERS` | Worker count or `auto` |
| `OCTANE_TASK_WORKERS` | Swoole task workers (`auto` or int) |
| `OCTANE_MAX_REQUESTS` | Recycle worker after N requests (**primary leak mitigation**) |
| `OCTANE_PHP_MEMORY_LIMIT` | Per-worker PHP `memory_limit` (Swoole `php_options`) |
| `OCTANE_GARBAGE_THRESHOLD_MB` | Trigger Octane GC when usage exceeds this |
| `OCTANE_MAX_EXECUTION_TIME` | Request wall-clock limit exposed to the server |

Tuning tips:

- **CPU-bound API:** start with `OCTANE_WORKERS=auto` or `2 × CPU cores` on dedicated hosts.
- **Memory-heavy:** lower `OCTANE_WORKERS` and/or lower `OCTANE_PHP_MEMORY_LIMIT`; enforce **systemd `MemoryMax`** or container memory limits.
- **Leaks / unknown extensions:** keep `OCTANE_MAX_REQUESTS` between **500–5000**; lower is safer.

## 3. Auto-reload

| Environment | Command |
|-------------|---------|
| **Local** | `composer run octane:dev` → `php artisan octane:start --watch` (reloads on file changes; uses `config('octane.watch')`). |
| **Production** | **Do not** use `--watch`. Deploy with `php artisan octane:reload` (graceful) or restart the process manager. |

Worker recycling (`OCTANE_MAX_REQUESTS`) complements deployments by clearing gradual leaks.

## 4. Monitoring and leak alerts

### Application logs

- **`LogOctaneWorkerMemory`** runs on **`OperationTerminated`** (after `CollectGarbage`).
- **Warning** `octane.worker_memory_high` when current or peak memory (bytes, `true` allocator) exceeds **`OCTANE_MEMORY_ALERT_MB`**.
- Optional **info** samples every **`OCTANE_METRICS_SAMPLE_EVERY_N_OPS`** operations (`0` = off).

Logs go to the **`octane`** channel (`storage/logs/octane.log` by default).

### Alerting

1. Set `OCTANE_MEMORY_ALERT_MB` slightly below your per-process budget.
2. Ship `storage/logs/octane.log` (or JSON stdout) to your log platform and alert on `octane.worker_memory_high`.
3. Optionally add **`slack`** to `LOG_STACK` so `warning`/`critical` channels notify on-call (see `config/logging.php`).

### OS / orchestrator

- **systemd:** use `MemoryMax=` (see `deploy/octane/systemd-octane.service.example`).
- **Kubernetes:** set `resources.limits.memory` and liveness probes hitting `/api/v1/health`.

## 5. Safeguards (monitoring + recovery)

These run only under Octane (not `php artisan serve` / PHPUnit). Toggle with **`OCTANE_SAFEGUARDS_ENABLED`**.

| Component | What it does |
|-----------|----------------|
| **`MarkOctaneRequestStart`** | Stores request start time for latency measurement. |
| **`LogSlowOctaneRequests`** | Logs **`octane.slow_request`** when wall time ≥ **`OCTANE_SLOW_REQUEST_MS`**. |
| **`ReconnectStaleServices`** | Before each request: ping DB (`getPdo`); on failure **`DB::reconnect()`** and log **`octane.db_reconnected`**. Optional Redis: **`Redis::purge()`** after failed ping when **`OCTANE_RECOVER_REDIS_ON_REQUEST=true`** and `redis` is bound. |
| **`DetectOctaneMemoryLeakAndRecycle`** | **Hard stop:** if RSS-style memory ≥ **`OCTANE_MEMORY_HARD_STOP_MB`**, log **`octane.memory_hard_stop`** and call **`StoppableClient::stop()`** so Supervisor/systemd starts a fresh worker (when **`OCTANE_RESTART_ON_HARD_MEMORY`** is true). **Leak heuristic:** if memory rises by **`OCTANE_MEMORY_LEAK_DELTA_MB`** for **`OCTANE_MEMORY_LEAK_STREAK`** consecutive post-GC samples, log **`octane.memory_leak_suspected`** and optionally recycle (**`OCTANE_RESTART_ON_LEAK_PATTERN`**). |
| **`ResetOctaneSafeguardState`** | On **`WorkerStarting`**, resets static counters so reloads do not inherit stale streaks. |

**Uptime stack (recommended):** Octane **`OCTANE_MAX_REQUESTS`** + safeguards above + process manager **`autorestart=true`** + reverse-proxy health checks to **`/api/v1/health`**.

## 6. Process managers

Examples (adjust paths and user):

- **Supervisor:** `deploy/octane/supervisord-octane.ini.example`
- **systemd:** `deploy/octane/systemd-octane.service.example`

Place **Nginx/Caddy** in front for TLS termination, HTTP/2, and buffering; proxy to `127.0.0.1:OCTANE_PORT`.

## 7. Composer shortcuts

```bash
composer run octane:install   # interactive server install
composer run octane:start     # production-style (no watch)
composer run octane:dev       # local with --watch
composer run octane:reload    # graceful worker reload
```

## 8. Pre-flight checklist

- [ ] `php artisan config:cache` && `php artisan route:cache` in production CI/CD.
- [ ] Queue workers run **separate** processes (`queue:work`), not inside Octane workers only.
- [ ] `APP_ENV=production`, `APP_DEBUG=false`.
- [ ] Redis/DB connection limits ≥ `(OCTANE_WORKERS × app instances) + queue workers`.
- [ ] Run `php artisan test` after changing Octane listeners or middleware.
