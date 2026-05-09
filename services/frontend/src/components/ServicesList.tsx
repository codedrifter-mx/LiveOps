import { ServiceInfo } from '../hooks/useServices';

interface Props {
  services: ServiceInfo[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

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
