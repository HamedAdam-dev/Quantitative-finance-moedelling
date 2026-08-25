import { useState, useEffect } from 'react';
import { api } from '../api';

function StatIcon({ type }) {
  if (type === 'portfolio')
    return (
      <div className="stat-icon blue">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      </div>
    );
  if (type === 'cash')
    return (
      <div className="stat-icon green">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      </div>
    );
  if (type === 'power')
    return (
      <div className="stat-icon purple">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
    );
  return (
    <div className="stat-icon yellow">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [orders, setOrders] = useState([]);
  const [equities, setEquities] = useState({});
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [acct, ord, eq, eng] = await Promise.all([
        api.getAccount(),
        api.getOrders(),
        api.getEquities(),
        api.getEngineStatus(),
      ]);
      setAccount(acct);
      setOrders(ord);
      setEquities(eq);
      setLogs(eng.logs || []);
    } catch {
      /* retry on next interval */
    }
  }

  const fmt = (v) => {
    if (v === undefined || v === null || v === 'N/A') return '--';
    const n = parseFloat(v);
    return isNaN(n) ? v : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const equityCount = Object.keys(equities).length;
  const activeCount = Object.values(equities).filter((e) => e.status === 'on').length;

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <StatIcon type="portfolio" />
          <div className="stat-label">Portfolio Value</div>
          <div className="stat-value">{fmt(account?.portfolio_value)}</div>
          <div className="stat-sub">Total account equity</div>
        </div>
        <div className="stat-card">
          <StatIcon type="cash" />
          <div className="stat-label">Cash</div>
          <div className="stat-value">{fmt(account?.cash)}</div>
          <div className="stat-sub">Available settled cash</div>
        </div>
        <div className="stat-card">
          <StatIcon type="power" />
          <div className="stat-label">Buying Power</div>
          <div className="stat-value">{fmt(account?.buying_power)}</div>
          <div className="stat-sub">Margin-adjusted</div>
        </div>
        <div className="stat-card">
          <StatIcon type="activity" />
          <div className="stat-label">Tracked / Active</div>
          <div className="stat-value">
            {equityCount}
            <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}> / {activeCount} on</span>
          </div>
          <div className="stat-sub">{orders.length} open order{orders.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Open Orders</h2>
          <span className="card-header-badge">{orders.length}</span>
        </div>
        <div className="card-body" style={{ padding: orders.length === 0 ? undefined : 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Limit Price</th>
                <th>Side</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-state">
                    <span className="empty-state-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                        <rect x="9" y="3" width="6" height="4" rx="1" />
                      </svg>
                    </span>
                    <span className="empty-state-text">No open orders right now. Start the engine or add equities to begin trading.</span>
                  </td>
                </tr>
              ) : (
                orders.map((o, i) => (
                  <tr key={i}>
                    <td>
                      <div className="symbol-cell">
                        <span className="symbol-dot" />
                        {o.symbol}
                      </div>
                    </td>
                    <td>{o.qty}</td>
                    <td>{fmt(o.limit_price)}</td>
                    <td>
                      <span className={`pl-badge ${o.side === 'buy' ? 'positive' : 'negative'}`}>
                        {o.side?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Engine Logs</h2>
          <span className="card-header-badge">{logs.length} entries</span>
        </div>
        <div className="card-body">
          <div className="log-area">
            {logs.length === 0 ? 'Waiting for engine activity...' : logs.join('\n')}
          </div>
        </div>
      </div>
    </>
  );
}
