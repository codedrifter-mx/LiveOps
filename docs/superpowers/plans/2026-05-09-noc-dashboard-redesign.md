# NOC Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand LiveOps frontend to a light-themed NOC dashboard with sidebar, embedded generative UI cards, no chatbot.

**Architecture:** Full-viewport three-zone layout (sidebar | header + main content). CSS custom properties for theme. All generative AI surfaces as cards rendered by `useCopilotAction` inside the dashboard — no CopilotSidebar.

**Tech Stack:** React 18, TypeScript, Vite 6, plain CSS, `@copilotkit/react-core` (A2UI only), no Tailwind, no `@copilotkit/react-ui`

---

### Task 1: Replace `index.html` and `App.css`

**Files:**
- Modify: `services/frontend/index.html`
- Replace: `services/frontend/src/App.css`

- [ ] **Step 1: Replace `index.html`**

`services/frontend/index.html`:
```html
<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LiveOps NOC Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="/config.js"></script>
</head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
```

- [ ] **Step 2: Replace `App.css` with the new light theme**

`services/frontend/src/App.css` — complete replacement:
```css
:root {
  --bg: #EDEDF5; --surface: #FFFFFF; --border: #DBDBE5;
  --primary: #010507; --muted: #57575B;
  --lilac: #BEC2FF; --mint: #85ECCE; --blue: #3D92E8;
  --orange: #FFAC4D; --red: #FA5F67;
  --radius: 0.75rem; --radius-sm: 0.5rem;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  background: var(--bg); color: var(--primary);
  min-height: 100vh; -webkit-font-smoothing: antialiased;
}

/* Layout */
.layout { display: flex; height: 100vh; width: 100%; overflow: hidden; }

/* Sidebar */
.sidebar { width: 240px; flex-shrink: 0; border-right: 1px solid var(--border); background: var(--surface); display: flex; flex-direction: column; }
.sidebar-brand { padding: 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
.sidebar-brand .logo { width: 32px; height: 32px; background: var(--lilac); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 14px; }
.sidebar-brand h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
.sidebar-nav { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.sidebar-nav a { padding: 10px 16px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; color: var(--muted); transition: all .15s; }
.sidebar-nav a:hover { background: var(--bg); }
.sidebar-nav a.active { background: var(--lilac); color: var(--primary); }
.sidebar-threads { padding: 16px; border-top: 1px solid var(--border); }
.sidebar-threads .label { font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
.sidebar-threads .count { background: var(--lilac); padding: 0 6px; border-radius: 4px; color: var(--primary); font-size: 10px; }
.thread-item { padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg); margin-bottom: 6px; cursor: pointer; transition: all .15s; font-size: 12px; }
.thread-item:hover { background: var(--lilac); border-color: var(--lilac); }
.thread-item .type { font-family: 'Spline Sans Mono', monospace; font-size: 10px; color: var(--muted); margin-bottom: 2px; }
.thread-item .title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sidebar-status { padding: 16px; border-top: 1px solid var(--border); }
.sidebar-status > div { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg); border-radius: var(--radius-sm); font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }

/* Main area */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* Header */
.header { height: 64px; flex-shrink: 0; border-bottom: 1px solid var(--border); background: var(--surface); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-left h2 { font-size: 16px; font-weight: 600; }
.header-right { display: flex; align-items: center; gap: 16px; }
.avatar-stack { display: flex; }
.avatar-stack > div { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--surface); margin-left: -8px; background: var(--lilac); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: var(--primary); }
.avatar-stack > div:first-child { margin-left: 0; }
.header-divider { width: 1px; height: 24px; background: var(--border); }

/* Status Badge */
.badge { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
.badge .dot { width: 8px; height: 8px; border-radius: 50%; }
.badge .dot.healthy { background: var(--mint); }
.badge .dot.incident { background: var(--red); }

/* Content */
.content { flex: 1; overflow-y: auto; padding: 32px; display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto; width: 100%; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 40px; text-align: center; gap: 16px; background: var(--surface); border-radius: var(--radius); border: 1px dashed var(--border); }
.empty-state .icon-circle { width: 64px; height: 64px; background: var(--mint); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--surface); font-size: 28px; }
.empty-state h3 { font-size: 20px; font-weight: 700; }
.empty-state p { color: var(--muted); font-size: 14px; }
.empty-state .simulate-link { margin-top: 8px; font-family: 'Spline Sans Mono', monospace; font-size: 11px; color: var(--muted); text-decoration: underline; text-decoration-color: var(--lilac); text-underline-offset: 4px; cursor: pointer; background: none; border: none; }

/* Incident banner */
.incident-banner { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-radius: var(--radius); background: var(--red); border: 1px solid var(--red); color: white; }
.incident-banner-left { display: flex; align-items: center; gap: 12px; }
.incident-banner-icon { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
.incident-banner h3 { font-weight: 700; font-size: 16px; }
.incident-banner p { font-size: 13px; opacity: 0.8; }
.incident-banner .ack-btn { font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; padding: 4px; }
.incident-banner .ack-btn:hover { color: white; }

/* Dashboard grid */
.dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
@media (min-width: 900px) { .dashboard-grid { grid-template-columns: 1fr 1fr; } }

/* Stat cards */
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.stat-card { background: var(--surface); padding: 16px; border-radius: var(--radius); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.stat-card .stat-label { font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); display: flex; align-items: center; justify-content: space-between; }
.stat-card .stat-value { font-size: 24px; font-weight: 600; }
.stat-card .stat-trend { font-size: 12px; color: var(--muted); }
.stat-card .color-dot { width: 8px; height: 8px; border-radius: 50%; }
.stat-card .color-dot.red { background: var(--red); }
.stat-card .color-dot.orange { background: var(--orange); }
.stat-card .color-dot.lilac { background: var(--lilac); }
.stat-card .color-dot.mint { background: var(--mint); }

/* Remediation */
.remediation-card { background: var(--surface); padding: 24px; border-radius: var(--radius); border: 1px solid var(--border); }
.remediation-card .section-label { font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 16px; }
.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.action-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: var(--radius); border: 1px solid var(--border); font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; background: transparent; color: var(--primary); }
.action-btn:hover { opacity: 0.8; }
.action-btn.lilac { background: var(--lilac); border-color: var(--lilac); }
.action-btn.mint { background: var(--mint); border-color: var(--mint); }
.action-btn.blue { background: var(--blue); border-color: var(--blue); color: white; }
.action-btn.outline { border-color: var(--border); }

/* Approval card */
.approval-card { background: var(--surface); border: 2px solid var(--lilac); padding: 20px; border-radius: var(--radius); display: flex; flex-direction: column; gap: 16px; }
.approval-card .approval-label { font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--lilac); font-weight: 700; }
.approval-card h3 { font-size: 16px; font-weight: 600; }
.approval-card p { font-size: 13px; color: var(--muted); }
.approval-card .approval-actions { display: flex; gap: 8px; }
.approval-card .approve-btn { flex: 1; background: var(--lilac); color: var(--primary); font-weight: 700; padding: 10px; border-radius: var(--radius-sm); border: none; cursor: pointer; font-size: 13px; }
.approval-card .approve-btn:disabled { opacity: 0.5; }
.approval-card .reject-btn { padding: 10px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; font-size: 13px; }
.approval-card .approval-footer { font-size: 10px; font-family: 'Spline Sans Mono', monospace; color: var(--muted); text-align: center; font-style: italic; }

/* Feed */
.feed-card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
.feed-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg); font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
.feed-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; }
.feed-item { background: var(--surface); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); border-left: 4px solid var(--lilac); display: flex; flex-direction: column; gap: 4px; }
.feed-item.critical { border-left-color: var(--red); }
.feed-item.recovery { border-left-color: var(--mint); }
.feed-item.info { border-left-color: var(--blue); }
.feed-item .feed-top { display: flex; justify-content: space-between; align-items: center; }
.feed-item .feed-service { font-weight: 700; font-size: 13px; }
.feed-item .feed-time { font-family: 'Spline Sans Mono', monospace; font-size: 10px; color: var(--muted); }
.feed-item .feed-detail { font-size: 12px; color: var(--muted); }

/* Footer stats */
.footer-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.footer-stat { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.footer-stat .fs-label { font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 4px; }
.footer-stat .fs-value { font-weight: 600; font-size: 14px; }
.footer-stat .mint { color: var(--mint); }

/* Generative UI cards (DynamicDashboard, ServicesList, etc) */
.gen-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.gen-card .gen-label { font-family: 'Spline Sans Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 12px; }
.gen-card .gen-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.gen-card .gen-box { background: var(--bg); padding: 16px; border-radius: var(--radius-sm); }
.gen-card .gen-box .gen-box-label { font-size: 12px; color: var(--muted); }
.gen-card .gen-box .gen-box-value { font-size: 18px; font-weight: 700; }
.gen-card .gen-meta { margin-top: 12px; font-size: 13px; color: var(--muted); }

/* Dot variants */
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot.connected, .dot.healthy { background: var(--mint); }
.dot.disconnected { background: var(--muted); }
.dot.down { background: var(--red); }

/* Buttons (legacy) */
.btn { padding: 10px 20px; border: none; border-radius: var(--radius); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-success { background: var(--mint); color: var(--primary); }
.btn-primary { background: var(--blue); color: white; }
.btn-danger { background: var(--red); color: white; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
.result-box { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; margin-top: 12px; font-size: 13px; font-family: 'Spline Sans Mono', monospace; white-space: pre-wrap; word-break: break-all; }

/* Service list */
.service-list { display: flex; flex-direction: column; gap: 8px; }
.service-item { padding: 12px; border-radius: var(--radius-sm); background: var(--bg); border: 1px solid var(--border); border-left: 4px solid var(--mint); }
.service-item .svc-row { display: flex; align-items: center; gap: 8px; }
.service-item .svc-name { font-weight: 600; font-size: 14px; }
.service-item .svc-label { font-size: 12px; color: var(--muted); }
.service-item .svc-region { font-size: 12px; color: var(--muted); margin-left: auto; }
.service-item .svc-meta { font-size: 12px; color: var(--muted); margin-top: 4px; }
.service-item .svc-commit { font-size: 12px; color: var(--muted); margin-top: 2px; }
.service-item .svc-domains { font-size: 11px; color: var(--muted); margin-top: 2px; }

/* Transitions */
@keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: slideIn .3s ease-out; }

/* Empty state for no services found */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; }
.card h2 { font-size: 14px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 12px; }
```

- [ ] **Step 3: Verify frontend compiles**

Run: `cd services/frontend && npx tsc -b`
Expected: no errors (App.tsx still uses the same component interfaces)

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/index.html services/frontend/src/App.css
git commit -m "feat: new NOC dashboard theme CSS and fonts"
```

---

### Task 2: Create layout components

**Files:**
- Create: `services/frontend/src/components/Sidebar.tsx`
- Create: `services/frontend/src/components/NOCHeader.tsx`
- Create: `services/frontend/src/components/StatusIndicator.tsx`

- [ ] **Step 1: Create `StatusIndicator.tsx`**

`services/frontend/src/components/StatusIndicator.tsx`:
```typescript
interface Props { status: 'healthy' | 'incident' | 'offline' }
export function StatusIndicator({ status }: Props) {
  const dots = { healthy: 'healthy', incident: 'incident', offline: 'disconnected' };
  const labels = { healthy: 'System Operational', incident: 'Incident Active', offline: 'Disconnected' };
  return <div className="badge"><span className={`dot ${dots[status]}`} /><span>{labels[status]}</span></div>;
}
```

- [ ] **Step 2: Create `Sidebar.tsx`**

`services/frontend/src/components/Sidebar.tsx`:
```typescript
interface Props { connected: boolean; activeNav: string; }
export function Sidebar({ connected, activeNav }: Props) {
  const navItems = ['Dashboard', 'Incidents', 'Infrastructure', 'Settings'];
  const threads = [
    { type: 'Agent Thought Process', title: 'Keycloak OOM Analysis' },
    { type: 'Raw Logs', title: 'System Logs (node-4)' },
  ];
  return <aside className="sidebar">
    <div className="sidebar-brand">
      <div className="logo">LO</div>
      <h1>LiveOps</h1>
    </div>
    <nav className="sidebar-nav">
      {navItems.map(item => (
        <a key={item} className={item === activeNav ? 'active' : ''}>{item}</a>
      ))}
    </nav>
    <div className="sidebar-threads">
      <div className="label"><span>Active Threads</span><span className="count">{threads.length}</span></div>
      {threads.map((t, i) => (
        <div key={i} className="thread-item">
          <div className="type">{t.type}</div>
          <div className="title">{t.title}</div>
        </div>
      ))}
    </div>
    <div className="sidebar-status">
      <div><span className={`dot ${connected ? 'connected' : 'disconnected'}`} /><span>SSE {connected ? 'Connected' : 'Disconnected'}</span></div>
    </div>
  </aside>;
}
```

- [ ] **Step 3: Create `NOCHeader.tsx`**

`services/frontend/src/components/NOCHeader.tsx`:
```typescript
import { StatusIndicator } from './StatusIndicator';
interface Props { status: 'healthy' | 'incident' | 'offline'; }
export function NOCHeader({ status }: Props) {
  return <header className="header">
    <div className="header-left">
      <h2>NOC Overview</h2>
      <StatusIndicator status={status} />
    </div>
    <div className="header-right">
      <div className="avatar-stack">
        <div>JD</div><div>AK</div><div>ML</div>
      </div>
      <div className="header-divider" />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    </div>
  </header>;
}
```

- [ ] **Step 4: Verify frontend compiles**

Run: `cd services/frontend && npx tsc -b`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/src/components/Sidebar.tsx services/frontend/src/components/NOCHeader.tsx services/frontend/src/components/StatusIndicator.tsx
git commit -m "feat: add Sidebar, NOCHeader, StatusIndicator components"
```

---

### Task 3: Create content components

**Files:**
- Create: `services/frontend/src/components/EmptyState.tsx`
- Create: `services/frontend/src/components/IncidentBanner.tsx`
- Create: `services/frontend/src/components/StatCard.tsx`
- Create: `services/frontend/src/components/ActionButton.tsx`
- Create: `services/frontend/src/components/FeedItem.tsx`
- Create: `services/frontend/src/components/FooterStats.tsx`
- Create: `services/frontend/src/components/ApprovalCard.tsx` (replaces ApprovalFlow)

- [ ] **Step 1: Create `EmptyState.tsx`**

`services/frontend/src/components/EmptyState.tsx`:
```typescript
interface Props { onSimulate: () => void; }
export function EmptyState({ onSimulate }: Props) {
  return <div className="empty-state">
    <div className="icon-circle">&#9829;</div>
    <h3>All Systems Operational</h3>
    <p>No active incidents detected. Peace reigns in the NOC.</p>
    <button className="simulate-link" onClick={onSimulate}>Simulate Incident</button>
  </div>;
}
```

- [ ] **Step 2: Create `IncidentBanner.tsx`**

`services/frontend/src/components/IncidentBanner.tsx`:
```typescript
interface Props { onAcknowledge: () => void; }
export function IncidentBanner({ onAcknowledge }: Props) {
  return <div className="incident-banner animate-in">
    <div className="incident-banner-left">
      <div className="incident-banner-icon">&#9888;</div>
      <div>
        <h3>Keycloak Service Down</h3>
        <p>Critical impact detected in Auth layer</p>
      </div>
    </div>
    <button className="ack-btn" onClick={onAcknowledge}>Acknowledge</button>
  </div>;
}
```

- [ ] **Step 3: Create `StatCard.tsx`**

`services/frontend/src/components/StatCard.tsx`:
```typescript
interface Props { label: string; value: string; trend?: string; color?: string; }
export function StatCard({ label, value, trend, color = 'lilac' }: Props) {
  return <div className="stat-card">
    <div className="stat-label"><span>{label}</span><div className={`color-dot ${color}`} /></div>
    <div className="stat-value">{value}</div>
    {trend && <div className="stat-trend">{trend}</div>}
  </div>;
}
```

- [ ] **Step 4: Create `ActionButton.tsx`**

`services/frontend/src/components/ActionButton.tsx`:
```typescript
interface Props { label: string; variant?: 'lilac' | 'mint' | 'blue' | 'outline'; onClick: () => void; }
export function ActionButton({ label, variant = 'lilac', onClick }: Props) {
  return <button className={`action-btn ${variant}`} onClick={onClick}>{label}</button>;
}
```

- [ ] **Step 5: Create `FeedItem.tsx`**

`services/frontend/src/components/FeedItem.tsx`:
```typescript
interface Props { status: 'critical' | 'recovery' | 'info'; time: string; service: string; detail: string; }
export function FeedItem({ status, time, service, detail }: Props) {
  return <div className={`feed-item ${status}`}>
    <div className="feed-top"><span className="feed-service">{service}</span><span className="feed-time">{time}</span></div>
    <div className="feed-detail">{detail}</div>
  </div>;
}
```

- [ ] **Step 6: Create `FooterStats.tsx`**

`services/frontend/src/components/FooterStats.tsx`:
```typescript
export function FooterStats() {
  return <div className="footer-stats">
    <div className="footer-stat"><div className="fs-label">Last Incident</div><div className="fs-value">2h 14m ago</div></div>
    <div className="footer-stat"><div className="fs-label">MTTR</div><div className="fs-value">12m 45s</div></div>
    <div className="footer-stat"><div className="fs-label">Uptime</div><div className="fs-value mint">99.98%</div></div>
    <div className="footer-stat"><div className="fs-label">On-Call</div><div className="fs-value">SRE-Team-A</div></div>
  </div>;
}
```

- [ ] **Step 7: Create `ApprovalCard.tsx`**

`services/frontend/src/components/ApprovalCard.tsx`:
```typescript
import { useState } from 'react';
interface Props { actionName: string; description: string; onApprove: () => Promise<void>; onReject: () => void; onDismiss: () => void; }
export function ApprovalCard({ actionName, description, onApprove, onReject, onDismiss }: Props) {
  const [busy, setBusy] = useState(false);
  if (!actionName) return null;
  return <div className="approval-card">
    <div className="approval-label">Approval Required</div>
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
      <h3>{actionName}</h3>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lilac)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>
    <p>{description}</p>
    <div className="approval-actions">
      <button className="approve-btn" onClick={async()=>{setBusy(true);await onApprove();setBusy(false)}} disabled={busy}>Approve Action</button>
      <button className="reject-btn" onClick={onReject}>Reject</button>
    </div>
    <div className="approval-footer">Requires peer review</div>
  </div>;
}
```

- [ ] **Step 8: Verify frontend compiles**

Run: `cd services/frontend && npx tsc -b`
Expected: no errors

- [ ] **Step 9: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/src/components/EmptyState.tsx services/frontend/src/components/IncidentBanner.tsx services/frontend/src/components/StatCard.tsx services/frontend/src/components/ActionButton.tsx services/frontend/src/components/FeedItem.tsx services/frontend/src/components/FooterStats.tsx services/frontend/src/components/ApprovalCard.tsx
git commit -m "feat: add content components for NOC dashboard"
```

---

### Task 4: Rewrite `App.tsx`

**Files:**
- Modify: `services/frontend/src/App.tsx`

- [ ] **Step 1: Replace `App.tsx`**

`services/frontend/src/App.tsx` — full replacement:
```typescript
import { useState, useEffect } from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { useSSE, IncidentEvent } from './hooks/useSSE';
import { COPILOTKIT_CONFIG } from './lib/copilotkit';
import { useServices } from './hooks/useServices';
import { Sidebar } from './components/Sidebar';
import { NOCHeader } from './components/NOCHeader';
import { EmptyState } from './components/EmptyState';
import { IncidentBanner } from './components/IncidentBanner';
import { StatCard } from './components/StatCard';
import { ActionButton } from './components/ActionButton';
import { ApprovalCard } from './components/ApprovalCard';
import { FeedItem } from './components/FeedItem';
import { FooterStats } from './components/FooterStats';
import { DynamicDashboard } from './components/DynamicDashboard';
import { ServicesList } from './components/ServicesList';
import './App.css';

const BACKEND_URL = (window as any).__BACKEND_URL__ || '';

function App() {
  const { lastEvent, connected } = useSSE();
  const [incidents, setIncidents] = useState<IncidentEvent[]>([]);
  const [isDown, setIsDown] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<IncidentEvent | null>(null);
  const [pendingAction, setPendingAction] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (lastEvent) {
      setIncidents(prev => [lastEvent, ...prev].slice(0, 20));
      setIsDown(lastEvent.type === 'incident');
      setCurrentIncident(lastEvent);
      setRefreshTick(t => t + 1);
      setAcknowledged(false);
    }
  }, [lastEvent]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/status`).then(r => r.json()).then(data => {
      if (data.currentIncident) {
        setIsDown(data.currentIncident.type === 'incident');
        setCurrentIncident(data.currentIncident);
        setIncidents(prev => prev.some(i => i.id === data.currentIncident.id) ? prev : [data.currentIncident, ...prev].slice(0, 20));
      }
    }).catch(() => {});
  }, []);

  const { services, loading: svcLoading, error: svcError, refetch: refetchServices } = useServices(refreshTick);

  const handleApprove = async () => {
    const ep = pendingAction === 'redeploy-keycloak' ? 'redeploy-keycloak' : pendingAction === 'recover-keycloak' ? 'recover-memory' : pendingAction === 'get-keycloak-status' ? 'railway-status' : pendingAction;
    try { const r = await fetch(`${BACKEND_URL}/api/${ep}`, { method: 'POST' }); setResult(JSON.stringify(await r.json(), null, 2)); }
    catch (err: any) { setResult(`Error: ${err.message}`); }
    setPendingAction('');
  };

  const handleReject = () => setPendingAction('');
  const handleDismiss = () => setPendingAction('');

  const status = !connected ? 'offline' : isDown ? 'incident' : 'healthy';

  return (
    <CopilotKit runtimeUrl={COPILOTKIT_CONFIG.runtimeUrl}>
      <div className="layout">
        <Sidebar connected={connected} activeNav="Dashboard" />
        <div className="main">
          <NOCHeader status={status} />
          <div className="content">
            {isDown && !acknowledged && <IncidentBanner onAcknowledge={() => setAcknowledged(true)} />}

            {!isDown ? (
              <EmptyState onSimulate={async () => {
                try { await fetch(BACKEND_URL + '/api/redeploy-keycloak', { method: 'POST' }); } catch {}
              }} />
            ) : (
              <div className="dashboard-grid">
                <div className="" style={{display:'flex',flexDirection:'column',gap:24}}>
                  <div className="stat-grid">
                    <StatCard label="Service" value="Keycloak" color="red" />
                    <StatCard label="Status" value="Down" color="red" />
                    <StatCard label="Error Rate" value="98.2%" trend="+84% vs baseline" color="orange" />
                    <StatCard label="Impact" value="1.2k Users" trend="Growing..." color="orange" />
                  </div>

                  <div className="remediation-card">
                    <div className="section-label">Available Remediation</div>
                    <div className="action-grid">
                      <ActionButton label="Redeploy" variant="lilac" onClick={() => setPendingAction('redeploy-keycloak')} />
                      <ActionButton label="Recover Memory" variant="mint" onClick={() => setPendingAction('recover-keycloak')} />
                      <ActionButton label="Status Check" variant="blue" onClick={() => setPendingAction('get-keycloak-status')} />
                      <ActionButton label="Generate Action" variant="outline" onClick={() => {}} />
                    </div>
                  </div>

                  <ApprovalCard
                    actionName={pendingAction === 'redeploy-keycloak' ? 'Redeploy Keycloak' : pendingAction === 'recover-keycloak' ? 'Recover Keycloak Memory' : pendingAction === 'get-keycloak-status' ? 'Check Keycloak Status' : ''}
                    description={pendingAction ? `Execute ${pendingAction} on Keycloak via Railway API` : ''}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onDismiss={handleDismiss}
                  />

                  {result && <div className="result-box">{result}</div>}

                  <ServicesList services={services} loading={svcLoading} error={svcError} onRetry={refetchServices} />
                </div>

                <div className="" style={{display:'flex',flexDirection:'column',gap:24}}>
                  <div className="feed-card">
                    <div className="feed-header"><span>Incident Timeline</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></div>
                    <div className="feed-body">
                      {incidents.length === 0 ?
                        <div style={{textAlign:'center',padding:40,color:'var(--muted)',fontSize:14}}>No incidents recorded</div> :
                        incidents.map(inc => (
                          <FeedItem
                            key={inc.id}
                            status={inc.type === 'incident' ? 'critical' : 'recovery'}
                            time={new Date(inc.timestamp).toLocaleTimeString()}
                            service={inc.service}
                            detail={inc.type === 'incident' ? `Error rate: ${inc.errorRate || '100%'}, ${inc.impactedUsers || 15} users affected` : 'Service recovered'}
                          />
                        ))
                      }
                      <FeedItem status="info" time="14:03:02" service="CopilotAgent" detail="Root cause identified: Out of Memory on node-4" />
                    </div>
                  </div>

                  <DynamicDashboard incident={currentIncident} />
                </div>
              </div>
            )}

            <FooterStats />
          </div>
        </div>
      </div>
    </CopilotKit>
  );
}
export default App;
```

- [ ] **Step 2: Verify frontend compiles**

Run: `cd services/frontend && npx tsc -b`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/src/App.tsx
git commit -m "feat: rewrite App with NOC dashboard layout"
```

---

### Task 5: Cleanup and verify

**Files:**
- Modify: `services/frontend/package.json` — remove `@copilotkit/react-ui`
- Keep: `services/frontend/src/components/DynamicDashboard.tsx` — already styled via gen-card CSS
- Keep: `services/frontend/src/components/ServicesList.tsx` — already uses CSS classes from App.css

- [ ] **Step 1: Update `DynamicDashboard.tsx` to use new CSS classes**

Replace the component — switch from inline styles with old CSS vars to new `.gen-card`, `.gen-grid`, `.gen-box`, `.gen-box-label`, `.gen-box-value`, `.gen-meta` classes:

`services/frontend/src/components/DynamicDashboard.tsx`:
```typescript
interface Props { incident: { service: string; status: string; errorRate?: string; impactedUsers?: number; timestamp: string; lastHealthy?: string } | null }
export function DynamicDashboard({ incident }: Props) {
  if (!incident) return null;
  return <div className="gen-card">
    <div className="gen-label">Incident Dashboard</div>
    <div className="gen-grid">
      <div className="gen-box"><div className="gen-box-label">Service</div><div className="gen-box-value">{incident.service}</div></div>
      <div className="gen-box"><div className="gen-box-label">Status</div><div className="gen-box-value">{incident.status.toUpperCase()}</div></div>
      <div className="gen-box"><div className="gen-box-label">Error Rate</div><div className="gen-box-value">{incident.errorRate || 'N/A'}</div></div>
      <div className="gen-box"><div className="gen-box-label">Impacted</div><div className="gen-box-value">{incident.impactedUsers || 'N/A'}</div></div>
    </div>
    <div className="gen-meta">
      Detected: {new Date(incident.timestamp).toLocaleString()}
      {incident.lastHealthy && <> | Last healthy: {new Date(incident.lastHealthy).toLocaleString()}</>}
    </div>
  </div>;
}
```

- [ ] **Step 2: Update `ServicesList.tsx` to use new CSS classes**

Replace `.incident-list` / `.incident-item` with `.service-list` / `.service-item`, and use new CSS class names:

`services/frontend/src/components/ServicesList.tsx`:
```typescript
import { ServiceInfo } from '../hooks/useServices';

interface Props { services: ServiceInfo[]; loading: boolean; error: string | null; onRetry: () => void; }

function statusDot(status: string | null, isSleeping: boolean): string {
  if (isSleeping) return 'disconnected';
  if (!status) return 'disconnected';
  if (status === 'SUCCESS' || status === 'RUNNING') return 'healthy';
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
  return builder || '\u2014';
}

export function ServicesList({ services, loading, error, onRetry }: Props) {
  if (loading) {
    return <div className="card"><h2>Services</h2><div style={{color:'var(--muted)',fontSize:14}}>Loading services...</div></div>;
  }
  if (error) {
    return <div className="card"><h2>Services</h2><div style={{color:'var(--red)',fontSize:14}}>{error} <button className="btn" onClick={onRetry} style={{marginLeft:8,padding:'4px 12px',fontSize:12}}>Retry</button></div></div>;
  }
  if (services.length === 0) {
    return <div className="card"><h2>Services</h2><div style={{color:'var(--muted)',fontSize:14}}>No services found</div></div>;
  }
  return <div className="gen-card">
    <div className="gen-label">Services <span style={{fontWeight:400}}>{services.length} instances</span></div>
    <div className="service-list">
      {services.map(s => (
        <div key={s.id} className="service-item">
          <div className="svc-row">
            <span className={`dot ${statusDot(s.status, s.isSleeping)}`} />
            <span className="svc-name">{s.serviceName}</span>
            <span className="svc-label">{statusLabel(s.status, s.isSleeping)}</span>
            {s.region && <span className="svc-region">{s.region}</span>}
          </div>
          <div className="svc-meta">
            {s.builder && <>Built with {builderIcon(s.builder)}</>}
            {s.numReplicas != null && <> | {s.numReplicas} replica{s.numReplicas !== 1 ? 's' : ''}</>}
            {s.source && <> | {s.source}</>}
          </div>
          {s.commitMessage && <div className="svc-commit">{s.commitMessage}{s.commitAuthor ? ` \u2014 ${s.commitAuthor}` : ''}</div>}
          {s.domains.length > 0 && <div className="svc-domains">{s.domains.join(', ')}</div>}
        </div>
      ))}
    </div>
  </div>;
}
```

- [ ] **Step 3: Remove `@copilotkit/react-ui` from package.json**

In `services/frontend/package.json`, remove the line `"@copilotkit/react-ui": "1.57.1"` from dependencies.

- [ ] **Step 4: Reinstall to update lockfile**

```bash
cd services/frontend && npm install
```

- [ ] **Step 5: Verify both compile and frontend builds**

```bash
cd C:\Users\Kazuk\projects\LiveOps\services\backend && npx tsc
cd C:\Users\Kazuk\projects\LiveOps\services\frontend && npx tsc -b
cd C:\Users\Kazuk\projects\LiveOps\services\frontend && npx vite build
```
Expected: both compile without errors, vite build succeeds

- [ ] **Step 6: Commit and push**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add -A
git commit -m "feat: restyle DynamicDashboard and ServicesList for NOC theme, remove @copilotkit/react-ui"
git push origin main
```
