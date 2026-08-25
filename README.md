# Quant-modelling

AI-assisted trading dashboard with a **Flask** API (Alpaca paper trading, OpenAI advisor) and a **React + Vite** web UI. Includes quantitative models: Monte Carlo portfolio simulation, geometric Brownian motion, Black–Scholes option pricing, and PCA on returns.

## Features

- **Dashboard** — account stats, open orders, paper-trading engine logs  
- **Equities** — add symbols, levels, drawdown; toggle automation  
- **Portfolio** — live positions and unrealized P/L  
- **Models** — Monte Carlo, GBM, Black–Scholes, PCA (charts + stats from the backend)  
- **AI Advisor** — portfolio questions via OpenAI (GPT-4)

## Quick start (local)

### 1. Backend (Python)

```bash
cd /path/to/Quant-modelling
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

API runs at **http://127.0.0.1:5000**.

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. Vite proxies `/api` to the Flask server.

### 3. Configuration

Put your keys in environment variables (do **not** commit secrets in code):

| Variable | Purpose |
|----------|---------|
| `ALPACA_KEY`, `ALPACA_SECRET` | Alpaca paper API (see `bot.py` if you refactor to env) |
| `OPENAI_API_KEY` | OpenAI chat for AI Advisor |

Until the repo reads env vars, update `bot.py` locally or refactor to `os.environ`.

## GitHub Pages (static UI)

The site is built and deployed with **GitHub Actions** to GitHub Pages.

- **Live URL:** `https://phys-hamed-adam.github.io/Quant-modelling/`  
  (after the first successful deploy and Pages enabled.)

**Important:** GitHub Pages only hosts the **static frontend**. API calls need a running backend. Options:

1. Run `python app.py` locally and use the app at `http://localhost:3000`.  
2. Deploy the Flask API elsewhere (Railway, Render, etc.) and set the GitHub Actions variable **`VITE_API_URL`** to that API root (e.g. `https://your-api.example.com/api`).  
3. Use the Pages site as a **demo UI**; data will not load until a backend is configured.

### Enable Pages in the repo

1. **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**.  
2. Push to `main`; the workflow **Deploy GitHub Pages** builds `frontend/` and publishes `dist/`.

### Changing the repo name

If you rename the repository, set the workflow env **`VITE_BASE`** to `/<new-repo-name>/` (leading slash, trailing slash).

## Project layout

```
.
├── app.py              # Flask API
├── bot.py              # Alpaca, trading engine, model helpers
├── requirements.txt
├── frontend/           # React (Vite)
│   ├── src/
│   └── vite.config.js
└── .github/workflows/  # Pages deploy
```

## License

Use at your own risk. Not financial advice. Paper trading only unless you change endpoints and keys.
