interface Props { incident: { service: string; status: string; errorRate?: string; impactedUsers?: number; timestamp: string; lastHealthy?: string } | null }
export function DynamicDashboard({ incident }: Props) {
  if (!incident) return <div className="gen-card"><div className="gen-label">No active incident</div></div>;
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
