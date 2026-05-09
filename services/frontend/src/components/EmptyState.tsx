interface Props { onCrash?: () => void; }
export function EmptyState({ onCrash }: Props) {
  return <div className="empty-state">
    <div className="icon-circle">{'\u2661'}</div>
    <h3>All Systems Operational</h3>
    <p>No active incidents detected. Peace reigns in the NOC.</p>
    {onCrash && <button className="simulate-link" onClick={onCrash}>Crash Keycloak Intentionally</button>}
  </div>;
}
