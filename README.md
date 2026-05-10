# LiveOps

**Generative UI for incident response.** When infrastructure breaks, the interface shouldn't just tell you — it should show you what to do about it.

## The Problem

NOC teams stare at dashboards full of data but no direction. When something breaks, they read logs, grep wikis, page runbooks, then figure out what to click. That gap — between *knowing there's a problem* and *knowing what to do about it* — costs companies millions in MTTR.

Traditional AI copilots make this worse by living in a chat sidebar. You type a question, you get text back. The model describes what to do, but you still have to find the right button, the right form, the right runbook. The interface stays static regardless of the incident.

## The Idea

LiveOps uses **A2UI (Agent-to-UI)** — the AI agent doesn't describe what to do, it **builds the interface for doing it**. When Keycloak goes down, a CopilotTask fires automatically (no chat, no prompt). Gemini 2.0 Flash analyzes the incident context — error rate, impacted users, last healthy timestamp — and calls `show-remediation`, a `useCopilotAction` that renders a React component directly into the dashboard.

The result: the AI generates the analysis card and the action buttons. A database deadlock surfaces different buttons than an OOM error. The interface adapts to the problem, not the other way around.

**Today:** Human approves AI-proposed actions via an approval flow.
**Tomorrow:** The same architecture auto-solves — the agent executes approved playbooks, closes the loop without a click. The generative UI becomes the audit trail for autonomous operations.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Railway (Keycloak)                                     │
│  ┌──────────┐                                           │
│  │ Keycloak  │◄──── Health Poller (SSE)                 │
│  └──────────┘                                           │
└──────────────────────────────────┬──────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────┐
│  Backend (Express)                                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ SSE      │  │ REST API │  │ CopilotKit Runtime   │   │
│  │ /api/    │  │ /api/    │  │ /api/copilotkit      │   │
│  │ events/  │  │ status   │  │                      │   │
│  │ stream   │  │ redeploy │  │ Gemini 2.0 Flash     │   │
│  │          │  │ recover  │  │ Agent Actions:        │   │
│  │          │  │ services │  │  • redeploy-keycloak  │   │
│  └──────────┘  └──────────┘  │  • recover-keycloak   │   │
│                               │  • get-keycloak-status│   │
│  ┌────────────────────────┐  └──────────────────────┘   │
│  │ Railway GraphQL Client │                              │
│  │ (Deploy, Redeploy,     │                              │
│  │  Status, Services)     │                              │
│  └────────────────────────┘                              │
└──────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────┐
│  Frontend (React + Vite)                                 │
│                                                          │
│  ┌─────────────────────────────────────────────────┐     │
│  │ CopilotKit Provider                              │     │
│  │  ├── useCopilotAction('show-remediation')       │     │
│  │  │     → renders RemediationCard                 │     │
│  │  ├── CopilotTask (fires on incident detected)   │     │
│  │  └── useSSE (real-time incident stream)         │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Sidebar  │  │ Incident     │  │ RemediationCard │    │
│  │ Nav      │  │ Timeline     │  │ (AI-generated)  │    │
│  │ Threads  │  │ Feed         │  │ Analysis+Buttons │    │
│  │ Status   │  │              │  │                  │    │
│  └──────────┘  └──────────────┘  └─────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Health Poller** pings Keycloak every 5s, tracks consecutive failures
2. On threshold breach → **SSE broadcasts** incident event to frontend
3. Frontend receives event → `isDown = true` → **CopilotTask fires** automatically
4. CopilotTask sends incident context to Gemini 2.0 Flash via CopilotKit Runtime
5. Agent calls `show-remediation` action → **RemediationCard renders** with AI analysis + action buttons
6. User clicks action → **ApprovalCard** appears for confirmation
7. On approve → REST API call → **Railway GraphQL** redeploy/recover
8. On recovery → SSE broadcasts recovery event → dashboard returns to healthy state

## Stack

| Layer | Technology |
|-------|------------|
| Agent Runtime | CopilotKit 1.57.1 (`@copilotkit/react-core`, `@copilotkit/runtime`) |
| LLM | Google Gemini 2.0 Flash (via `GoogleGenerativeAIAdapter`) |
| A2UI | `useCopilotAction` + `CopilotTask` — agent renders React components |
| Frontend | React 18, Vite, TypeScript |
| Backend | Express, TypeScript, SSE |
| Infrastructure | Railway (GraphQL API for deploy/redeploy/status) |
| Health Monitoring | HTTP health poller with configurable failure threshold |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Google API key with Gemini 2.0 Flash access
- (Optional) Railway project with Keycloak for full demo

### Local Development

**1. Clone and install**

```bash
git clone https://github.com/your-org/liveops.git
cd liveops
```

**2. Backend setup**

```bash
cd services/backend
npm install
```

Create a `.env` file in `services/backend`:

```env
PORT=4000
GOOGLE_API_KEY=your_google_api_key

# For full Railway integration (optional for local demo)
RAILWAY_API_TOKEN=your_railway_token
RAILWAY_PROJECT_ID=your_project_id
RAILWAY_KEYCLOAK_SERVICE_ID=your_keycloak_service_id
RAILWAY_KEYCLOAK_ENVIRONMENT_ID=your_environment_id

# Health poller target (defaults to localhost:8080)
KEYCLOAK_HEALTH_URL=http://localhost:8080/health/ready
POLL_INTERVAL_MS=5000
FAILURE_THRESHOLD=3
```

Start the backend:

```bash
npm run dev
```

**3. Frontend setup**

```bash
cd services/frontend
npm install
```

The frontend uses `config.js` injected at runtime to set the backend URL. For local dev, the Vite dev server proxies `/api` requests to `http://localhost:4000`, so no extra config is needed.

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**4. Simulating an incident (without Railway)**

Without a real Keycloak instance, the health poller will immediately detect failures. You can also use the standalone demo page:

```bash
# Open the standalone prototype (no backend needed)
open index.html
```

Click **"Simulate Incident"** to see the full generative UI flow: incident banner → AI analysis card with action buttons → approval flow → resolution.

### With Railway (Full Demo)

To demonstrate real infrastructure actions:

1. Deploy a Keycloak service on Railway
2. Set the `RAILWAY_*` environment variables in your backend `.env`
3. Use `POST /api/redeploy-keycloak` to redeploy, or `POST /api/recover-memory` to fix OOM issues
4. The health poller will automatically detect when Keycloak goes down and recovers

## Deployment

### Docker (Recommended)

**Backend:**

```bash
cd services/backend
docker build -t liveops-backend .
docker run -p 4000:4000 \
  -e GOOGLE_API_KEY=your_key \
  -e RAILWAY_API_TOKEN=your_token \
  -e RAILWAY_PROJECT_ID=your_project_id \
  -e RAILWAY_KEYCLOAK_SERVICE_ID=your_service_id \
  -e RAILWAY_KEYCLOAK_ENVIRONMENT_ID=your_env_id \
  -e KEYCLOAK_HEALTH_URL=https://your-keycloak.up.railway.app/health/ready \
  liveops-backend
```

**Frontend:**

```bash
cd services/frontend
docker build -t liveops-frontend .
docker run -p 80:80 \
  -e BACKEND_URL=https://your-backend-url \
  liveops-frontend
```

The frontend container's entrypoint script generates `config.js` from the `BACKEND_URL` environment variable, which is read by the app at runtime.

### Railway

1. **Backend service:** Create a new Railway service from the `services/backend` Dockerfile. Set environment variables in the Railway dashboard.
2. **Frontend service:** Create another Railway service from `services/frontend/Dockerfile`. Set `BACKEND_URL` to the backend's Railway URL.
3. Adjust `KEYCLOAK_HEALTH_URL` to point to your Keycloak instance's Railway URL.

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Backend server port |
| `GOOGLE_API_KEY` | Yes | — | Google API key for Gemini 2.0 Flash |
| `KEYCLOAK_HEALTH_URL` | No | `http://localhost:8080/health/ready` | Health check endpoint |
| `POLL_INTERVAL_MS` | No | `5000` | Health poll interval in milliseconds |
| `FAILURE_THRESHOLD` | No | `3` | Consecutive failures before incident |
| `RAILWAY_API_TOKEN` | No* | — | Railway project access token |
| `RAILWAY_PROJECT_ID` | No* | — | Railway project ID |
| `RAILWAY_KEYCLOAK_SERVICE_ID` | No* | — | Keycloak service ID in Railway |
| `RAILWAY_KEYCLOAK_ENVIRONMENT_ID` | No* | — | Railway environment ID |
| `BACKEND_URL` | No* | — | Frontend only: backend URL for API calls |

*Required for real Railway integration. Optional for local demo with simulated incidents.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/status` | Current service health status and active incident |
| `GET` | `/api/events/stream` | SSE stream for real-time incident/recovery events |
| `GET` | `/api/services` | All Railway service instances |
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/incidents` | Incident history |
| `POST` | `/api/redeploy-keycloak` | Redeploy Keycloak via Railway |
| `POST` | `/api/recover-memory` | Restore JAVA_OPTS and redeploy |
| `POST` | `/api/restore-java-opts` | Restore original JAVA_OPTS |
| `ANY` | `/api/railway-status` | Get Keycloak deployment status |
| `POST` | `/api/copilotkit` | CopilotKit runtime endpoint |

## How A2UI Works

The core pattern is simple but powerful:

1. **`useCopilotAction('show-remediation', ...)`** — registers a frontend action that renders a React component. The agent calls this action with parameters (analysis text, action buttons), and the UI updates in place.

2. **`CopilotTask`** — fires automatically when `isDown` becomes true. Sends incident context as instructions to the agent. No chat input. No human in the loop for triggering.

3. **Agent decides the UI** — Gemini 2.0 Flash receives the incident data, analyzes root cause and impact, and calls `show-remediation` with tailored content. An OOM gets "Recover Memory" and "Redeploy" buttons. A connection timeout gets "Status Check" and "Restart." The interface is generated per-incident.

This is the key distinction: **the AI doesn't describe what to do — it creates the interface for doing it.** The dashboard is not a static page that an AI chats alongside. The dashboard *is* the AI's output.

## Project Structure

```
LiveOps/
├── index.html                        # Standalone prototype (no backend needed)
├── services/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.ts              # Express server, SSE, REST API, CopilotKit runtime
│   │   │   ├── railway.ts           # Railway GraphQL client
│   │   │   ├── types.ts             # TypeScript interfaces
│   │   │   ├── agent/
│   │   │   │   ├── index.ts          # Agent exports
│   │   │   │   └── prompts.ts        # System prompt for Gemini
│   │   │   └── lib/
│   │   │       └── incident-store.ts # In-memory incident history
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       │   ├── App.tsx               # Main app: CopilotKit, SSE, A2UI actions
│       │   ├── App.css               # Dashboard styles
│       │   ├── main.tsx              # Entry point
│       │   ├── lib/
│       │   │   └── copilotkit.ts     # CopilotKit config
│       │   ├── hooks/
│       │   │   ├── useSSE.ts         # Real-time incident stream
│       │   │   └── useServices.ts     # Service instance data
│       │   └── components/
│       │       ├── Sidebar.tsx
│       │       ├── NOCHeader.tsx
│       │       ├── StatusIndicator.tsx
│       │       ├── EmptyState.tsx
│       │       ├── IncidentBanner.tsx
│       │       ├── RemediationCard.tsx  # AI-generated remediation UI
│       │       ├── ApprovalCard.tsx
│       │       ├── FeedItem.tsx
│       │       ├── FooterStats.tsx
│       │       └── ServicesList.tsx
│       ├── index.html
│       ├── Dockerfile
│       ├── docker-entrypoint.sh
│       ├── nginx.conf
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
└── docs/
    └── superpowers/
        ├── specs/                     # Design documents
        └── plans/                     # Implementation plans
```

## License

MIT