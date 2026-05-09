interface Props { connected: boolean; activeNav: string; }
export function Sidebar({ connected, activeNav }: Props) {
  const navItems = ['Dashboard', 'Incidents', 'Infrastructure', 'Settings'];
  const threads = [
    { type: 'Agent Thought Process', title: 'Keycloak OOM Analysis' },
    { type: 'Raw Logs', title: 'System Logs (node-4)' },
  ];
  return <aside className="sidebar">
    <div className="sidebar-brand">
      <div className="logo">LO</div>
      <h1>LiveOps</h1>
    </div>
    <nav className="sidebar-nav">
      {navItems.map(item => (
        <a key={item} className={item === activeNav ? 'active' : ''}>{item}</a>
      ))}
    </nav>
    <div className="sidebar-threads">
      <div className="label"><span>Active Threads</span><span className="count">{threads.length}</span></div>
      {threads.map((t, i) => (
        <div key={i} className="thread-item">
          <div className="type">{t.type}</div>
          <div className="title">{t.title}</div>
        </div>
      ))}
    </div>
    <div className="sidebar-status">
      <div><span className={`dot ${connected ? 'connected' : 'disconnected'}`} /><span>SSE {connected ? 'Connected' : 'Disconnected'}</span></div>
    </div>
  </aside>;
}
