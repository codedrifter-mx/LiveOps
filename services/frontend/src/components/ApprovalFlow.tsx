import { useState } from 'react';
interface Props { actionName: string; description: string; onApprove: () => Promise<void>; onReject: () => void; onDismiss: () => void }
export function ApprovalFlow({ actionName, description, onApprove, onReject, onDismiss }: Props) {
  const [busy, setBusy] = useState(false);
  if (!actionName) return null;
  return <div className="card" style={{border:'1px solid var(--accent-yellow)'}}><h2>Approval Required</h2>
    <div style={{background:'var(--bg-tertiary)',padding:12,borderRadius:8,margin:'8px 0'}}>
      <p><strong>Action:</strong> {actionName}</p>
      <p>{description}</p>
      <p style={{marginTop:8,fontSize:13,color:'var(--accent-yellow)'}}>Review and approve to execute.</p>
    </div>
    <div style={{display:'flex',gap:8}}>
      <button className="btn btn-success" onClick={async()=>{setBusy(true);await onApprove();setBusy(false)}} disabled={busy}>Approve</button>
      <button className="btn btn-danger" onClick={onReject}>Reject</button>
      <button className="btn" onClick={onDismiss} style={{background:'var(--bg-tertiary)',color:'var(--text-secondary)'}}>Dismiss</button>
    </div>
  </div>;
}
