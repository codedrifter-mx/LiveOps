import { useState, useEffect } from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { useSSE, IncidentEvent } from './hooks/useSSE';
import { COPILOTKIT_CONFIG } from './lib/copilotkit';
import { DynamicDashboard } from './components/DynamicDashboard';
import { ActionPanel } from './components/ActionPanel';
import { ApprovalFlow } from './components/ApprovalFlow';
import { useServices } from './hooks/useServices';
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

  useEffect(() => {
    if (lastEvent) {
      setIncidents(prev => [lastEvent, ...prev].slice(0, 20));
      setIsDown(lastEvent.type === 'incident');
      setCurrentIncident(lastEvent);
      setRefreshTick(t => t + 1);
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

  const handleAction = (action: string) => setPendingAction(action);

  const handleApprove = async () => {
    const ep = pendingAction === 'redeploy-keycloak' ? 'redeploy-keycloak' : pendingAction === 'recover-keycloak' ? 'recover-memory' : pendingAction === 'get-keycloak-status' ? 'railway-status' : pendingAction;
    try { const r = await fetch(`${BACKEND_URL}/api/${ep}`, { method: 'POST' }); setResult(JSON.stringify(await r.json(), null, 2)); }
    catch (err: any) { setResult(`Error: ${err.message}`); }
    setPendingAction('');
  };

  const handleReject = () => setPendingAction('');
  const handleDismiss = () => setPendingAction('');

  return (
    <CopilotKit runtimeUrl={COPILOTKIT_CONFIG.runtimeUrl}>
      <div className="app">
        <header className="header">
          <h1>LiveOps</h1>
          <div className="connection"><span className={`dot ${connected ? 'connected' : 'disconnected'}`} />{connected ? 'Connected' : 'Disconnected'}</div>
        </header>
        <div className="card"><h2>Service Status</h2>
          <div className="status-row"><span className={`dot ${isDown ? 'down' : 'healthy'}`} /><span>Keycloak: {isDown ? 'DOWN' : 'Healthy'}</span></div>
        </div>
        {isDown && <DynamicDashboard incident={currentIncident} />}
        {isDown && <ActionPanel isDown={isDown} onAction={handleAction} />}
        <ApprovalFlow actionName={pendingAction} description={`Execute ${pendingAction} on Keycloak via Railway API`} onApprove={handleApprove} onReject={handleReject} onDismiss={handleDismiss} />
        <div className="card"><h2>Controls</h2>
          <div className="actions">
            <button className="btn btn-success" onClick={async()=>{const r=await fetch(BACKEND_URL+'/api/recover-memory',{method:'POST'});setResult(JSON.stringify(await r.json(),null,2))}}>Recover Memory</button>
            <button className="btn btn-primary" onClick={async()=>{const r=await fetch(BACKEND_URL+'/api/redeploy-keycloak',{method:'POST'});setResult(JSON.stringify(await r.json(),null,2))}}>Redeploy</button>
          </div>
          {result && <div className="result-box">{result}</div>}
        </div>
        <CopilotSidebar defaultOpen={false} labels={{ title: 'LiveOps Agent', initial: 'Ask me about incidents or remediation.' }} />
        <ServicesList services={services} loading={svcLoading} error={svcError} onRetry={refetchServices} />
        <div className="card"><h2>Incident Feed</h2>
          {incidents.length === 0 ? <div className="empty-state"><div className="icon">&#128154;</div><p>All systems operational</p></div> :
            <ul className="incident-list">{incidents.map(inc => (
              <li key={inc.id} className={`incident-item ${inc.type}`}>
                <div className="incident-service">{inc.service} — {inc.status === 'down' ? 'DOWN' : 'Healthy'}</div>
                <div className="incident-status">{inc.type === 'incident' ? `Error rate: ${inc.errorRate || '100%'}, ${inc.impactedUsers || 15} users` : 'Service recovered'}</div>
                <div className="incident-time">{new Date(inc.timestamp).toLocaleString()}</div>
              </li>
            ))}</ul>}
        </div>
      </div>
    </CopilotKit>
  );
}
export default App;
