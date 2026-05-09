import express from 'express';
import cors from 'cors';
import { IncidentEvent, ServiceStatus } from './types';
import { getKeycloakStatus, restoreJavaOpts, redeployService, recoverAndRedeploy, getLatestDeploymentId, getEnvironmentServices, crashKeycloakWithOom } from './railway';
import { SYSTEM_PROMPT } from './agent';
import { addIncident, getAllIncidents, getIncident } from './lib/incident-store';
import { CopilotRuntime, GoogleGenerativeAIAdapter, copilotRuntimeNodeExpressEndpoint } from '@copilotkit/runtime';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const KEYCLOAK_HEALTH_URL = process.env.KEYCLOAK_HEALTH_URL || 'http://localhost:8080/health/ready';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);
const FAILURE_THRESHOLD = parseInt(process.env.FAILURE_THRESHOLD || '3', 10);

app.use(cors());
app.use(express.json());

// --- SSE ---
const sseClients: Set<express.Response> = new Set();
function broadcastSSE(event: IncidentEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const c of sseClients) c.write(data);
}

app.get('/api/events/stream', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
  if (currentIncident) res.write(`data: ${JSON.stringify(currentIncident)}\n\n`);
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
});

// --- Status ---
let currentIncident: IncidentEvent | null = null;
let serviceStatus: ServiceStatus = { service: 'keycloak', status: 'healthy', lastChecked: new Date().toISOString(), consecutiveFailures: 0, consecutiveSuccesses: 0 };

app.get('/api/status', (_, res) => res.json({ status: serviceStatus, currentIncident }));
app.get('/api/health', (_, res) => res.json({ status: 'UP', timestamp: new Date().toISOString() }));
app.get('/api/debug', async (_, res) => {
  try {
    const id = await getLatestDeploymentId();
    res.json({ deploymentId: id, projectId: process.env.RAILWAY_PROJECT_ID || '(not set)', serviceId: process.env.RAILWAY_KEYCLOAK_SERVICE_ID || '(not set)', environmentId: process.env.RAILWAY_KEYCLOAK_ENVIRONMENT_ID || '(not set)', hasToken: !!process.env.RAILWAY_API_TOKEN });
  } catch (e: any) { res.json({ error: e.message, stack: e.stack }); }
});

// --- Demo Controls ---
app.post('/api/crash-keycloak', async (_, res) => { try { res.json(await crashKeycloakWithOom()); } catch (e: any) { res.status(500).json({ success: false, message: e.message }); } });
app.post('/api/redeploy-keycloak', async (_, res) => { try { res.json(await redeployService()); } catch (e: any) { res.status(500).json({ success: false, message: e.message }); } });
app.post('/api/recover-memory', async (_, res) => { try { res.json(await recoverAndRedeploy()); } catch (e: any) { res.status(500).json({ success: false, message: e.message }); } });
app.post('/api/restore-java-opts', async (_, res) => { try { res.json(await restoreJavaOpts()); } catch (e: any) { res.status(500).json({ success: false, message: e.message }); } });
app.all('/api/railway-status', async (_, res) => { try { res.json(await getKeycloakStatus()); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get('/api/services', async (_, res) => {
  try { res.json(await getEnvironmentServices()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- Incident Store ---
app.get('/api/incidents', (_, res) => res.json(getAllIncidents()));
app.get('/api/incidents/:id', (req, res) => { const i = getIncident(req.params.id); i ? res.json(i) : res.status(404).json({ error: 'Not found' }); });

// --- CopilotKit v1.57.1 Runtime ---
const runtime = new CopilotRuntime({
  actions: [
    {
      name: 'redeploy-keycloak',
      description: 'Redeploy Keycloak service on Railway',
      handler: async () => (await redeployService()).message,
    },
    {
      name: 'recover-keycloak',
      description: 'Restore JAVA_OPTS memory and redeploy Keycloak',
      handler: async () => (await recoverAndRedeploy()).message,
    },
    {
      name: 'get-keycloak-status',
      description: 'Check Keycloak deployment status on Railway',
      handler: async () => JSON.stringify(await getKeycloakStatus()),
    },
  ],
});
if (process.env.GOOGLE_API_KEY) {
  console.log('[liveops] GOOGLE_API_KEY detected, registering CopilotKit endpoint...');
  try {
    const adapter = new GoogleGenerativeAIAdapter({ model: 'gemini-2.0-flash', apiKey: process.env.GOOGLE_API_KEY });
    app.use('/api/copilotkit', copilotRuntimeNodeExpressEndpoint({ runtime, serviceAdapter: adapter, endpoint: '/api/copilotkit' }));
    console.log('[liveops] CopilotKit endpoint registered at /api/copilotkit');
  } catch (e: any) {
    console.error('[liveops] Failed to register CopilotKit endpoint:', e.message);
  }
} else {
  console.warn('[liveops] GOOGLE_API_KEY not set — CopilotKit endpoint disabled');
}

// --- Health Poller ---
let lastHealthyTime: string | null = null;
async function checkHealth(): Promise<boolean> {
  try { const r = await fetch(KEYCLOAK_HEALTH_URL, { signal: AbortSignal.timeout(3000) }); return r.ok; }
  catch { return false; }
}
function startHealthPoller(): void {
  console.log(`[liveops] Poller: interval=${POLL_INTERVAL_MS}ms threshold=${FAILURE_THRESHOLD} url=${KEYCLOAK_HEALTH_URL}`);
  setInterval(async () => {
    const healthy = await checkHealth();
    serviceStatus.lastChecked = new Date().toISOString();
    if (healthy) {
      serviceStatus.consecutiveFailures = 0; serviceStatus.consecutiveSuccesses++;
      lastHealthyTime = new Date().toISOString();
      if (serviceStatus.status === 'down' && serviceStatus.consecutiveSuccesses >= FAILURE_THRESHOLD) {
        console.log('[liveops] Keycloak recovered!');
        serviceStatus.status = 'healthy'; serviceStatus.consecutiveSuccesses = 0;
        const e: IncidentEvent = { id: `rec-${Date.now()}`, type: 'recovery', service: 'keycloak', status: 'healthy', timestamp: new Date().toISOString() };
        currentIncident = e; addIncident(e); broadcastSSE(e);
      }
    } else {
      serviceStatus.consecutiveSuccesses = 0; serviceStatus.consecutiveFailures++;
      if (serviceStatus.status === 'healthy' && serviceStatus.consecutiveFailures >= FAILURE_THRESHOLD) {
        console.log('[liveops] Keycloak is DOWN!');
        serviceStatus.status = 'down';
        const e: IncidentEvent = { id: `inc-${Date.now()}`, type: 'incident', service: 'keycloak', status: 'down', errorRate: '100%', impactedUsers: 15, timestamp: new Date().toISOString(), lastHealthy: lastHealthyTime || undefined };
        currentIncident = e; addIncident(e); broadcastSSE(e);
      }
    }
  }, POLL_INTERVAL_MS);
}

app.listen(PORT, () => { console.log(`[liveops] Server on port ${PORT}`); startHealthPoller(); });
