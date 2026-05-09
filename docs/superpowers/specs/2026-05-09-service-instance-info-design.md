# Service Instance Info Display

**Date:** 2026-05-09
**Project:** LiveOps

## Problem

The LiveOps UI shows service status (healthy/down) and incidents, but doesn't display what Railway API knows about the deployed service instances — names, regions, replica count, deployment status, and other available metadata.

## API Capabilities (What Railway Exposes)

The Railway GraphQL API via project token exposes these fields on `ServiceInstance` (queried through `environment.serviceInstances`):

- `serviceName` — human-readable service name
- `serviceId` — internal service ID
- `numReplicas` — configured replica count (currently null but usable when set)
- `region` — deployment region (e.g. `sfo`)
- `source` — source type (`GITHUB_REPO`, etc.)
- `builder` — build type (`DOCKERFILE`, etc.)
- `startCommand` — container start command
- `cronSchedule` — cron schedule if applicable
- `latestDeployment` — latest deployment object with `{ id, status, url, meta { commitMessage, commitAuthor } }`
- `domains` — list of `{ domain }` attached to the service
- `sleepApplication` — whether app is sleeping
- `creator` — who created/deployed

Per-instance status is available from `deployment.instances[].status` (e.g. `RUNNING`).

**NOT available:** Memory/CPU limits or current usage (not exposed by Railway API with project token scope).

## Design

### Backend — New Endpoint

**`GET /api/services`** — Returns all service instances in the configured environment.

```typescript
// Response shape
interface ServiceInfo {
  id: string;
  serviceId: string;
  serviceName: string;
  numReplicas: number | null;
  region: string | null;
  source: string | null;
  builder: string | null;
  status: string | null;        // from latestDeployment.status
  deployUrl: string | null;     // from latestDeployment.url
  commitMessage: string | null; // from latestDeployment.meta
  commitAuthor: string | null;  // from latestDeployment.meta
  instanceStatus: string | null;// from deployment.instances[].status
  domains: string[];            // flattened from domains[]
  isSleeping: boolean;
}
```

Implementation notes:
- Reuse existing `graphql-request` client from `railway.ts`
- Query `environment(id: $envId) { serviceInstances { edges { node { ... } } } }`
- Extract `serviceManifest.deploy.limitOverride` from latest deployment meta for resource notes
- Returns array — frontend renders all visible services

### Frontend — New "Services" Card

Add a new card below the existing "Service Status" card showing each service instance.

**Location:** `App.tsx`, between the Service Status card and the Controls card (always visible, not conditional on incident).

**Layout:** Table-like list, one row per service instance.

```
┌─────────────────────────────────────────────┐
│  SERVICES                   3 instances     │
├─────────────────────────────────────────────┤
│  ● heartfelt-achievement   RUNNING  sfo    │
│     Keycloak auth service                  │
│     Last deploy: "fix: keycloak config"     │
│     URL: https://...                        │
├─────────────────────────────────────────────┤
│  ● liveops-backend         RUNNING  us-east4│
│     ...                                     │
├─────────────────────────────────────────────┤
│  ● liveops-frontend        RUNNING  us-east4│
│     ...                                     │
└─────────────────────────────────────────────┘
```

**States:**
- **Loading:** Show "Loading services..." with muted text
- **Loaded:** Render the service rows
- **Error:** Show error message inline, allow retry
- **Empty:** "No services found"
- **Stale data:** Data refreshes on page load and after SSE events

**Refresh strategy:**
- Fetch on initial mount
- Re-fetch after each SSE incident/recovery event (since deployment status may change)

### Data Flow

```
Frontend mount
  │
  ├── GET /api/status (existing — service health + current incident)
  │
  ├── SSE /api/events/stream (existing — real-time incident events)
  │   └── on event → re-fetch /api/services
  │
  └── GET /api/services (new — all service instances)
      └── populates Services card
```

### CSS

Reuse existing design tokens. No new CSS needed — use the existing `.card`, `.status-row`, `.incident-item`, `.incident-time` patterns. Service rows can use the same slide-in animation as incident items.

## Implementation Plan

1. Add `getEnvironmentServices()` to `railway.ts` — GraphQL query for `environment.serviceInstances`
2. Add `GET /api/services` endpoint to `index.ts`
3. Add `useServices()` hook to frontend `hooks/useServices.ts` — fetch + parse
4. Add `ServicesList` component to `components/ServicesList.tsx`
5. Integrate into `App.tsx` — render below Service Status, trigger refresh on SSE events
6. Verify tsc + vite build
7. Commit and push

## Error Handling

- Backend: catch GraphQL errors, return `{ services: [], error: "message" }`
- Frontend: show error state inline, allow retry on click
- Missing fields: default to `"N/A"` or `null` in UI — never crash if a field is absent
