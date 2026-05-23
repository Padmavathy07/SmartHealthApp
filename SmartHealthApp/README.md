# VitalTrack — Smart Health Monitoring App

## ▶ HOW TO RUN (Step-by-Step)

### 1. Make sure Python is installed
Open terminal / VS Code terminal and check:
```
python --version
```
You need Python 3.8 or higher.

---

### 2. Open the project folder in VS Code
File → Open Folder → select `SmartHealthApp`

---

### 3. Install required packages
In the VS Code terminal, run:
```
pip install flask flask-cors
```

---

### 4. Run the backend server
```
python app.py
```
You should see:
```
✅ Database initialized successfully.
🚀 Smart Health Monitor running at http://127.0.0.1:5000
```

---

### 5. Open the app in your browser
Go to: **http://127.0.0.1:5000**

---

### 6. Login with the demo account
- Email:    demo@health.com
- Password: demo123

Or click **Register** to create your own account.

---

## 📁 File Structure

```
SmartHealthApp/
│
├── app.py                  ← Flask backend (Python)
├── health.db               ← SQLite database (auto-created on first run)
├── requirements.txt        ← Python packages needed
│
├── templates/
│   └── index.html          ← Main HTML (all pages)
│
└── static/
    ├── css/
    │   └── style.css       ← All styles
    └── js/
        └── app.js          ← All JavaScript (buttons, API, charts)
```

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: flask` | Run `pip install flask flask-cors` |
| Port already in use | Change `app.run(port=5001)` in app.py |
| Page is blank after login | Make sure you opened **http://127.0.0.1:5000** (not a file path) |
| Database error | Delete `health.db` and restart `python app.py` |

---

## 🌟 Features

- **Login / Register** — user authentication with SQLite
- **Dashboard** — today's stats (steps, calories, heart rate, BMI) with live charts
- **Log Entry** — save daily health data; duplicate dates are auto-updated
- **History** — view and delete all past records in a table
- **BMI Calculator** — instant BMI with visual scale
- **Alerts** — automatic health warnings (high HR, low activity, etc.)
