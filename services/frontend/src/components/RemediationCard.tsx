interface RemediationButton {
  label: string;
  action: string;
  variant: string;
}

interface Props {
  analysis: string;
  buttons: RemediationButton[];
  onAction: (action: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function RemediationCard({ analysis, buttons, onAction, loading, error }: Props) {
  if (error) {
    return <div className="gen-card">
      <div className="gen-label">AI Analysis</div>
      <div style={{fontSize:13,color:'var(--red)',marginTop:8}}>{error}</div>
    </div>;
  }

  if (loading) {
    return <div className="gen-card" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,minHeight:120,justifyContent:'center'}}>
      <div className="spinner" />
      <div className="gen-label" style={{marginBottom:0}}>Agent analyzing...</div>
    </div>;
  }

  if (!analysis && buttons.length === 0) return null;

  return <div className="gen-card animate-in">
    <div className="gen-label">AI Analysis</div>
    <div className="remediation-text">{analysis}</div>
    <div className="action-grid" style={{marginTop:16}}>
      {buttons.map((btn, i) => (
        <button key={i} className={`action-btn ${btn.variant}`} onClick={() => onAction(btn.action)}>
          {btn.label}
        </button>
      ))}
    </div>
  </div>;
}
