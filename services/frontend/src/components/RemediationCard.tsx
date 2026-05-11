import { useState, useEffect } from 'react';

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

const SHOW_MORE_DELAY_MS = 5000;

export function RemediationCard({ analysis, buttons, onAction, loading, error }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showMoreLink, setShowMoreLink] = useState(false);

  useEffect(() => {
    if (buttons.length <= 1) return;
    const timer = setTimeout(() => setShowMoreLink(true), SHOW_MORE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [buttons.length]);

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

  const primaryButton = buttons[0];
  const extraButtons = buttons.slice(1);
  const showAll = expanded || buttons.length <= 1;

  return <div className="gen-card animate-in">
    <div className="gen-label">AI Analysis</div>
    <div className="remediation-text">{analysis}</div>
    <div className="action-grid" style={{marginTop:16}}>
      {primaryButton && (
        <button className={`action-btn ${primaryButton.variant}`} onClick={() => onAction(primaryButton.action)}>
          {primaryButton.label}
        </button>
      )}
    </div>
    {extraButtons.length > 0 && !showAll && showMoreLink && (
      <button className="see-more-btn" onClick={() => setExpanded(true)}>
        + See more options
      </button>
    )}
    {extraButtons.length > 0 && showAll && (
      <div className="action-grid" style={{marginTop:12}}>
        {extraButtons.map((btn, i) => (
          <button key={i} className={`action-btn ${btn.variant}`} onClick={() => onAction(btn.action)}>
            {btn.label}
          </button>
        ))}
      </div>
    )}
  </div>;
}
