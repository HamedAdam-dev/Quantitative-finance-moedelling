from flask import Flask, request, jsonify
from flask_cors import CORS
from bot import (
    load_equities, add_equity, toggle_equity, remove_equity,
    fetch_portfolio, fetch_open_orders, fetch_account,
    chatgpt_response, engine,
    run_monte_carlo, run_gbm, run_black_scholes, run_pca,
)

app = Flask(__name__)
CORS(app)


# ── Equities ──

@app.route("/api/equities", methods=["GET"])
def get_equities():
    return jsonify(load_equities())


@app.route("/api/equities", methods=["POST"])
def post_equity():
    data = request.json
    result = add_equity(
        data.get("symbol", ""),
        int(data.get("levels", 0)),
        float(data.get("drawdown", 0)),
    )
    return jsonify(result)


@app.route("/api/equities/<symbol>/toggle", methods=["POST"])
def toggle(symbol):
    return jsonify(toggle_equity(symbol.upper()))


@app.route("/api/equities/<symbol>", methods=["DELETE"])
def delete_equity(symbol):
    return jsonify(remove_equity(symbol.upper()))


# ── Portfolio / Account ──

@app.route("/api/portfolio", methods=["GET"])
def portfolio():
    return jsonify(fetch_portfolio())


@app.route("/api/orders", methods=["GET"])
def orders():
    return jsonify(fetch_open_orders())


@app.route("/api/account", methods=["GET"])
def account():
    return jsonify(fetch_account())


# ── AI Chat ──

@app.route("/api/chat", methods=["POST"])
def chat():
    message = request.json.get("message", "")
    if not message:
        return jsonify({"error": "Empty message"}), 400
    response = chatgpt_response(message)
    return jsonify({"response": response})


# ── Engine ──

@app.route("/api/engine/start", methods=["POST"])
def start_engine():
    engine.start()
    return jsonify({"running": True})


@app.route("/api/engine/stop", methods=["POST"])
def stop_engine():
    engine.stop()
    return jsonify({"running": False})


@app.route("/api/engine/status", methods=["GET"])
def engine_status():
    return jsonify({"running": engine.running, "logs": engine.logs[-50:]})


# ── Models ──

@app.route("/api/models/monte-carlo", methods=["POST"])
def model_monte_carlo():
    d = request.json
    symbols = [s.strip().upper() for s in d.get("symbols", "AAPL,MSFT,TSLA").split(",") if s.strip()]
    result = run_monte_carlo(
        symbols=symbols,
        num_sims=int(d.get("num_sims", 200)),
        days=int(d.get("days", 100)),
        initial_value=float(d.get("initial_value", 10000)),
        lookback_days=int(d.get("lookback_days", 300)),
    )
    return jsonify(result)


@app.route("/api/models/gbm", methods=["POST"])
def model_gbm():
    d = request.json
    result = run_gbm(
        symbol=d.get("symbol", "AAPL").strip().upper(),
        drift=float(d.get("drift", 0.05)),
        volatility=float(d.get("volatility", 0.2)),
        steps=int(d.get("steps", 252)),
        time_horizon=float(d.get("time_horizon", 1.0)),
        num_paths=int(d.get("num_paths", 50)),
    )
    return jsonify(result)


@app.route("/api/models/black-scholes", methods=["POST"])
def model_black_scholes():
    d = request.json
    vol = d.get("volatility")
    result = run_black_scholes(
        symbol=d.get("symbol", "AAPL").strip().upper(),
        strike=float(d.get("strike", 150)),
        time_to_expiry=float(d.get("time_to_expiry", 1.0)),
        risk_free_rate=float(d.get("risk_free_rate", 0.05)),
        volatility=float(vol) if vol else None,
    )
    return jsonify(result)


@app.route("/api/models/pca", methods=["POST"])
def model_pca():
    d = request.json
    symbols = [s.strip().upper() for s in d.get("symbols", "AAPL,MSFT,TSLA,AMZN").split(",") if s.strip()]
    result = run_pca(
        symbols=symbols,
        n_components=int(d.get("n_components", 3)),
        lookback_days=int(d.get("lookback_days", 365)),
    )
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
