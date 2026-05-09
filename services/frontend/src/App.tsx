import { useState, useEffect } from 'react';
import { CopilotKit, useCopilotAction, CopilotTask, useCopilotContext } from '@copilotkit/react-core';
import { useSSE, IncidentEvent } from './hooks/useSSE';
import { COPILOTKIT_CONFIG } from './lib/copilotkit';
import { Sidebar } from './components/Sidebar';
import { NOCHeader } from './components/NOCHeader';
import { EmptyState } from './components/EmptyState';
import { IncidentBanner } from './components/IncidentBanner';
import { ApprovalCard } from './components/ApprovalCard';
import { FeedItem } from './components/FeedItem';
import { FooterStats } from './components/FooterStats';
import { RemediationCard } from './components/RemediationCard';
import './App.css';

const BACKEND_URL = (window as any).__BACKEND_URL__ || '';

function Dashboard() {
  const { lastEvent, connected } = useSSE();
  const [incidents, setIncidents] = useState<IncidentEvent[]>([]);
  const [isDown, setIsDown] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<IncidentEvent | null>(null);
  const [pendingAction, setPendingAction] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const [acknowledged, setAcknowledged] = useState(false);
  const context = useCopilotContext();
  const [remediationData, setRemediationData] = useState<{ analysis: string; buttons: any[] } | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  useEffect(() => {
    if (lastEvent) {
      setIncidents(prev => [lastEvent, ...prev].slice(0, 20));
      setIsDown(lastEvent.type === 'incident');
      setCurrentIncident(lastEvent);
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

  useEffect(() => {
    if (!isDown || !currentIncident) return;
    setAgentLoading(true);
    setAgentError(null);
    setRemediationData(null);
    const task = new CopilotTask({
      instructions: `[INCIDENT ALERT] Keycloak is DOWN.
Error rate: ${currentIncident.errorRate || 'N/A'}
Impacted users: ${currentIncident.impactedUsers || 'N/A'}
Last healthy: ${currentIncident.lastHealthy || 'N/A'}

Analyze the situation and call show-remediation with your analysis and recommended action buttons.`
    });
    task.run(context).catch((err: any) => {
      setAgentError(err.message || 'Agent analysis failed');
      setAgentLoading(false);
    });
  }, [isDown]);

  useCopilotAction({
    name: 'show-remediation',
    handler: (args) => {
      setRemediationData({ analysis: args.analysis, buttons: args.buttons });
      setAgentLoading(false);
    },
    parameters: [
      { name: 'analysis', type: 'string', description: 'AI analysis', required: true },
      { name: 'buttons', type: 'object[]', description: 'Action buttons', required: true, attributes: [
        { name: 'label', type: 'string' },
        { name: 'action', type: 'string', enum: ['redeploy-keycloak', 'recover-keycloak', 'get-keycloak-status'] },
        { name: 'variant', type: 'string', enum: ['lilac', 'mint', 'blue', 'outline'] },
      ]},
    ],
  });

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
    <div className="layout">
      <Sidebar connected={connected} activeNav="Dashboard" />
      <div className="main">
        <NOCHeader status={status} />
        <div className="content">
          {isDown && !acknowledged && <IncidentBanner onAcknowledge={() => setAcknowledged(true)} />}

                      {!isDown ? (
            <EmptyState onCrash={async () => {
              try { await fetch(BACKEND_URL + '/api/crash-keycloak', { method: 'POST' }); } catch {}
            }} />
          ) : (
            <div className="dashboard-grid">
              <div className="" style={{display:'flex',flexDirection:'column',gap:24}}>
                <RemediationCard
                  analysis={remediationData?.analysis || ''}
                  buttons={remediationData?.buttons || []}
                  onAction={(action) => setPendingAction(action)}
                  loading={agentLoading}
                  error={agentError}
                />

                <ApprovalCard
                  actionName={pendingAction === 'redeploy-keycloak' ? 'Redeploy Keycloak' : pendingAction === 'recover-keycloak' ? 'Recover Keycloak Memory' : pendingAction === 'get-keycloak-status' ? 'Check Keycloak Status' : ''}
                  description={pendingAction ? `Execute ${pendingAction} on Keycloak via Railway API` : ''}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />

                {result && <div className="result-box">{result}</div>}
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

              </div>
            </div>
          )}

          <FooterStats />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <CopilotKit runtimeUrl={COPILOTKIT_CONFIG.runtimeUrl}>
      <Dashboard />
    </CopilotKit>
  );
}
export default App;
