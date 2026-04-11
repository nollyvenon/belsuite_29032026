# Octane Performance Validation Checklist

## Pre-flight
- Ensure `QUEUE_CONNECTION=redis` and `CACHE_STORE=redis`.
- Ensure `OCTANE_SERVER`, `OCTANE_MAX_REQUESTS`, and worker env values are set.

## Runbook
1. `php artisan config:clear`
2. `php artisan route:clear`
3. `php artisan octane:status`
4. `php artisan octane:start --host=0.0.0.0 --port=8000 --workers=${OCTANE_WORKERS:-auto} --task-workers=${OCTANE_TASK_WORKERS:-auto} --max-requests=${OCTANE_MAX_REQUESTS:-500}`

## Baseline checks
- API health endpoint responds under p95 target:
  - `GET /api/v1/health`
- Auth endpoint contract remains stable:
  - `POST /api/v1/auth/login`
- ERP slice endpoints return stable envelope under concurrency:
  - `/api/v1/accounting/subscriptions`
  - `/api/v1/hr/teams`
  - `/api/v1/inventory/assets`

## Worker safety checks
- Confirm `DisconnectFromDatabases` and `CollectGarbage` listeners are active.
- Verify no tenant context bleed by issuing back-to-back requests with different `X-Tenant-ID`.

