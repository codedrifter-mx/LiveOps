# NOC Dashboard Redesign

**Date:** 2026-05-09
**Project:** LiveOps

## Problem

The LiveOps frontend has a dark-themed, single-column layout with a fixed-width container, a right-side CopilotSidebar chatbot, and basic card components. It needs a professional NOC (Network Operations Center) dashboard look with a light theme, sidebar navigation, and embedded generative UI — no chatbot.

## Design

### Color System

Switch from dark theme to light:

- Background: `#EDEDF5` (bg)
- Surface: `#FFFFFF` (surface)
- Border: `#DBDBE5` (border)
- Text primary: `#010507` (primary)
- Text muted: `#57575B` (muted)
- Accent lilac: `#BEC2FF` (lilac)
- Accent mint: `#85ECCE` (mint)
- Accent blue: `#3D92E8` (blue)
- Accent orange: `#FFAC4D` (orange)
- Accent red: `#FA5F67` (red)

Card radius: `0.75rem`. All cards use `bg-white`, `border`, `shadow-sm`.

### Typography

- Body: `Plus Jakarta Sans`, system-ui
- Mono: `Spline Sans Mono`, ui-monospace

Loaded via Google Fonts `<link>` in `index.html`.

### Layout

Full-viewport three-zone layout (no max-width constraint, fills screen):

```
┌──────────┬─────────────────────────────────────────────┐
│ Sidebar  │  Header (sticky, border-bottom)             │
│ 240px    ├─────────────────────────────────────────────┤
│ border-r │  Main Content Area (scrollable, p-8)        │
│          │                                             │
│          │  - Empty state OR Incident dashboard        │
│          │  - Footer stats grid (always visible)       │
└──────────┴─────────────────────────────────────────────┘
```

### Sidebar (240px)

- Top: Logo "LO" badge + "LiveOps" brand
- Nav: Dashboard, Incidents, Infrastructure, Settings (current page highlighted with lilac bg)
- Bottom section: "Active Threads" list (from CopilotKit thread data), SSE connection status indicator (green dot + "SSE Connected")
- Uses `border-r border-border`, `bg-surface`

### Header (sticky, h-16)

- Left: "NOC Overview" title + StatusIndicator component (pill badge with dot + "System Operational" / "Incident Active")
- Right: Avatar stack (3 placeholder circles) + bell icon

### Empty State (no incident)

Centered hero in the main content area:
- Large mint heart icon in a circle
- "All Systems Operational" heading
- "No active incidents detected. Peace reigns in the NOC." subtitle
- Small "Simulate Incident" text link (for demo purposes only)

### Incident Dashboard (two-column, lg:grid-cols-2)

When SSE detects an incident, replaces the empty state with:

**Incident Banner** (top, full width):
- Red-tinted background, red border
- Alert icon, "Keycloak Service Down" heading
- "Critical impact detected in Auth layer" subtitle
- "Acknowledge" button on right

**Left Column:**
- 4 StatCards (Service, Status, Error Rate, Impact) in 2x2 grid
- Remediation section with ActionButtons: Redeploy, Recover Memory, Status Check, Generate Action
- ApprovalCard (conditional — shown when agent proposes an action)

**Right Column:**
- Incident Timeline card (scrollable feed of FeedItems)
- Agent suggestion card (generative UI) — shows agent's analysis and recommended actions
- DynamicDashboard and ApprovalFlow render here via `useCopilotAction`

### Footer Stats Grid

Always visible below main content, 4 columns:
- Last Incident (e.g. "2h 14m ago")
- MTTR (e.g. "12m 45s")
- Uptime (e.g. "99.98%" in mint)
- On-Call (e.g. "SRE-Team-A")

### Component Inventory

**Remove:**
- `CopilotSidebar` (from `App.tsx` + remove `@copilotkit/react-ui/styles.css` import)
- `@copilotkit/react-ui` dependency (keep `@copilotkit/react-core` for A2UI)

**Keep (restyle):**
- `CopilotKit` provider wrapper (needed for `useCopilotAction` / A2UI)
- `DynamicDashboard` → restyled to new card theme
- `ActionPanel` → restyled to ActionButton grid
- `ApprovalFlow` → restyled to ApprovalCard (lilac border, shield icon)
- `ServicesList` → restyled to light theme

**Create new:**
- `components/Sidebar.tsx` — nav + threads + status
- `components/NOCHeader.tsx` — title bar with status + avatars
- `components/StatusIndicator.tsx` — pill badge with dot
- `components/StatCard.tsx` — metric card
- `components/ActionButton.tsx` — styled action button with icon
- `components/ApprovalCard.tsx` — approval card (replaces old ApprovalFlow)
- `components/FeedItem.tsx` — timeline event row
- `components/IncidentBanner.tsx` — top alert banner
- `components/EmptyState.tsx` — all-systems-operational hero
- `components/FooterStats.tsx` — bottom stats row

### Data Integration

- SSE (`useSSE`): triggers `isDown` state → switches between EmptyState / IncidentDashboard
- `useServices`: populates Infrastructure view
- Backend API: calls through `handleApprove` for remediation actions
- CopilotKit A2UI: `DynamicDashboard` + `ApprovalFlow` rendered via agent `useCopilotAction`, positioned in right column

### CSS Strategy

Replace `App.css` entirely with the new theme. No Tailwind — use plain CSS with custom properties. Same structure as current CSS (single file, all classes). Key classes:
- `.layout`, `.sidebar`, `.main`, `.header` — layout grid
- `.card`, `.card-header`, `.card-body` — surface cards
- `.stat-card` — metric grids
- `.btn`, `.btn-primary`, `.btn-danger`, `.btn-outline` — buttons
- `.badge`, `.badge-healthy`, `.badge-incident` — status pills
- `.feed-item`, `.feed-time`, `.feed-detail` — timeline rows
- `.empty-state`, `.incident-banner`, `.approval-card` — specific sections

### `index.html` Updates

Replace the current frontend `index.html` (`services/frontend/index.html`) with the new version:
- Google Fonts links (Plus Jakarta Sans + Spline Sans Mono)
- Title: "LiveOps NOC Dashboard"
- Remove Tailwind CDN (we use plain CSS)
- Keep `<script src="/config.js">` for `__BACKEND_URL__`

## Implementation Order

1. Replace CSS: new `App.css` with light theme + all new component classes
2. Replace `index.html` with new head/fonts/title
3. Create layout components: `Sidebar`, `NOCHeader`, `StatusIndicator`
4. Create content components: `EmptyState`, `IncidentBanner`, `StatCard`, `ActionButton`, `ApprovalCard`, `FeedItem`, `FooterStats`
5. Rewrite `App.tsx`: new layout structure, remove CopilotSidebar, integrate new components
6. Restyle remaining components: `DynamicDashboard`, `ActionPanelGrid`, `ServicesList`
7. Remove `@copilotkit/react-ui` from `package.json`
8. Verify compiles + vite build
9. Commit

## Error Handling

- If SSE disconnects: sidebar shows red dot + "Disconnected"
- If API calls fail: action buttons show inline error text
- Empty timeline: "No incidents recorded"
- All generative UI cards handle null/empty agent data gracefully
