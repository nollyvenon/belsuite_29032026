# NestJS Decommission Playbook

## Preconditions
- All route groups are migrated to Laravel and listed in `docs/migration-map.md`.
- Contract parity checks pass for migrated routes.
- Tenant isolation tests pass for all protected routes.
- Rollback toggle (`NEST_FALLBACK_ENABLED`) validated in staging.

## Controlled deprecation sequence
1. Keep `NEST_FALLBACK_ENABLED=true` and route only migrated groups to Laravel.
2. Run smoke tests across auth, ERP, AI bridge, CRM bridge, billing bridge.
3. Set `NEST_DEPRECATION_READY=true` in staging and monitor.
4. In production, remove fallback rewrites only after two stable release windows.
5. Archive NestJS route map and rollback snapshot.

## Rollback
- Re-enable `NEST_FALLBACK_ENABLED=true`.
- Restore `/api/*` default proxy to NestJS in `next.config.ts`.
- Restart frontend and invalidate edge caches.

