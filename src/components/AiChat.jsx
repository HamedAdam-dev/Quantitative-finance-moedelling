import { useState, useRef, useEffect } from 'react';
import { api } from '../api';

function formatTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function AiChat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hello! I can analyze your portfolio, assess risk, and provide market insights. Ask me anything about your holdings.',
      time: formatTime(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: 'user', text, time: formatTime() }]);
    setInput('');
    setSending(true);

    try {
      const res = await api.sendChat(text);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: res.response || res.error || 'No response.', time: formatTime() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Failed to reach AI service. Check your API key and try again.', time: formatTime() },
      ]);
    }

    setSending(false);
  }

  return (
    <div className="card chat-card">
      <div className="card-header">
        <h2>AI Portfolio Advisor</h2>
        <span className="card-header-badge">GPT-4</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI Advisor'}</strong>
            <p>{msg.text}</p>
            <span className="timestamp">{msg.time}</span>
          </div>
        ))}
        {sending && (
          <div className="chat-bubble bot">
            <strong>AI Advisor</strong>
            <div className="chat-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your portfolio, risk exposure, market outlook..."
          autoComplete="off"
          disabled={sending}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
          {sending ? <span className="spinner" /> : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
