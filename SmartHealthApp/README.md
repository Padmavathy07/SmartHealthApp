# 🩺 VitalTrack — Smart Health Monitoring App

VitalTrack is a modern healthcare monitoring web application developed using Python and Flask.  
It helps users track daily health activities, monitor BMI, manage records, and visualize health statistics through an interactive dashboard.

---

#  Features

✅ User Login & Registration System  
✅ Smart Health Dashboard with Live Charts  
✅ BMI Calculator with Instant Results  
✅ Daily Health Record Management  
✅ Automatic Health Alerts & Warnings  
✅ SQLite Database Integration  
✅ Responsive Modern UI Design  
✅ Flask-Powered Backend System  

---

#  Tech Stack

| Technology | Usage |
|------------|-------|
| Python | Backend Development |
| Flask | Web Framework |
| HTML/CSS | Frontend Design |
| JavaScript | Frontend Logic |
| SQLite | Database Management |

---

#  Project Structure

```bash
SmartHealthApp/
│
├── app.py                  ← Flask backend (Python)
├── health.db               ← SQLite database
├── requirements.txt        ← Required Python packages
├── README.md
│
├── templates/
│   └── index.html          ← Main frontend page
│
└── static/
    ├── css/
    │   └── style.css       ← Styling
    │
    └── js/
        └── app.js          ← JavaScript functionality
```

---

#  Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOURNAME/SmartHealthApp.git
```

---

## 2️⃣ Open Project Folder

Open the folder in VS Code:

```bash
SmartHealthApp
```

---

## 3️⃣ Install Required Packages

Run the following command in the VS Code terminal:

```bash
pip install flask flask-cors
```

Or install using requirements.txt:

```bash
pip install -r requirements.txt
```

---

# ▶️ Run the Application

Start the Flask server:

```bash
python app.py
```

You should see:

```bash
 Database initialized successfully.
 VitalTrack running at http://127.0.0.1:5000
```

---

#  Open in Browser

Visit:

```bash
http://127.0.0.1:5000
```

---

#  Demo Login

Use the demo account:

| Email | Password |
|---|---|
| demo@health.com | demo123 |

Or create a new account using the Register option.

---

#  Modules Included

###  Dashboard
- Daily health statistics
- Calories tracking
- Steps counter
- Heart rate monitoring
- Interactive charts

###  Health Log
- Save daily health records
- Auto-update duplicate dates
- Organized data storage

###  History Section
- View all previous records
- Delete unwanted entries
- Table-based data view

###  BMI Calculator
- Instant BMI calculation
- Health category indication
- Visual BMI scale

###  Smart Alerts
- High heart rate warnings
- Low activity notifications
- Health monitoring alerts

---

#  Troubleshooting

| Problem | Solution |
|---|---|
| `ModuleNotFoundError: flask` | Run `pip install flask flask-cors` |
| Port already in use | Change the port in `app.py` |
| Blank page after login | Open `http://127.0.0.1:5000` in browser |
| Database issue | Delete `health.db` and rerun the app |

---

#  Future Improvements

-  AI-based disease prediction
-  Cloud database integration
-  Mobile app version
-  Medicine reminder system
-  Appointment booking feature
-  AI health assistant chatbot

---

# Author

**PADMAVATHY** 

---

