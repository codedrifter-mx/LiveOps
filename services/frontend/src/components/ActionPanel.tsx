interface Props { isDown: boolean; onAction: (action: string) => void }
export function ActionPanel({ isDown, onAction }: Props) {
  if (!isDown) return null;
  return <div className="card"><h2>Remediation Actions</h2>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
      <button className="btn btn-success" onClick={()=>onAction('restart-keycloak')}>Restart Keycloak</button>
      <button className="btn btn-primary" onClick={()=>onAction('get-keycloak-status')}>Check Status</button>
    </div>
  </div>;
}
