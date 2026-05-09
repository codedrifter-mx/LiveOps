import { useState } from 'react';
interface Props { actionName: string; description: string; onApprove: () => Promise<void>; onReject: () => void; }
export function ApprovalCard({ actionName, description, onApprove, onReject }: Props) {
  const [busy, setBusy] = useState(false);
  if (!actionName) return null;
  return <div className="approval-card">
    <div className="approval-label">Approval Required</div>
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
      <h3>{actionName}</h3>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lilac)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>
    <p>{description}</p>
    <div className="approval-actions">
      <button className="approve-btn" onClick={async()=>{setBusy(true);await onApprove();setBusy(false)}} disabled={busy}>Approve Action</button>
      <button className="reject-btn" onClick={onReject}>Reject</button>
    </div>
    <div className="approval-footer">Requires peer review</div>
  </div>;
}
