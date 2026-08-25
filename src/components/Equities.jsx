import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Confirm Action</h3>
        <p>{message}</p>
        <div className="actions">
          <button className="btn btn-sm btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sm btn-danger" onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
}

export default function Equities({ onToast }) {
  const [equities, setEquities] = useState({});
  const [symbol, setSymbol] = useState('');
  const [levels, setLevels] = useState('');
  const [drawdown, setDrawdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const load = useCallback(async () => {
    try {
      setEquities(await api.getEquities());
    } catch { /* retry */ }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!symbol || !levels || !drawdown) return;
    setLoading(true);
    try {
      const res = await api.addEquity(symbol, parseInt(levels), parseFloat(drawdown));
      if (res.error) {
        onToast(res.error, 'error');
      } else {
        onToast(`${res.symbol} added successfully`, 'success');
        setSymbol('');
        setLevels('');
        setDrawdown('');
      }
      await load();
    } catch {
      onToast('Failed to add equity', 'error');
    }
    setLoading(false);
  }

  async function handleToggle(sym) {
    const res = await api.toggleEquity(sym);
    if (res.error) {
      onToast(res.error, 'error');
    } else {
      onToast(`${sym} ${res.status === 'on' ? 'activated' : 'paused'}`, 'success');
    }
    await load();
  }

  async function handleRemove(sym) {
    const res = await api.removeEquity(sym);
    if (res.error) {
      onToast(res.error, 'error');
    } else {
      onToast(`${sym} removed`, 'success');
    }
    setConfirmRemove(null);
    await load();
  }

  const entries = Object.entries(equities);

  return (
    <>
      {confirmRemove && (
        <ConfirmDialog
          message={`Remove ${confirmRemove} from your tracked equities? This cannot be undone.`}
          onConfirm={() => handleRemove(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}

      <div className="card">
        <div className="card-header">
          <h2>Add Equity</h2>
        </div>
        <div className="card-body">
          <form className="form-row" onSubmit={handleAdd}>
            <div className="form-group">
              <label>Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. AAPL"
                required
              />
            </div>
            <div className="form-group">
              <label>Levels</label>
              <input
                type="number"
                value={levels}
                onChange={(e) => setLevels(e.target.value)}
                placeholder="e.g. 5"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Drawdown %</label>
              <input
                type="number"
                value={drawdown}
                onChange={(e) => setDrawdown(e.target.value)}
                placeholder="e.g. 5"
                step="0.1"
                min="0.1"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Add Equity'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Tracked Equities</h2>
          {entries.length > 0 && <span className="card-header-badge">{entries.length} symbols</span>}
        </div>
        <div className="card-body" style={{ padding: entries.length === 0 ? undefined : 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Position</th>
                <th>Entry Price</th>
                <th>Drawdown</th>
                <th>Levels</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <span className="empty-state-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                    <span className="empty-state-text">No equities tracked yet. Use the form above to add your first symbol.</span>
                  </td>
                </tr>
              ) : (
                entries.map(([sym, data]) => (
                  <tr key={sym}>
                    <td>
                      <div className="symbol-cell">
                        <span className="symbol-dot" style={{ background: data.status === 'on' ? 'var(--green)' : 'var(--text-dim)' }} />
                        {sym}
                      </div>
                    </td>
                    <td>{data.position}</td>
                    <td>${parseFloat(data.entry_price).toFixed(2)}</td>
                    <td>{(data.drawdown * 100).toFixed(1)}%</td>
                    <td>
                      <div className="levels-list">
                        {Object.entries(data.levels).map(([lvl, price]) => {
                          const filled = parseInt(lvl) < 0;
                          return (
                            <span key={lvl} className={`level-chip ${filled ? 'filled' : ''}`}>
                              L{Math.abs(parseInt(lvl))}: ${price}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${data.status}`}>{data.status}</span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-sm btn-ghost" onClick={() => handleToggle(sym)}>
                          {data.status === 'on' ? 'Pause' : 'Activate'}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirmRemove(sym)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
