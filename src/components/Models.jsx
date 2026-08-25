import { useState } from 'react';
import { api } from '../api';

const MODELS = [
  { id: 'monte-carlo', label: 'Monte Carlo' },
  { id: 'gbm', label: 'Brownian Motion' },
  { id: 'black-scholes', label: 'Black-Scholes' },
  { id: 'pca', label: 'PCA Analysis' },
];

function StatRow({ label, value }) {
  return (
    <div className="model-stat-row">
      <span className="model-stat-label">{label}</span>
      <span className="model-stat-value">{value}</span>
    </div>
  );
}

function GreeksTable({ greeks }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Greek</th>
          <th>Call</th>
          <th>Put</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Delta</td><td>{greeks.call_delta}</td><td>{greeks.put_delta}</td></tr>
        <tr><td>Gamma</td><td colSpan="2" style={{ textAlign: 'center' }}>{greeks.gamma}</td></tr>
        <tr><td>Vega</td><td colSpan="2" style={{ textAlign: 'center' }}>{greeks.vega}</td></tr>
        <tr><td>Theta</td><td>{greeks.call_theta}</td><td>{greeks.put_theta}</td></tr>
      </tbody>
    </table>
  );
}

// ── Monte Carlo Form ──
function MonteCarloForm({ onRun, loading }) {
  const [symbols, setSymbols] = useState('AAPL, MSFT, TSLA');
  const [numSims, setNumSims] = useState('200');
  const [days, setDays] = useState('100');
  const [initialValue, setInitialValue] = useState('10000');

  return (
    <form className="form-row" onSubmit={(e) => { e.preventDefault(); onRun({ symbols, num_sims: numSims, days, initial_value: initialValue }); }}>
      <div className="form-group">
        <label>Symbols (comma-sep)</label>
        <input value={symbols} onChange={(e) => setSymbols(e.target.value)} style={{ minWidth: 200 }} />
      </div>
      <div className="form-group">
        <label>Simulations</label>
        <input type="number" value={numSims} onChange={(e) => setNumSims(e.target.value)} min="10" max="1000" />
      </div>
      <div className="form-group">
        <label>Days Forward</label>
        <input type="number" value={days} onChange={(e) => setDays(e.target.value)} min="5" max="500" />
      </div>
      <div className="form-group">
        <label>Initial Value ($)</label>
        <input type="number" value={initialValue} onChange={(e) => setInitialValue(e.target.value)} min="100" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <span className="spinner" /> : 'Run Simulation'}
      </button>
    </form>
  );
}

// ── GBM Form ──
function GBMForm({ onRun, loading }) {
  const [symbol, setSymbol] = useState('AAPL');
  const [drift, setDrift] = useState('0.05');
  const [vol, setVol] = useState('0.2');
  const [steps, setSteps] = useState('252');
  const [timeH, setTimeH] = useState('1.0');
  const [paths, setPaths] = useState('50');

  return (
    <form className="form-row" onSubmit={(e) => { e.preventDefault(); onRun({ symbol, drift, volatility: vol, steps, time_horizon: timeH, num_paths: paths }); }}>
      <div className="form-group">
        <label>Symbol</label>
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
      </div>
      <div className="form-group">
        <label>Drift (mu)</label>
        <input type="number" value={drift} onChange={(e) => setDrift(e.target.value)} step="0.01" />
      </div>
      <div className="form-group">
        <label>Volatility (sigma)</label>
        <input type="number" value={vol} onChange={(e) => setVol(e.target.value)} step="0.01" />
      </div>
      <div className="form-group">
        <label>Steps</label>
        <input type="number" value={steps} onChange={(e) => setSteps(e.target.value)} min="10" />
      </div>
      <div className="form-group">
        <label>Time Horizon (yrs)</label>
        <input type="number" value={timeH} onChange={(e) => setTimeH(e.target.value)} step="0.1" min="0.1" />
      </div>
      <div className="form-group">
        <label>Paths</label>
        <input type="number" value={paths} onChange={(e) => setPaths(e.target.value)} min="1" max="500" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <span className="spinner" /> : 'Run GBM'}
      </button>
    </form>
  );
}

// ── Black-Scholes Form ──
function BlackScholesForm({ onRun, loading }) {
  const [symbol, setSymbol] = useState('AAPL');
  const [strike, setStrike] = useState('150');
  const [expiry, setExpiry] = useState('1.0');
  const [rate, setRate] = useState('0.05');
  const [vol, setVol] = useState('');

  return (
    <form className="form-row" onSubmit={(e) => { e.preventDefault(); onRun({ symbol, strike, time_to_expiry: expiry, risk_free_rate: rate, volatility: vol || null }); }}>
      <div className="form-group">
        <label>Symbol</label>
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
      </div>
      <div className="form-group">
        <label>Strike Price ($)</label>
        <input type="number" value={strike} onChange={(e) => setStrike(e.target.value)} step="1" min="1" />
      </div>
      <div className="form-group">
        <label>Time to Expiry (yrs)</label>
        <input type="number" value={expiry} onChange={(e) => setExpiry(e.target.value)} step="0.1" min="0.01" />
      </div>
      <div className="form-group">
        <label>Risk-Free Rate</label>
        <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} step="0.01" />
      </div>
      <div className="form-group">
        <label>Vol (blank=auto)</label>
        <input type="number" value={vol} onChange={(e) => setVol(e.target.value)} step="0.01" placeholder="auto" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <span className="spinner" /> : 'Price Options'}
      </button>
    </form>
  );
}

// ── PCA Form ──
function PCAForm({ onRun, loading }) {
  const [symbols, setSymbols] = useState('AAPL, MSFT, TSLA, AMZN, GOOG');
  const [components, setComponents] = useState('3');
  const [lookback, setLookback] = useState('365');

  return (
    <form className="form-row" onSubmit={(e) => { e.preventDefault(); onRun({ symbols, n_components: components, lookback_days: lookback }); }}>
      <div className="form-group">
        <label>Symbols (comma-sep)</label>
        <input value={symbols} onChange={(e) => setSymbols(e.target.value)} style={{ minWidth: 260 }} />
      </div>
      <div className="form-group">
        <label>Components</label>
        <input type="number" value={components} onChange={(e) => setComponents(e.target.value)} min="1" max="10" />
      </div>
      <div className="form-group">
        <label>Lookback (days)</label>
        <input type="number" value={lookback} onChange={(e) => setLookback(e.target.value)} min="30" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <span className="spinner" /> : 'Run PCA'}
      </button>
    </form>
  );
}

// ── Results Display ──
function ResultsPanel({ result, modelId }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="card" style={{ borderColor: 'var(--red)' }}>
        <div className="card-body" style={{ color: 'var(--red)' }}>Error: {result.error}</div>
      </div>
    );
  }

  const { stats } = result;

  return (
    <div className="model-results">
      {result.image && (
        <div className="card">
          <div className="card-header"><h2>Chart</h2></div>
          <div className="card-body" style={{ padding: 0, background: '#131720' }}>
            <img src={`data:image/png;base64,${result.image}`} alt="Model output" className="model-chart-img" />
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>Results</h2></div>
        <div className="card-body">
          {modelId === 'monte-carlo' && stats && (
            <div className="model-stats-grid">
              <div className="model-stats-col">
                <h3>Portfolio Simulation</h3>
                <StatRow label="Symbols" value={stats.symbols?.join(', ')} />
                <StatRow label="Simulations" value={stats.num_sims} />
                <StatRow label="Days" value={stats.days} />
                <StatRow label="Initial Value" value={`$${stats.initial_value?.toLocaleString()}`} />
              </div>
              <div className="model-stats-col">
                <h3>Outcomes</h3>
                <StatRow label="Mean Final" value={`$${stats.mean_final?.toLocaleString()}`} />
                <StatRow label="Median Final" value={`$${stats.median_final?.toLocaleString()}`} />
                <StatRow label="Best Case" value={`$${stats.best_case?.toLocaleString()}`} />
                <StatRow label="Worst Case" value={`$${stats.worst_case?.toLocaleString()}`} />
              </div>
              <div className="model-stats-col">
                <h3>Risk Metrics</h3>
                <StatRow label="VaR (95%)" value={`$${stats.VaR_95?.toLocaleString()}`} />
                <StatRow label="CVaR (95%)" value={`$${stats.CVaR_95?.toLocaleString()}`} />
                {stats.weights && (
                  <>
                    <h3 style={{ marginTop: 12 }}>Weights</h3>
                    {Object.entries(stats.weights).map(([s, w]) => (
                      <StatRow key={s} label={s} value={`${(w * 100).toFixed(1)}%`} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {modelId === 'gbm' && stats && (
            <div className="model-stats-grid">
              <div className="model-stats-col">
                <h3>Parameters</h3>
                <StatRow label="Symbol" value={stats.symbol} />
                <StatRow label="Current Price" value={`$${stats.current_price}`} />
                <StatRow label="Drift (mu)" value={stats.drift} />
                <StatRow label="Volatility (sigma)" value={stats.volatility} />
              </div>
              <div className="model-stats-col">
                <h3>Simulation</h3>
                <StatRow label="Steps" value={stats.steps} />
                <StatRow label="Time Horizon" value={`${stats.time_horizon} yr`} />
                <StatRow label="Paths" value={stats.num_paths} />
              </div>
              <div className="model-stats-col">
                <h3>Final Price Distribution</h3>
                <StatRow label="Mean" value={`$${stats.mean_final}`} />
                <StatRow label="Median" value={`$${stats.median_final}`} />
                <StatRow label="Std Dev" value={`$${stats.std_final}`} />
              </div>
            </div>
          )}

          {modelId === 'black-scholes' && stats && (
            <div className="model-stats-grid">
              <div className="model-stats-col">
                <h3>Inputs</h3>
                <StatRow label="Symbol" value={stats.symbol} />
                <StatRow label="Spot Price" value={`$${stats.spot_price}`} />
                <StatRow label="Strike" value={`$${stats.strike}`} />
                <StatRow label="Volatility" value={`${(stats.volatility * 100).toFixed(1)}%`} />
                <StatRow label="Risk-Free Rate" value={`${(stats.risk_free_rate * 100).toFixed(1)}%`} />
                <StatRow label="Time to Expiry" value={`${stats.time_to_expiry} yr`} />
              </div>
              <div className="model-stats-col">
                <h3>Option Prices</h3>
                <StatRow label="Call Price" value={`$${stats.call_price}`} />
                <StatRow label="Put Price" value={`$${stats.put_price}`} />
              </div>
              <div className="model-stats-col">
                <h3>Greeks</h3>
                {stats.greeks && <GreeksTable greeks={stats.greeks} />}
              </div>
            </div>
          )}

          {modelId === 'pca' && stats && (
            <div className="model-stats-grid">
              <div className="model-stats-col">
                <h3>Overview</h3>
                <StatRow label="Symbols" value={stats.symbols?.join(', ')} />
                <StatRow label="Components" value={stats.n_components} />
                <StatRow label="Total Variance Explained" value={`${stats.total_variance_explained}%`} />
              </div>
              {stats.components && Object.entries(stats.components).map(([pc, data]) => (
                <div className="model-stats-col" key={pc}>
                  <h3>{pc} — {data.variance_explained}%</h3>
                  {Object.entries(data.loadings).map(([sym, load]) => (
                    <StatRow key={sym} label={sym} value={load.toFixed(4)} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Models Component ──
export default function Models({ onToast }) {
  const [activeModel, setActiveModel] = useState('monte-carlo');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleRun(params) {
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (activeModel === 'monte-carlo') res = await api.runMonteCarlo(params);
      else if (activeModel === 'gbm') res = await api.runGBM(params);
      else if (activeModel === 'black-scholes') res = await api.runBlackScholes(params);
      else if (activeModel === 'pca') res = await api.runPCA(params);

      setResult(res);
      if (res.error) onToast(res.error, 'error');
      else onToast('Model completed', 'success');
    } catch {
      onToast('Failed to run model', 'error');
    }
    setLoading(false);
  }

  return (
    <>
      <div className="model-tabs">
        {MODELS.map((m) => (
          <button
            key={m.id}
            className={`model-tab ${activeModel === m.id ? 'active' : ''}`}
            onClick={() => { setActiveModel(m.id); setResult(null); }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{MODELS.find((m) => m.id === activeModel)?.label} Parameters</h2>
        </div>
        <div className="card-body">
          {activeModel === 'monte-carlo' && <MonteCarloForm onRun={handleRun} loading={loading} />}
          {activeModel === 'gbm' && <GBMForm onRun={handleRun} loading={loading} />}
          {activeModel === 'black-scholes' && <BlackScholesForm onRun={handleRun} loading={loading} />}
          {activeModel === 'pca' && <PCAForm onRun={handleRun} loading={loading} />}
        </div>
      </div>

      {loading && (
        <div className="model-loading">
          <span className="spinner" style={{ width: 24, height: 24 }} />
          <span>Running simulation... This may take a few seconds.</span>
        </div>
      )}

      <ResultsPanel result={result} modelId={activeModel} />
    </>
  );
}
