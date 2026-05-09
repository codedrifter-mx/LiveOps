# Service Instance Info Display — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display all Railway service instances (name, status, region, deployment info, domains) queried from the Railway GraphQL API in the LiveOps frontend.

**Architecture:** Backend queries `environment.serviceInstances` via Railway GraphQL, returns structured service info array. Frontend fetches on mount and after SSE events, renders a ServicesList card below the service status.

**Tech Stack:** Node.js/Express/TypeScript backend, React/TypeScript frontend, Railway GraphQL API

---

## Task 1: Add `getEnvironmentServices()` to `railway.ts`

**Files:**
- Modify: `services/backend/src/railway.ts`

- [ ] **Step 1: Add the GraphQL query and `ServiceInfo` type**

Add after the existing `UPSERT_VAR` query, and export a new `ServiceInfo` interface and `getEnvironmentServices` function:

`services/backend/src/railway.ts`:
```typescript
export interface ServiceInfo {
  id: string;
  serviceId: string;
  serviceName: string;
  numReplicas: number | null;
  region: string | null;
  source: string | null;
  builder: string | null;
  status: string | null;
  deployUrl: string | null;
  commitMessage: string | null;
  commitAuthor: string | null;
  instanceStatus: string | null;
  domains: string[];
  isSleeping: boolean;
}

const GET_SERVICES = gql`
  query getEnvironmentServices($environmentId: String!) {
    environment(id: $environmentId) {
      serviceInstances {
        edges {
          node {
            id
            serviceId
            serviceName
            numReplicas
            region
            source
            builder
            startCommand
            sleepApplication
            cronSchedule
            latestDeployment {
              id
              status
              url
              meta
            }
            domains {
              domain
            }
          }
        }
      }
    }
  }
`;
```

- [ ] **Step 2: Implement `getEnvironmentServices()`**

Add after `getKeycloakStatus()`:

```typescript
export async function getEnvironmentServices(): Promise<ServiceInfo[]> {
  if (!API_TOKEN || !KC_ENV_ID) return [];
  try {
    const r: any = await client.request(GET_SERVICES, { environmentId: KC_ENV_ID });
    const edges = r?.environment?.serviceInstances?.edges || [];
    return edges.map((e: any) => {
      const node = e.node;
      const dep = node.latestDeployment || {};
      const meta = dep.meta || {};
      return {
        id: node.id,
        serviceId: node.serviceId,
        serviceName: node.serviceName || 'unknown',
        numReplicas: node.numReplicas ?? null,
        region: node.region || null,
        source: node.source || null,
        builder: node.builder || null,
        status: dep.status || null,
        deployUrl: dep.url || null,
        commitMessage: meta.commitMessage || null,
        commitAuthor: meta.commitAuthor || null,
        instanceStatus: null,
        domains: (node.domains || []).map((d: any) => d.domain),
        isSleeping: !!node.sleepApplication,
      };
    });
  } catch (e: any) {
    console.error('[railway] getEnvironmentServices failed:', e?.message || e);
    return [];
  }
}
```

- [ ] **Step 3: Verify backend compiles**

Run: `cd services/backend && npx tsc`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/backend/src/railway.ts
git commit -m "feat: add getEnvironmentServices to railway.ts"
```

---

## Task 2: Add `GET /api/services` endpoint

**Files:**
- Modify: `services/backend/src/index.ts`

- [ ] **Step 1: Update import to include `getEnvironmentServices`**

In `services/backend/src/index.ts`, change the railway import line to add `getEnvironmentServices`:

```typescript
import { getKeycloakStatus, restoreJavaOpts, redeployService, recoverAndRedeploy, getLatestDeploymentId, getEnvironmentServices } from './railway';
```

- [ ] **Step 2: Add the endpoint**

Add after the `/api/railway-status` line (line 49):

```typescript
app.get('/api/services', async (_, res) => {
  try { res.json(await getEnvironmentServices()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});
```

- [ ] **Step 3: Verify backend compiles**

Run: `cd services/backend && npx tsc`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/backend/src/index.ts
git commit -m "feat: add GET /api/services endpoint"
```

---

## Task 3: Create `useServices` frontend hook

**Files:**
- Create: `services/frontend/src/hooks/useServices.ts`

- [ ] **Step 1: Create the hook**

`services/frontend/src/hooks/useServices.ts`:
```typescript
import { useState, useEffect } from 'react';

export interface ServiceInfo {
  id: string;
  serviceId: string;
  serviceName: string;
  numReplicas: number | null;
  region: string | null;
  source: string | null;
  builder: string | null;
  status: string | null;
  deployUrl: string | null;
  commitMessage: string | null;
  commitAuthor: string | null;
  instanceStatus: string | null;
  domains: string[];
  isSleeping: boolean;
}

const SERVICES_URL = `${(window as any).__BACKEND_URL__ || ''}/api/services`;

export function useServices(trigger: number) {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = () => {
    setLoading(true);
    setError(null);
    fetch(SERVICES_URL)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setServices([]); }
        else { setServices(data || []); }
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to fetch');
        setLoading(false);
      });
  };

  useEffect(() => { refetch(); }, [trigger]);

  return { services, loading, error, refetch };
}
```

- [ ] **Step 2: Verify frontend compiles**

Run: `cd services/frontend && npx tsc -b`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/src/hooks/useServices.ts
git commit -m "feat: add useServices hook"
```

---

## Task 4: Create `ServicesList` component

**Files:**
- Create: `services/frontend/src/components/ServicesList.tsx`

- [ ] **Step 1: Create the component**

`services/frontend/src/components/ServicesList.tsx`:
```typescript
import { ServiceInfo } from '../hooks/useServices';

interface Props {
  services: ServiceInfo[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function statusDot(status: string | null, isSleeping: boolean): string {
  if (isSleeping) return 'disconnected';
  if (status === 'SUCCESS' || status === 'RUNNING' || !status) return 'healthy';
  return 'down';
}

function statusLabel(status: string | null, isSleeping: boolean): string {
  if (isSleeping) return 'Sleeping';
  if (status === 'SUCCESS') return 'Deployed';
  if (status === 'RUNNING') return 'Running';
  if (status === 'FAILED') return 'Failed';
  if (status === 'BUILDING') return 'Building';
  if (status === 'DEPLOYING') return 'Deploying';
  if (status === 'CRASHED') return 'Crashed';
  if (status === 'REMOVED') return 'Removed';
  return status || 'Unknown';
}

function builderIcon(builder: string | null): string {
  if (builder === 'DOCKERFILE') return 'Dockerfile';
  if (builder === 'NIXPACKS') return 'Nixpacks';
  return builder || '—';
}

export function ServicesList({ services, loading, error, onRetry }: Props) {
  if (loading) {
    return <div className="card"><h2>Services</h2><div style={{color:'var(--text-secondary)',fontSize:14}}>Loading services...</div></div>;
  }

  if (error) {
    return <div className="card"><h2>Services</h2><div style={{color:'var(--accent-red)',fontSize:14}}>{error} <button className="btn" onClick={onRetry} style={{marginLeft:8,padding:'4px 12px',fontSize:12}}>Retry</button></div></div>;
  }

  if (services.length === 0) {
    return <div className="card"><h2>Services</h2><div style={{color:'var(--text-secondary)',fontSize:14}}>No services found</div></div>;
  }

  return <div className="card"><h2>Services <span style={{fontWeight:400,color:'var(--text-secondary)'}}>{services.length} instances</span></h2>
    <div className="incident-list">
      {services.map(s => (
        <div key={s.id} className="incident-item" style={{borderLeftColor:'var(--accent-green)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span className={`dot ${statusDot(s.status, s.isSleeping)}`} />
            <span className="incident-service">{s.serviceName}</span>
            <span style={{fontSize:12,color:'var(--text-secondary)'}}>{statusLabel(s.status, s.isSleeping)}</span>
            {s.region && <span style={{fontSize:12,color:'var(--text-secondary)',marginLeft:'auto'}}>{s.region}</span>}
          </div>
          <div className="incident-status" style={{marginTop:4}}>
            {s.builder && <span>Built with {builderIcon(s.builder)}</span>}
            {s.numReplicas != null && <span> | {s.numReplicas} replica{s.numReplicas !== 1 ? 's' : ''}</span>}
            {s.source && <span> | {s.source}</span>}
          </div>
          {s.commitMessage && <div className="incident-status" style={{marginTop:2}}>{s.commitMessage}{s.commitAuthor ? ` — ${s.commitAuthor}` : ''}</div>}
          {s.domains.length > 0 && <div className="incident-time" style={{marginTop:2}}>{s.domains.join(', ')}</div>}
        </div>
      ))}
    </div>
  </div>;
}
```

- [ ] **Step 2: Verify frontend compiles**

Run: `cd services/frontend && npx tsc -b`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/src/components/ServicesList.tsx
git commit -m "feat: add ServicesList component"
```

---

## Task 5: Integrate into App.tsx

**Files:**
- Modify: `services/frontend/src/App.tsx`

- [ ] **Step 1: Add imports**

Add after the existing `import { ApprovalFlow } ...` line:
```typescript
import { useServices } from './hooks/useServices';
import { ServicesList } from './components/ServicesList';
```

- [ ] **Step 2: Add state for refresh trigger**

Add after line `const [result, setResult]...`:
```typescript
const [refreshTick, setRefreshTick] = useState(0);
```

- [ ] **Step 3: Call the hook**

Add after the existing useEffect blocks:
```typescript
const { services, loading: svcLoading, error: svcError, refetch: refetchServices } = useServices(refreshTick);
```

- [ ] **Step 4: Re-fetch on SSE events**

In the `useEffect` that watches `lastEvent` (line 22-28), add after `setCurrentIncident(lastEvent)`:
```typescript
setRefreshTick(t => t + 1);
```

The full effect becomes:
```typescript
useEffect(() => {
  if (lastEvent) {
    setIncidents(prev => [lastEvent, ...prev].slice(0, 20));
    setIsDown(lastEvent.type === 'incident');
    setCurrentIncident(lastEvent);
    setRefreshTick(t => t + 1);
  }
}, [lastEvent]);
```

- [ ] **Step 5: Render ServicesList**

Add between the Service Status card (the `.card` with `Service Status`) and the `.card` with `Controls`:

After line `</div>` closing the Service Status card (after line 61 — after `{isDown && <DynamicDashboard ...}` — put it right before `{isDown && <ActionPanel ...}`:

Actually, the spec says "always visible, not conditional on incident" and "between Service Status card and Controls card". The current order is:
1. Service Status card (always)
2. DynamicDashboard (if down)
3. ActionPanel (if down)
4. ApprovalFlow (always)
5. Controls card (always)
6. CopilotSidebar
7. Incident Feed (always)

Add ServicesList after ApprovalFlow and before Controls. Right before `{result && <div className="result-box"`:

```typescript
<ServicesList services={services} loading={svcLoading} error={svcError} onRetry={refetchServices} />
```

- [ ] **Step 6: Verify frontend compiles and builds**

Run:
```bash
cd services/frontend && npx tsc -b
npx vite build
```
Expected: no errors, build succeeds

- [ ] **Step 7: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/src/App.tsx
git commit -m "feat: integrate ServicesList into App"
```

---

## Task 6: Final verification and push

- [ ] **Step 1: Verify both projects compile**

```bash
cd C:\Users\Kazuk\projects\LiveOps\services\backend && npx tsc
cd C:\Users\Kazuk\projects\LiveOps\services\frontend && npx tsc -b && npx vite build
```
Expected: no errors, build succeeds

- [ ] **Step 2: Push to main**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git push origin main
```
