interface Props { onAcknowledge: () => void; }
export function IncidentBanner({ onAcknowledge }: Props) {
  return <div className="incident-banner animate-in">
    <div className="incident-banner-left">
      <div className="incident-banner-icon">{'\u26A0'}</div>
      <div>
        <h3>Keycloak Service Down</h3>
        <p>Critical impact detected in Auth layer</p>
      </div>
    </div>
    <button className="ack-btn" onClick={onAcknowledge}>Acknowledge</button>
  </div>;
}
