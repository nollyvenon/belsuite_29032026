# Strangler Migration Map

## Routing policy
- Default backend: NestJS (`BACKEND_URL`)
- Migrated endpoints: Laravel Octane (`LARAVEL_API_URL`)

## Live cutover map

| Endpoint prefix | Target backend | Status |
| --- | --- | --- |
| `/api/v1/auth/*` | Laravel Octane | migrated |
| `/api/v1/accounting/*` | Laravel Octane | migrated |
| `/api/v1/hr/*` | Laravel Octane | migrated |
| `/api/v1/inventory/*` | Laravel Octane | migrated |
| `/api/v1/health` | Laravel Octane | migrated |
| `/api/*` | NestJS | default |

## Rollback policy
1. Remove or comment out `/api/v1/:path*` rewrite in `next.config.ts`.
2. Restart frontend process.
3. All traffic falls back to NestJS `/api/*`.

