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
| `/api/v1/crm/deals/*` | Laravel Octane | migrated |
| `/api/v1/content/*` | Laravel Octane | migrated |
| `/api/v1/ai/*` | Laravel Octane | migrated |
| `/api/v1/scheduling/posts/*` | Laravel Octane | migrated |
| `/api/v1/video/projects/*` | Laravel Octane | migrated |
| `/api/v1/marketing/workflows/*` | Laravel Octane | migrated |
| `/api/v1/integrations/deliver` | Laravel Octane (native delivery) | migrated |
| `/api/v1/integrations/*/relay` | Laravel → Nest HTTP bridge | bridge (disable with `NEST_FALLBACK_ENABLED=false` after parity) |
| `/api/v1/health` | Laravel Octane | migrated |
| `/api/auth/*` (Next rewrite) | Laravel Octane | migrated |
| `/api/deals` (Next rewrite) | Laravel Octane CRM | migrated |
| `/api/*` | NestJS | default (non-rewritten legacy) |

## Rollback policy
1. Remove or comment out `/api/v1/:path*` rewrite in `next.config.ts`.
2. Restart frontend process.
3. All traffic falls back to NestJS `/api/*`.

