# Laravel Octane performance (Belsuite API)

This document summarizes optimizations in `apps/api` for **Swoole/RoadRunner/FrankenPHP** workers, **Redis**, **caching**, and **query shape**. It also explains how to capture **before vs after** latency numbers on your hardware.

## What changed (summary)

| Area | Change |
|------|--------|
| **Redis cache** | Default `CACHE_STORE` is `failover`: tries **redis**, then **database**, then **array** so local/dev works without Redis while production prefers Redis. |
| **Redis connections** | `REDIS_PERSISTENT=true` enables **phpredis** persistent connections (opt-in; off by default). |
| **PDO persistence** | `DB_PERSISTENT=true` sets `\PDO::ATTR_PERSISTENT` on **mysql**, **mariadb**, and **pgsql** (opt-in). |
| **Octane DB disconnect** | `OCTANE_DISCONNECT_DATABASE=false` skips `DisconnectFromDatabases` after each request when you use an **external pooler** (e.g. PgBouncer, ProxySQL) and accept worker-long connections. Default remains **true** (safe). |
| **Swoole table cache** | `OCTANE_TABLE_CACHE_ROWS` / `OCTANE_TABLE_CACHE_BYTES` tune the **Octane in-memory** cache table used by the `octane` cache driver. |
| **Health endpoint** | `GET /api/v1/health` is micro-cached (`API_HEALTH_CACHE_TTL`, default 5s) to cut JSON work under probes. |
| **CRM reads** | `getDealStats` uses **one grouped SQL** instead of hydrating every deal. **List** queries select **narrow columns**. Optional TTL caches: `CRM_STATS_CACHE_TTL`, `CRM_BOARD_CACHE_TTL`. |
| **CRM index** | Composite index on `(organizationId, stage)` for `Deal` (where supported). |
| **AI** | Defaults to **async** outside `local`/`testing`; long prompts (`AI_ASYNC_PROMPT_MIN_LENGTH`) force async. Optional **prompt cache** for sync path: `AI_RESPONSE_CACHE_TTL`. |
| **Boot** | Under Octane, **lazy-loading** is only enforced when **not** in production (avoids extra checks on hot paths). |

## Recommended production `.env`

```env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_PERSISTENT=true
OCTANE_SERVER=swoole

# Optional: CRM burst caching (seconds)
CRM_STATS_CACHE_TTL=10
CRM_BOARD_CACHE_TTL=5

# Optional: identical prompt dedupe for sync AI (seconds); use 0 to disable
AI_RESPONSE_CACHE_TTL=60

# Optional: keep DB socket open in worker when behind a pooler
# OCTANE_DISCONNECT_DATABASE=false
# DB_PERSISTENT=true
```

## Benchmarks (before vs after)

Automated numbers depend on CPU, Docker, TLS, DB latency, and concurrent load. Use the built-in command on **the same machine** before and after enabling Redis, indexes, and cache TTLs.

### 1) Baseline (before)

```bash
cd apps/api
php artisan serve
# In another terminal (same APP_URL as .env, e.g. http://127.0.0.1:8000):
php artisan benchmark:octane --iterations=40 --save-baseline
```

This writes `storage/app/octane-benchmark-baseline.json`.

### 2) After tuning

Restart Octane / PHP, apply env changes, warm config/routes if applicable:

```bash
php artisan config:cache
php artisan route:cache
php artisan octane:start --server=swoole --host=127.0.0.1 --port=8000
php artisan benchmark:octane --iterations=40 --compare
```

The `--compare` flag prints **p50 delta in ms** vs the saved baseline (negative = faster).

### Example outcome (illustrative only)

| Endpoint | Baseline p50 | After (Redis + health cache + SQL) | Delta |
|----------|---------------|--------------------------------------|--------|
| `GET /api/v1/health` | ~2.5 ms | ~0.4 ms | ~−84% |

Replace the placeholder row with your actual `benchmark:octane` output. For CRM-heavy tests, extend `BenchmarkOctaneCommand` with authenticated routes or use `k6`/`hey` against staging.

## Operational notes

- **Octane + `DisconnectFromDatabases`**: Laravel closes the PDO after each request; that is usually what you want unless a **pooler** owns multiplexing.
- **Persistent PDO in PHP-FPM/Octane** can interact badly with **idle server timeouts**; pair with pooler or keep `OCTANE_DISCONNECT_DATABASE=true`.
- Run **`php artisan config:cache`** and **`route:cache`** in production to reduce bootstrap I/O.

## Queue workers (separate from Octane HTTP)

See [`queue-workers.md`](queue-workers.md) and `deploy/supervisor/belsuite-queue-workers.conf` for Octane-safe **stateless jobs**, retries, cleanup middleware, and Supervisor programs.
