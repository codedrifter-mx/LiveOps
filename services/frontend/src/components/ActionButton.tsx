interface Props { label: string; variant?: 'lilac' | 'mint' | 'blue' | 'outline'; onClick: () => void; }
export function ActionButton({ label, variant = 'lilac', onClick }: Props) {
  return <button className={`action-btn ${variant}`} onClick={onClick}>{label}</button>;
}
