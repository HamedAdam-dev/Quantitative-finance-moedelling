import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Equities from './components/Equities';
import Portfolio from './components/Portfolio';
import Models from './components/Models';
import AiChat from './components/AiChat';
import { api } from './api';

const PAGES = {
  dashboard: { title: 'Dashboard', subtitle: 'Account overview & activity' },
  equities: { title: 'Equities', subtitle: 'Manage tracked symbols' },
  portfolio: { title: 'Portfolio', subtitle: 'Live positions & P/L' },
  models: { title: 'Models', subtitle: 'Monte Carlo, GBM, Black-Scholes, PCA' },
  'ai-chat': { title: 'AI Advisor', subtitle: 'Portfolio analysis powered by GPT-4' },
};

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [engineRunning, setEngineRunning] = useState(false);
  const [clock, setClock] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    api.getEngineStatus().then((s) => setEngineRunning(s.running)).catch(() => {});
    const id = setInterval(() => {
      api.getEngineStatus().then((s) => setEngineRunning(s.running)).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  async function handleEngineToggle(start) {
    try {
      if (start) {
        await api.startEngine();
        setEngineRunning(true);
        showToast('Trading engine started', 'success');
      } else {
        await api.stopEngine();
        setEngineRunning(false);
        showToast('Trading engine stopped', 'success');
      }
    } catch {
      showToast('Failed to toggle engine', 'error');
    }
  }

  const currentPage = PAGES[page] || PAGES.dashboard;

  return (
    <div className="app">
      <Sidebar
        active={page}
        onNavigate={setPage}
        engineRunning={engineRunning}
        onEngineToggle={handleEngineToggle}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1>{currentPage.title}</h1>
            <span className="topbar-subtitle">{currentPage.subtitle}</span>
          </div>
          <div className="topbar-right">
            <span className="badge">{clock}</span>
          </div>
        </header>

        <div className="content">
          <section className={`section ${page === 'dashboard' ? 'active' : ''}`}>
            {page === 'dashboard' && <Dashboard />}
          </section>
          <section className={`section ${page === 'equities' ? 'active' : ''}`}>
            {page === 'equities' && <Equities onToast={showToast} />}
          </section>
          <section className={`section ${page === 'portfolio' ? 'active' : ''}`}>
            {page === 'portfolio' && <Portfolio />}
          </section>
          <section className={`section ${page === 'models' ? 'active' : ''}`}>
            {page === 'models' && <Models onToast={showToast} />}
          </section>
          <section className={`section ${page === 'ai-chat' ? 'active' : ''}`}>
            {page === 'ai-chat' && <AiChat />}
          </section>
        </div>
      </main>

      <Toast toasts={toasts} />
    </div>
  );
}
