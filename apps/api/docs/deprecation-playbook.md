# NestJS Decommission Playbook

## Preconditions
- All route groups are migrated to Laravel and listed in `docs/migration-map.md`.
- Contract parity checks pass for migrated routes.
- Tenant isolation tests pass for all protected routes.
- Rollback toggle (`NEST_FALLBACK_ENABLED`) validated in staging.
- Laravel API runs on **Octane** in staging with the same env shape as production (`config:cache`, `route:cache`, Redis cache/queue where used).

## Controlled deprecation sequence
1. Keep `NEST_FALLBACK_ENABLED=true` and route only migrated groups to Laravel.
2. Run smoke tests across auth, ERP, AI bridge, CRM bridge, billing bridge.
3. Set `NEST_DEPRECATION_READY=true` in staging and monitor.
4. In production, remove fallback rewrites only after two stable release windows.
5. Archive NestJS route map and rollback snapshot.

## Final cutover (aligns with `docs/OCTANE_MIGRATION_ROADMAP.md` Phase 6–7)

1. **Prove parity:** contract tests + manual critical flows with Nest **bypass off** in staging.  
2. **Traffic:** shift Next/gateway rewrites so migrated paths never reach Nest; watch p95/error rate vs SLO.  
3. **Workers:** stop Nest queue consumers for migrated jobs; ensure Laravel workers own those queues (no double consumption).  
4. **Nest scale to zero:** remove deploy artifacts; keep tagged image or git tag for rollback only.  
5. **Docs:** mark Nest “archived” in `migration-map.md` and internal wiki; update on-call playbooks.

## Laravel bridge behavior
- With `NEST_FALLBACK_ENABLED=false`, HTTP relay routes under `/api/v1/integrations/*/relay` return **503** with `nest_relay_disabled` so staging proves no hidden Nest dependency. Native `/api/v1/integrations/deliver` remains available.

## Rollback
- Re-enable `NEST_FALLBACK_ENABLED=true`.
- Restore `/api/*` default proxy to NestJS in `next.config.ts`.
- Restart frontend and invalidate edge caches.
- Redeploy Nest workers if queue traffic was moved back.

