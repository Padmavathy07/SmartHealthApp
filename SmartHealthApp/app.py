from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)
@app.route("/")
def home():
    return render_template("index.html")
DB_PATH = "health.db"

# ─── DATABASE SETUP ────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            height REAL,
            weight REAL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS health_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            log_date TEXT NOT NULL,
            steps INTEGER DEFAULT 0,
            calories REAL DEFAULT 0,
            heart_rate INTEGER DEFAULT 0,
            weight REAL,
            height REAL,
            bmi REAL,
            bmi_category TEXT,
            health_status TEXT,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            alert_type TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Insert demo user if not exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE email = 'demo@health.com'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO users (name, email, password, height, weight)
            VALUES ('Padmavathy', 'demo@health.com', 'demo123', 1.65, 58)
        """)

    conn.commit()
    conn.close()
    print("✅ Database initialized successfully.")

# ─── HELPERS ───────────────────────────────────────────────────────────────────

def calc_bmi(weight, height):
    if height and weight and height > 0:
        bmi = round(weight / (height ** 2), 2)
        if bmi < 18.5:
            cat = "Underweight"
        elif bmi < 25:
            cat = "Normal"
        elif bmi < 30:
            cat = "Overweight"
        else:
            cat = "Obese"
        return bmi, cat
    return None, None

def health_status(steps, calories, heart_rate):
    score = 0
    messages = []

    if steps >= 10000:
        score += 2
        messages.append("Excellent step count!")
    elif steps >= 7000:
        score += 1
        messages.append("Good activity level.")
    elif steps > 0:
        messages.append("Try to walk more — aim for 7000+ steps.")

    if calories >= 400:
        score += 2
        messages.append("Great calorie burn!")
    elif calories >= 200:
        score += 1
        messages.append("Moderate calorie burn.")
    elif calories > 0:
        messages.append("Low calorie burn — try more activity.")

    if 60 <= heart_rate <= 100:
        score += 2
        messages.append("Heart rate is normal.")
    elif heart_rate > 0:
        messages.append("Heart rate is outside normal range (60–100 bpm).")

    if score >= 5:
        status = "Excellent"
    elif score >= 3:
        status = "Good"
    elif score >= 1:
        status = "Fair"
    else:
        status = "Poor"

    return status, " | ".join(messages)

def generate_alerts(user_id, steps, calories, heart_rate, conn):
    alerts = []
    if heart_rate > 100:
        alerts.append(("High Heart Rate", f"Your heart rate is {heart_rate} bpm — above normal range."))
    elif heart_rate < 60 and heart_rate > 0:
        alerts.append(("Low Heart Rate", f"Your heart rate is {heart_rate} bpm — below normal range."))
    if steps < 3000 and steps > 0:
        alerts.append(("Low Activity", f"Only {steps} steps today. Try to be more active!"))
    if calories < 100 and calories > 0:
        alerts.append(("Low Calorie Burn", f"Only {calories} kcal burned. Stay active!"))

    for atype, msg in alerts:
        conn.execute(
            "INSERT INTO alerts (user_id, alert_type, message) VALUES (?,?,?)",
            (user_id, atype, msg)
        )

# ─── ROUTES ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")

# USER AUTH
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email=? AND password=?",
        (data.get("email"), data.get("password"))
    ).fetchone()
    conn.close()
    if user:
        return jsonify({"success": True, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO users (name, email, password) VALUES (?,?,?)",
            (data["name"], data["email"], data["password"])
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email=?", (data["email"],)).fetchone()
        conn.close()
        return jsonify({"success": True, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Email already registered"}), 400

# HEALTH LOGS
@app.route("/api/logs/<int:user_id>", methods=["GET"])
def get_logs(user_id):
    conn = get_db()
    logs = conn.execute(
        "SELECT * FROM health_logs WHERE user_id=? ORDER BY log_date DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in logs])

@app.route("/api/logs/today/<int:user_id>", methods=["GET"])
def get_today(user_id):
    today = datetime.now().strftime("%Y-%m-%d")
    conn = get_db()
    log = conn.execute(
        "SELECT * FROM health_logs WHERE user_id=? AND log_date=?",
        (user_id, today)
    ).fetchone()
    conn.close()
    return jsonify(dict(log) if log else {})

@app.route("/api/logs/week/<int:user_id>", methods=["GET"])
def get_week(user_id):
    conn = get_db()
    logs = conn.execute(
        """SELECT log_date, steps, calories, heart_rate, bmi_category, health_status
           FROM health_logs WHERE user_id=?
           ORDER BY log_date DESC LIMIT 7""",
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in reversed(logs)])

@app.route("/api/logs", methods=["POST"])
def save_log():
    data = request.json
    user_id = data.get("user_id")
    log_date = data.get("log_date", datetime.now().strftime("%Y-%m-%d"))
    steps = int(data.get("steps") or 0)
    calories = float(data.get("calories") or 0)
    heart_rate = int(data.get("heart_rate") or 0)
    weight = float(data.get("weight") or 0) or None
    height = float(data.get("height") or 0) or None
    notes = data.get("notes", "")

    bmi, bmi_cat = calc_bmi(weight, height)
    status, _ = health_status(steps, calories, heart_rate)

    conn = get_db()
    existing = conn.execute(
        "SELECT id FROM health_logs WHERE user_id=? AND log_date=?",
        (user_id, log_date)
    ).fetchone()

    if existing:
        conn.execute("""
            UPDATE health_logs SET steps=?, calories=?, heart_rate=?, weight=?,
            height=?, bmi=?, bmi_category=?, health_status=?, notes=?
            WHERE id=?
        """, (steps, calories, heart_rate, weight, height, bmi, bmi_cat, status, notes, existing["id"]))
    else:
        conn.execute("""
            INSERT INTO health_logs
            (user_id, log_date, steps, calories, heart_rate, weight, height, bmi, bmi_category, health_status, notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (user_id, log_date, steps, calories, heart_rate, weight, height, bmi, bmi_cat, status, notes))

    generate_alerts(user_id, steps, calories, heart_rate, conn)
    conn.commit()
    conn.close()
    return jsonify({"success": True, "bmi": bmi, "bmi_category": bmi_cat, "health_status": status})

@app.route("/api/logs/<int:log_id>", methods=["DELETE"])
def delete_log(log_id):
    conn = get_db()
    conn.execute("DELETE FROM health_logs WHERE id=?", (log_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/logs/clear/<int:user_id>", methods=["DELETE"])
def clear_logs(user_id):
    conn = get_db()
    conn.execute("DELETE FROM health_logs WHERE user_id=?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# BMI
@app.route("/api/bmi", methods=["POST"])
def bmi_calc():
    data = request.json
    bmi, cat = calc_bmi(float(data.get("weight", 0)), float(data.get("height", 0)))
    if bmi:
        return jsonify({"bmi": bmi, "category": cat})
    return jsonify({"error": "Invalid values"}), 400

# ALERTS
@app.route("/api/alerts/<int:user_id>", methods=["GET"])
def get_alerts(user_id):
    conn = get_db()
    alerts = conn.execute(
        "SELECT * FROM alerts WHERE user_id=? ORDER BY created_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in alerts])

@app.route("/api/alerts/read/<int:user_id>", methods=["PUT"])
def mark_read(user_id):
    conn = get_db()
    conn.execute("UPDATE alerts SET is_read=1 WHERE user_id=?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/alerts/<int:alert_id>", methods=["DELETE"])
def delete_alert(alert_id):
    conn = get_db()
    conn.execute("DELETE FROM alerts WHERE id=?", (alert_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# STATS SUMMARY
@app.route("/api/stats/<int:user_id>", methods=["GET"])
def get_stats(user_id):
    conn = get_db()
    row = conn.execute("""
        SELECT
            AVG(steps) as avg_steps, MAX(steps) as max_steps,
            AVG(calories) as avg_cal, MAX(calories) as max_cal,
            AVG(heart_rate) as avg_hr, COUNT(*) as total_logs
        FROM health_logs WHERE user_id=?
    """, (user_id,)).fetchone()
    conn.close()
    return jsonify(dict(row))

# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    print("🚀 Smart Health Monitor running at http://127.0.0.1:5000")
    app.run(debug=True)
