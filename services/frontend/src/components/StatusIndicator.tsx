interface Props { status: 'healthy' | 'incident' | 'offline' }
export function StatusIndicator({ status }: Props) {
  const dots = { healthy: 'healthy', incident: 'incident', offline: 'disconnected' };
  const labels = { healthy: 'System Operational', incident: 'Incident Active', offline: 'Disconnected' };
  return <div className="badge"><span className={`dot ${dots[status]}`} /><span>{labels[status]}</span></div>;
}
