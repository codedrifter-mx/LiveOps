interface Props { incident: { service: string; status: string; errorRate?: string; impactedUsers?: number; timestamp: string; lastHealthy?: string } | null }
export function DynamicDashboard({ incident }: Props) {
  if (!incident) return <div className="card" style={{textAlign:'center',padding:32,color:'var(--text-secondary)'}}>No active incident</div>;
  const box = (label: string, val: string) => <div style={{background:'var(--bg-tertiary)',padding:16,borderRadius:8}}><div style={{fontSize:12,color:'var(--text-secondary)'}}>{label}</div><div style={{fontSize:18,fontWeight:700}}>{val}</div></div>;
  return <div className="card"><h2>Incident Dashboard</h2>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
      {box('Service', incident.service)}
      {box('Status', incident.status.toUpperCase())}
      {box('Error Rate', incident.errorRate || 'N/A')}
      {box('Impacted', `${incident.impactedUsers || 'N/A'} users`)}
    </div>
    <div style={{marginTop:12,fontSize:13,color:'var(--text-secondary)'}}>
      Detected: {new Date(incident.timestamp).toLocaleString()}
      {incident.lastHealthy && ` | Last healthy: ${new Date(incident.lastHealthy).toLocaleString()}`}
    </div>
  </div>;
}
