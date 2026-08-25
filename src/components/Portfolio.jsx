import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Portfolio() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    loadPortfolio();
    const interval = setInterval(loadPortfolio, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadPortfolio() {
    try {
      setPositions(await api.getPortfolio());
    } catch { /* retry */ }
  }

  const fmt = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? '--' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const plNum = (v) => parseFloat(v) || 0;

  const totalPL = positions.reduce((sum, p) => sum + plNum(p.unrealized_pl), 0);
  const totalValue = positions.reduce((sum, p) => sum + plNum(p.current_price) * plNum(p.qty), 0);

  return (
    <>
      {positions.length > 0 && (
        <div className="portfolio-summary">
          <div className="portfolio-summary-item">
            <div className="label">Positions</div>
            <div className="value">{positions.length}</div>
          </div>
          <div className="portfolio-summary-item">
            <div className="label">Total Value</div>
            <div className="value">{fmt(totalValue)}</div>
          </div>
          <div className="portfolio-summary-item">
            <div className="label">Total Unrealized P/L</div>
            <div className="value" style={{ color: totalPL >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {totalPL >= 0 ? '+' : ''}{fmt(totalPL)}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Live Positions</h2>
          {positions.length > 0 && <span className="card-header-badge">{positions.length} holdings</span>}
        </div>
        <div className="card-body" style={{ padding: positions.length === 0 ? undefined : 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Entry Price</th>
                <th>Current Price</th>
                <th>Unrealized P/L</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    <span className="empty-state-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                      </svg>
                    </span>
                    <span className="empty-state-text">No open positions. Your portfolio is empty — start trading to see positions here.</span>
                  </td>
                </tr>
              ) : (
                positions.map((p, i) => {
                  const pl = plNum(p.unrealized_pl);
                  const positive = pl >= 0;
                  return (
                    <tr key={i}>
                      <td>
                        <div className="symbol-cell">
                          <span className="symbol-dot" style={{ background: positive ? 'var(--green)' : 'var(--red)' }} />
                          {p.symbol}
                        </div>
                      </td>
                      <td>{p.qty}</td>
                      <td>{fmt(p.entry_price)}</td>
                      <td>{fmt(p.current_price)}</td>
                      <td>
                        <span className={`pl-badge ${positive ? 'positive' : 'negative'}`}>
                          {positive ? '+' : ''}{fmt(p.unrealized_pl)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
