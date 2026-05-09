interface Props { onSimulate: () => void; }
export function EmptyState({ onSimulate }: Props) {
  return <div className="empty-state">
    <div className="icon-circle">{'\u2661'}</div>
    <h3>All Systems Operational</h3>
    <p>No active incidents detected. Peace reigns in the NOC.</p>
    <button className="simulate-link" onClick={onSimulate}>Simulate Incident</button>
  </div>;
}
