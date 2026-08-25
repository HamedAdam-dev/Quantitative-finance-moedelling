import json
import time
import threading
import numpy as np
import datetime as dt
import base64
import io

import alpaca_trade_api as trade_api
from openai import OpenAI
import yfinance as yf
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.stats import norm
from sklearn.decomposition import PCA

DATA_FILE = "equities.json"
BASE_URL = "https://paper-api.alpaca.markets/"
ALPACA_KEY = "PKRKD7RSGB6KN5J416F2"
ALPACA_SECRET = "4DmEIXHe1bm3N3aVOKF268lfdQyI5IaxmDiSgujI"

OPENAI_API_KEY = "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"

api = trade_api.REST(ALPACA_KEY, ALPACA_SECRET, BASE_URL, api_version="v2")

PLOT_STYLE = {
    "figure.facecolor": "#131720",
    "axes.facecolor": "#0b0e14",
    "axes.edgecolor": "#1e2536",
    "axes.labelcolor": "#e1e4ea",
    "text.color": "#e1e4ea",
    "xtick.color": "#6b7280",
    "ytick.color": "#6b7280",
    "grid.color": "#1e2536",
    "grid.alpha": 0.6,
}


def _fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


# ───────────────────────── Monte Carlo Portfolio Simulation ─────────────────
def run_monte_carlo(symbols, num_sims=200, days=100, initial_value=10000, lookback_days=300):
    end = dt.datetime.now()
    start = end - dt.timedelta(days=lookback_days)

    data = yf.download(symbols, start=start, end=end, progress=False)
    if data.empty:
        return {"error": "No price data found for given symbols"}

    close = data["Close"]
    if isinstance(close, np.ndarray) or len(close.shape) == 1:
        close = close.to_frame()

    returns = close.pct_change().dropna()
    mean_returns = returns.mean().values
    cov_matrix = returns.cov().values

    weights = np.random.random(len(mean_returns))
    weights /= weights.sum()

    mean_matrix = np.full((days, len(weights)), mean_returns).T
    portfolio_sims = np.zeros((days, num_sims))

    L = np.linalg.cholesky(cov_matrix)
    for m in range(num_sims):
        Z = np.random.normal(size=(days, len(weights)))
        daily_returns = mean_matrix + np.inner(L, Z)
        portfolio_sims[:, m] = np.cumprod(np.inner(weights, daily_returns.T) + 1) * initial_value

    with plt.rc_context(PLOT_STYLE):
        fig, ax = plt.subplots(figsize=(10, 5))
        for i in range(num_sims):
            ax.plot(portfolio_sims[:, i], linewidth=0.5, alpha=0.4)
        ax.set_xlabel("Trading Days")
        ax.set_ylabel("Portfolio Value ($)")
        ax.set_title(f"Monte Carlo Simulation — {num_sims} paths, {days} days")
        ax.grid(True)

    final_vals = portfolio_sims[-1, :]
    var_95 = initial_value - np.percentile(final_vals, 5)
    cvar_95 = initial_value - final_vals[final_vals <= np.percentile(final_vals, 5)].mean()

    return {
        "image": _fig_to_base64(fig),
        "stats": {
            "symbols": symbols,
            "weights": {s: round(w, 4) for s, w in zip(symbols, weights.tolist())},
            "num_sims": num_sims,
            "days": days,
            "initial_value": initial_value,
            "mean_final": round(float(final_vals.mean()), 2),
            "median_final": round(float(np.median(final_vals)), 2),
            "worst_case": round(float(final_vals.min()), 2),
            "best_case": round(float(final_vals.max()), 2),
            "VaR_95": round(float(var_95), 2),
            "CVaR_95": round(float(cvar_95), 2),
        },
    }


# ───────────────────────── Geometric Brownian Motion ────────────────────────
def run_gbm(symbol, drift=0.05, volatility=0.2, steps=252, time_horizon=1.0, num_paths=50):
    data = yf.download(symbol, period="1y", progress=False)
    if data.empty:
        return {"error": f"No price data found for {symbol}"}

    close = data["Close"]
    current_price = float(close.iloc[-1])

    t = np.linspace(0.0, time_horizon, steps)
    dt_step = t[1] - t[0]

    paths = np.zeros((steps, num_paths))
    for i in range(num_paths):
        z = np.random.standard_normal(steps)
        z[0] = 0
        w = np.cumsum(np.sqrt(dt_step) * z)
        paths[:, i] = current_price * np.exp((drift - 0.5 * volatility**2) * t + volatility * w)

    with plt.rc_context(PLOT_STYLE):
        fig, ax = plt.subplots(figsize=(10, 5))
        for i in range(num_paths):
            ax.plot(t, paths[:, i], linewidth=0.6, alpha=0.5)
        ax.axhline(y=current_price, color="#ef4444", linestyle="--", linewidth=1, label=f"Current: ${current_price:.2f}")
        ax.set_xlabel("Time (years)")
        ax.set_ylabel("Price ($)")
        ax.set_title(f"Geometric Brownian Motion — {symbol}")
        ax.legend()
        ax.grid(True)

    finals = paths[-1, :]
    return {
        "image": _fig_to_base64(fig),
        "stats": {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "drift": drift,
            "volatility": volatility,
            "steps": steps,
            "time_horizon": time_horizon,
            "num_paths": num_paths,
            "mean_final": round(float(finals.mean()), 2),
            "median_final": round(float(np.median(finals)), 2),
            "std_final": round(float(finals.std()), 2),
        },
    }


# ───────────────────────── Black-Scholes Option Pricing ─────────────────────
def run_black_scholes(symbol, strike, time_to_expiry=1.0, risk_free_rate=0.05, volatility=None):
    data = yf.download(symbol, period="1y", progress=False)
    if data.empty:
        return {"error": f"No price data found for {symbol}"}

    close = data["Close"]
    S = float(close.iloc[-1])

    if volatility is None or volatility <= 0:
        log_returns = np.log(close / close.shift(1)).dropna()
        volatility = float(log_returns.std()) * np.sqrt(252)

    K = float(strike)
    T = float(time_to_expiry)
    r = float(risk_free_rate)
    sigma = float(volatility)

    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    call_price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    put_price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

    call_delta = norm.cdf(d1)
    put_delta = call_delta - 1
    gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))
    vega = S * norm.pdf(d1) * np.sqrt(T) / 100
    call_theta = (-(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T)) - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365
    put_theta = (-(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T)) + r * K * np.exp(-r * T) * norm.cdf(-d2)) / 365

    strikes = np.linspace(K * 0.7, K * 1.3, 80)
    call_prices = []
    put_prices = []
    for k in strikes:
        d1_k = (np.log(S / k) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2_k = d1_k - sigma * np.sqrt(T)
        call_prices.append(S * norm.cdf(d1_k) - k * np.exp(-r * T) * norm.cdf(d2_k))
        put_prices.append(k * np.exp(-r * T) * norm.cdf(-d2_k) - S * norm.cdf(-d1_k))

    with plt.rc_context(PLOT_STYLE):
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.plot(strikes, call_prices, color="#22c55e", linewidth=2, label="Call")
        ax.plot(strikes, put_prices, color="#ef4444", linewidth=2, label="Put")
        ax.axvline(x=K, color="#6b7280", linestyle="--", linewidth=1, alpha=0.7, label=f"Strike ${K:.0f}")
        ax.axvline(x=S, color="#3b82f6", linestyle="--", linewidth=1, alpha=0.7, label=f"Spot ${S:.2f}")
        ax.set_xlabel("Strike Price ($)")
        ax.set_ylabel("Option Price ($)")
        ax.set_title(f"Black-Scholes Option Pricing — {symbol}")
        ax.legend()
        ax.grid(True)

    return {
        "image": _fig_to_base64(fig),
        "stats": {
            "symbol": symbol,
            "spot_price": round(S, 2),
            "strike": round(K, 2),
            "time_to_expiry": T,
            "risk_free_rate": r,
            "volatility": round(sigma, 4),
            "call_price": round(float(call_price), 4),
            "put_price": round(float(put_price), 4),
            "greeks": {
                "call_delta": round(float(call_delta), 4),
                "put_delta": round(float(put_delta), 4),
                "gamma": round(float(gamma), 6),
                "vega": round(float(vega), 4),
                "call_theta": round(float(call_theta), 4),
                "put_theta": round(float(put_theta), 4),
            },
        },
    }


# ───────────────────────── PCA — Portfolio Risk Decomposition ───────────────
def run_pca(symbols, n_components=3, lookback_days=365):
    end = dt.datetime.now()
    start = end - dt.timedelta(days=lookback_days)

    data = yf.download(symbols, start=start, end=end, progress=False)
    if data.empty:
        return {"error": "No price data found for given symbols"}

    close = data["Close"]
    if isinstance(close, np.ndarray) or len(close.shape) == 1:
        close = close.to_frame()

    returns = close.pct_change().dropna()
    n_components = min(n_components, len(symbols), returns.shape[1])

    pca = PCA(n_components=n_components)
    pca.fit(returns.values)

    explained = pca.explained_variance_ratio_
    loadings = pca.components_
    col_names = list(returns.columns)

    with plt.rc_context(PLOT_STYLE):
        fig, axes = plt.subplots(1, 2, figsize=(12, 5))

        # Scree plot
        ax1 = axes[0]
        components = [f"PC{i+1}" for i in range(n_components)]
        bars = ax1.bar(components, explained * 100, color="#3b82f6", alpha=0.8)
        ax1.plot(components, np.cumsum(explained) * 100, "o--", color="#22c55e", linewidth=2, markersize=8)
        ax1.set_ylabel("Variance Explained (%)")
        ax1.set_title("Scree Plot")
        ax1.grid(True, axis="y")

        # Loadings heatmap
        ax2 = axes[1]
        im = ax2.imshow(loadings, aspect="auto", cmap="RdBu_r", vmin=-1, vmax=1)
        ax2.set_xticks(range(len(col_names)))
        ax2.set_xticklabels(col_names, rotation=45, ha="right", fontsize=10)
        ax2.set_yticks(range(n_components))
        ax2.set_yticklabels(components)
        ax2.set_title("PCA Loadings")
        fig.colorbar(im, ax=ax2, fraction=0.046, pad=0.04)

        for i in range(n_components):
            for j in range(len(col_names)):
                ax2.text(j, i, f"{loadings[i, j]:.2f}", ha="center", va="center",
                         fontsize=9, color="#fff" if abs(loadings[i, j]) > 0.4 else "#6b7280")

        fig.tight_layout()

    component_data = {}
    for i in range(n_components):
        component_data[f"PC{i+1}"] = {
            "variance_explained": round(float(explained[i]) * 100, 2),
            "loadings": {s: round(float(loadings[i, j]), 4) for j, s in enumerate(col_names)},
        }

    return {
        "image": _fig_to_base64(fig),
        "stats": {
            "symbols": symbols,
            "n_components": n_components,
            "total_variance_explained": round(float(np.sum(explained)) * 100, 2),
            "components": component_data,
        },
    }


# ───────────────────────── Trading Bot Logic ────────────────────────────────

def load_equities():
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_equities(equities):
    with open(DATA_FILE, "w") as f:
        json.dump(equities, f, indent=2)


def fetch_portfolio():
    try:
        positions = api.list_positions()
        portfolio = []
        for pos in positions:
            portfolio.append({
                "symbol": pos.symbol,
                "qty": pos.qty,
                "entry_price": pos.avg_entry_price,
                "current_price": pos.current_price,
                "unrealized_pl": pos.unrealized_pl,
                "side": "long",
            })
        return portfolio
    except Exception:
        return []


def fetch_open_orders():
    try:
        orders = api.list_orders(status="open")
        return [
            {
                "symbol": o.symbol,
                "qty": o.qty,
                "limit_price": o.limit_price,
                "side": o.side,
            }
            for o in orders
        ]
    except Exception:
        return []


def fetch_account():
    try:
        acct = api.get_account()
        return {
            "equity": acct.equity,
            "cash": acct.cash,
            "buying_power": acct.buying_power,
            "portfolio_value": acct.portfolio_value,
        }
    except Exception:
        return {"equity": "N/A", "cash": "N/A", "buying_power": "N/A", "portfolio_value": "N/A"}


def fetch_price(symbol):
    try:
        trade = api.get_latest_trade(symbol)
        return {"price": float(trade.price)}
    except Exception:
        return {"price": -1}


def chatgpt_response(message):
    portfolio_data = fetch_portfolio()
    open_orders = fetch_open_orders()

    system_prompt = f"""You are an AI portfolio manager responsible for analyzing my portfolio.
Your tasks:
1. Evaluate risk exposures of my current holdings
2. Analyze my open limit orders and their potential impact
3. Provide insights into portfolio health, diversification, and trade adjustments
4. Speculate on the market outlook based on current market conditions
5. Identify potential market risks and suggest risk management strategies

My portfolio: {portfolio_data}
My open orders: {open_orders}

Answer the following question with priority having that background: {message}"""

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": system_prompt}],
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI Error: {str(e)}"


def add_equity(symbol, levels, drawdown_pct):
    equities = load_equities()
    symbol = symbol.upper().strip()

    if not symbol or levels < 1 or drawdown_pct <= 0:
        return {"error": "Invalid input"}

    drawdown = drawdown_pct / 100
    price_data = fetch_price(symbol)
    entry_price = price_data["price"] if price_data["price"] > 0 else 100

    level_prices = {
        str(i + 1): round(entry_price * (1 - drawdown * (i + 1)), 2)
        for i in range(levels)
    }

    equities[symbol] = {
        "position": 0,
        "entry_price": entry_price,
        "levels": level_prices,
        "drawdown": drawdown,
        "status": "off",
    }

    save_equities(equities)
    return {"success": True, "symbol": symbol}


def toggle_equity(symbol):
    equities = load_equities()
    if symbol not in equities:
        return {"error": "Symbol not found"}

    equities[symbol]["status"] = "on" if equities[symbol]["status"] == "off" else "off"
    save_equities(equities)
    return {"success": True, "status": equities[symbol]["status"]}


def remove_equity(symbol):
    equities = load_equities()
    if symbol not in equities:
        return {"error": "Symbol not found"}

    del equities[symbol]
    save_equities(equities)
    return {"success": True}


def get_max_entry_price(symbol):
    try:
        orders = api.list_orders(status="filled", limit=50)
        prices = [
            float(o.filled_avg_price)
            for o in orders
            if o.filled_avg_price and o.symbol == symbol
        ]
        return max(prices) if prices else -1
    except Exception:
        return 0


def place_limit_order(symbol, price, level, equities):
    level_str = str(level)
    neg_level_str = str(-level)

    if neg_level_str in equities[symbol]["levels"]:
        return

    try:
        api.submit_order(
            symbol=symbol,
            qty=1,
            side="buy",
            type="limit",
            time_in_force="gtc",
            limit_price=price,
        )
        equities[symbol]["levels"][neg_level_str] = price
        if level_str in equities[symbol]["levels"]:
            del equities[symbol]["levels"][level_str]
    except Exception:
        pass


def run_trade_cycle():
    equities = load_equities()
    messages = []

    for symbol, data in equities.items():
        if data["status"] != "on":
            continue

        try:
            api.get_position(symbol)
        except Exception:
            try:
                api.submit_order(
                    symbol=symbol,
                    qty=1,
                    side="buy",
                    type="market",
                    time_in_force="gtc",
                )
                messages.append(f"Initial market order placed for {symbol}")
                time.sleep(2)

                entry_price = get_max_entry_price(symbol)
                if entry_price > 0:
                    level_prices = {
                        str(i + 1): round(entry_price * (1 - data["drawdown"] * (i + 1)), 2)
                        for i in range(len(data["levels"]))
                    }
                    equities[symbol]["entry_price"] = entry_price
                    equities[symbol]["levels"] = level_prices
                    equities[symbol]["position"] = 1

                    for lvl_str, price in level_prices.items():
                        place_limit_order(symbol, price, int(lvl_str), equities)
            except Exception as e:
                messages.append(f"Error with {symbol}: {str(e)}")

    save_equities(equities)
    return messages


class TradingEngine:
    def __init__(self):
        self.running = False
        self._thread = None
        self.logs = []

    def start(self):
        if self.running:
            return
        self.running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self):
        self.running = False

    def _loop(self):
        while self.running:
            try:
                msgs = run_trade_cycle()
                self.logs.extend(msgs)
                if len(self.logs) > 200:
                    self.logs = self.logs[-200:]
            except Exception as e:
                self.logs.append(f"Trade cycle error: {str(e)}")
            time.sleep(10)


engine = TradingEngine()
