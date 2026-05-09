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
