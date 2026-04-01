# Module 10: Frontend System

BelSuite now includes a unified frontend system across three surfaces:

## Web
- Next.js workspace shell at `/dashboard`
- Admin panel at `/admin`
- Shared component system under `src/components/system`
- Zustand stores under `src/stores`
- Typed API integration layer under `src/lib/api`

## Mobile
- Flutter scaffold under `apps/mobile`
- Mobile navigation shell with module cards for analytics, admin, video, marketing, social, billing, UGC, and AI
- Shared API client structure in Dart under `apps/mobile/lib/src/services`

## Desktop
- Electron scaffold under `apps/desktop`
- Desktop shell focused on the video editor route by default
- Preload bridge for desktop-specific integrations

## Design goals
- Single navigation language across all clients
- Shared route and module naming
- Consistent auth token strategy
- API-first integration with live backend modules
- Video and production workflows prioritized on desktop

## Key web entry points
- `src/app/dashboard/page.tsx`
- `src/app/admin/page.tsx`
- Existing feature routes remain active: `/analytics`, `/marketing`, `/social`, `/video`, `/ugc`, `/billing`, `/ai/dashboard`

## State management
- Web and desktop renderer rely on Zustand stores:
  - `src/stores/auth-store.ts`
  - `src/stores/ui-store.ts`
  - `src/stores/workspace-store.ts`

## API layer
- Web API client: `src/lib/api/client.ts`
- Workspace aggregation: `src/lib/api/modules/workspace.ts`
- Admin module client: `src/lib/api/modules/admin.ts`

## Platform notes
- Flutter is scaffolded for extension and native packaging, not yet wired to production build CI.
- Electron loads the existing Next.js routes, keeping the renderer aligned with the web product instead of duplicating the video editor.