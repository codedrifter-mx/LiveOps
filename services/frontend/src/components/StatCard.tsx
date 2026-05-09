interface Props { label: string; value: string; trend?: string; color?: string; }
export function StatCard({ label, value, trend, color = 'lilac' }: Props) {
  return <div className="stat-card">
    <div className="stat-label"><span>{label}</span><div className={`color-dot ${color}`} /></div>
    <div className="stat-value">{value}</div>
    {trend && <div className="stat-trend">{trend}</div>}
  </div>;
}
