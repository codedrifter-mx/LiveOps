import { StatusIndicator } from './StatusIndicator';
interface Props { status: 'healthy' | 'incident' | 'offline'; }
export function NOCHeader({ status }: Props) {
  return <header className="header">
    <div className="header-left">
      <h2>NOC Overview</h2>
      <StatusIndicator status={status} />
    </div>
    <div className="header-right">
      <div className="avatar-stack">
        <div>JD</div><div>AK</div><div>ML</div>
      </div>
      <div className="header-divider" />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    </div>
  </header>;
}
