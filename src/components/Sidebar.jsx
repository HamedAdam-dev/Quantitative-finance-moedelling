const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        id: 'portfolio',
        label: 'Portfolio',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12V7H5a2 2 0 010-4h14v4" />
            <path d="M3 5v14a2 2 0 002 2h16v-5" />
            <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Trading',
    items: [
      {
        id: 'equities',
        label: 'Equities',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        id: 'models',
        label: 'Models',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      {
        id: 'ai-chat',
        label: 'AI Advisor',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar({ active, onNavigate, engineRunning, onEngineToggle }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">AI</div>
        <span>Trading Bot</span>
      </div>

      <nav>
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="engine-controls">
        <div className="engine-status">
          <span className={`status-dot ${engineRunning ? 'on' : ''}`} />
          <span>{engineRunning ? 'Engine Running' : 'Engine Stopped'}</span>
        </div>
        {engineRunning ? (
          <button className="btn btn-sm btn-danger" style={{ width: '100%' }} onClick={() => onEngineToggle(false)}>
            Stop Engine
          </button>
        ) : (
          <button className="btn btn-sm btn-success" style={{ width: '100%' }} onClick={() => onEngineToggle(true)}>
            Start Engine
          </button>
        )}
      </div>
    </aside>
  );
}
