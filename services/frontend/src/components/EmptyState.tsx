export function EmptyState() {
  return <div className="empty-state">
    <div className="icon-circle">{'\u2661'}</div>
    <h3>All Systems Operational</h3>
    <p>No active incidents detected. Peace reigns in the NOC.</p>
  </div>;
}
