/**
 * API root: same-origin /api in dev (Vite proxy). On GitHub Pages, uses VITE_BASE + /api
 * unless VITE_API_URL is set (full backend URL including /api).
 */
function apiRoot() {
  const custom = import.meta.env.VITE_API_URL
  if (custom) return custom.replace(/\/$/, '')
  const b = import.meta.env.BASE_URL || '/'
  const root = b.endsWith('/') ? b.slice(0, -1) : b
  return root ? `${root}/api` : '/api'
}

const BASE = apiRoot()

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json()
}

export const api = {
  getEquities: () => request('/equities'),
  addEquity: (symbol, levels, drawdown) =>
    request('/equities', {
      method: 'POST',
      body: JSON.stringify({ symbol, levels, drawdown }),
    }),
  toggleEquity: (symbol) =>
    request(`/equities/${symbol}/toggle`, { method: 'POST' }),
  removeEquity: (symbol) =>
    request(`/equities/${symbol}`, { method: 'DELETE' }),

  getPortfolio: () => request('/portfolio'),
  getOrders: () => request('/orders'),
  getAccount: () => request('/account'),

  sendChat: (message) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  startEngine: () => request('/engine/start', { method: 'POST' }),
  stopEngine: () => request('/engine/stop', { method: 'POST' }),
  getEngineStatus: () => request('/engine/status'),

  runMonteCarlo: (params) =>
    request('/models/monte-carlo', { method: 'POST', body: JSON.stringify(params) }),
  runGBM: (params) =>
    request('/models/gbm', { method: 'POST', body: JSON.stringify(params) }),
  runBlackScholes: (params) =>
    request('/models/black-scholes', { method: 'POST', body: JSON.stringify(params) }),
  runPCA: (params) =>
    request('/models/pca', { method: 'POST', body: JSON.stringify(params) }),
}
