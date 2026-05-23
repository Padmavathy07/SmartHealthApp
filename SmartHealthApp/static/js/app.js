/* ═══════════════════════════════════════════════════════
   VitalTrack — app.js
   Full frontend logic: Auth, Navigation, API, Charts
═══════════════════════════════════════════════════════ */

const API = '';   // Flask runs on same origin: http://127.0.0.1:5000

/* ─── STATE ─────────────────────────────────────────── */
let currentUser = null;
let weeklyChart = null;
let pieChart    = null;

/* ─── HELPERS ───────────────────────────────────────── */
async function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  return { ok: res.ok, data };
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showMsg(id, text, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'save-msg ' + type;
  setTimeout(() => { el.textContent = ''; el.className = 'save-msg'; }, 3500);
}

/* ═══════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════ */
function initAuth() {
  // Tab switching
  document.getElementById('tab-login').addEventListener('click', () => {
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-error').textContent = '';
  });

  document.getElementById('tab-register').addEventListener('click', () => {
    document.getElementById('tab-register').classList.add('active');
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('reg-error').textContent = '';
  });

  // Login
  document.getElementById('btn-login').addEventListener('click', async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errEl    = document.getElementById('login-error');

    if (!email || !password) { errEl.textContent = 'Please enter email and password.'; return; }

    const btn = document.getElementById('btn-login');
    btn.textContent = 'Logging in…';
    btn.disabled = true;

    const { ok, data } = await api('/api/login', 'POST', { email, password });

    btn.textContent = 'Login →';
    btn.disabled = false;

    if (ok && data.success) {
      currentUser = data.user;
      launchApp();
    } else {
      errEl.textContent = data.message || 'Invalid email or password.';
    }
  });

  // Allow Enter key on login
  ['login-email', 'login-password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-login').click();
    });
  });

  // Register
  document.getElementById('btn-register').addEventListener('click', async () => {
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const errEl    = document.getElementById('reg-error');

    if (!name || !email || !password) { errEl.textContent = 'All fields are required.'; return; }
    if (password.length < 4) { errEl.textContent = 'Password must be at least 4 characters.'; return; }

    const btn = document.getElementById('btn-register');
    btn.textContent = 'Creating…';
    btn.disabled = true;

    const { ok, data } = await api('/api/register', 'POST', { name, email, password });

    btn.textContent = 'Create Account →';
    btn.disabled = false;

    if (ok && data.success) {
      currentUser = data.user;
      launchApp();
    } else {
      errEl.textContent = data.message || 'Registration failed. Try again.';
    }
  });
}

/* ─── Launch App after login ─── */
function launchApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-shell').style.display   = 'block';

  // Set user info in sidebar
  const name = currentUser.name || 'User';
  document.getElementById('sidebar-username').textContent  = name;
  document.getElementById('user-avatar-char').textContent  = name.charAt(0).toUpperCase();

  // Set today's date chip
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  // Set default log date
  document.getElementById('log-date').value = today();

  // Load dashboard
  loadDashboard();
  loadAlertBadge();
}

/* ─── Logout ─── */
document.getElementById('btn-logout').addEventListener('click', () => {
  currentUser = null;
  document.getElementById('app-shell').style.display   = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').textContent = '';
  // Reset charts
  if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
  if (pieChart)    { pieChart.destroy();    pieChart    = null; }
});

/* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */
const pageTitles = {
  dashboard: 'Dashboard',
  log:       'Log Entry',
  history:   'Health Records',
  bmi:       'BMI Calculator',
  alerts:    'Health Alerts'
};

function showPage(name) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  // Show target page
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  // Highlight nav link
  const link = document.querySelector(`.nav-link[data-page="${name}"]`);
  if (link) link.classList.add('active');

  // Update topbar title
  document.getElementById('page-title').textContent = pageTitles[name] || '';

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');

  // Load page data
  if (name === 'dashboard') loadDashboard();
  if (name === 'history')   loadHistory();
  if (name === 'alerts')    loadAlerts();
}

// Nav link clicks
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showPage(link.dataset.page);
  });
});

// Hamburger (mobile)
document.getElementById('hamburger').addEventListener('click', () => {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const isOpen   = sidebar.classList.toggle('open');
  overlay.style.display = isOpen ? 'block' : 'none';
});

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
async function loadDashboard() {
  if (!currentUser) return;

  // Today's log
  const { ok, data: todayLog } = await api(`/api/logs/today/${currentUser.id}`);

  if (ok && todayLog && todayLog.id) {
    // Steps
    const steps = todayLog.steps || 0;
    document.getElementById('stat-steps').textContent    = steps.toLocaleString();
    document.getElementById('bar-steps').style.width     = Math.min((steps / 10000) * 100, 100) + '%';

    // Calories
    const cal = todayLog.calories || 0;
    document.getElementById('stat-calories').textContent = cal + ' kcal';
    document.getElementById('bar-calories').style.width  = Math.min((cal / 500) * 100, 100) + '%';

    // Heart Rate
    const hr = todayLog.heart_rate || 0;
    document.getElementById('stat-heart').textContent    = hr ? hr + ' bpm' : '—';
    if (hr > 0) document.getElementById('pulse-dot').classList.add('active');

    // BMI
    const bmi = todayLog.bmi;
    document.getElementById('stat-bmi').textContent      = bmi ? bmi.toFixed(1) : '—';
    document.getElementById('bmi-status-dash').textContent = todayLog.bmi_category || '—';

    // Health Banner
    const status = todayLog.health_status || 'Unknown';
    const statusColors = {
      Excellent: '#10b981', Good: '#00e5ff', Fair: '#f59e0b', Poor: '#ef4444'
    };
    const banner = document.getElementById('health-banner');
    banner.style.borderColor = statusColors[status] || '#253058';
    banner.style.background  = (statusColors[status] || '#253058') + '11';
    document.getElementById('health-status-text').textContent =
      `Health Status: ${status} — Keep it up!`;
  } else {
    // No log today
    ['stat-steps','stat-calories','stat-heart','stat-bmi'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
    document.getElementById('bmi-status-dash').textContent = '—';
    document.getElementById('health-status-text').textContent = 'No entry for today. Go to Log Entry to add data!';
    document.getElementById('bar-steps').style.width    = '0%';
    document.getElementById('bar-calories').style.width = '0%';
  }

  // Weekly chart
  const { data: weekData } = await api(`/api/logs/week/${currentUser.id}`);
  renderWeeklyChart(weekData || []);
  renderPieChart(weekData || []);
}

/* ─── Weekly Bar Chart ─── */
function renderWeeklyChart(data) {
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  if (weeklyChart) weeklyChart.destroy();

  const labels = data.map(d => {
    const dt = new Date(d.log_date + 'T00:00:00');
    return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  });
  const steps    = data.map(d => d.steps || 0);
  const calories = data.map(d => d.calories || 0);

  weeklyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Steps',
          data: steps,
          backgroundColor: 'rgba(0,229,255,0.25)',
          borderColor: '#00e5ff',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Calories',
          data: calories,
          backgroundColor: 'rgba(245,158,11,0.25)',
          borderColor: '#f59e0b',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { family: 'Space Mono', size: 10 } },
          grid: { color: '#1f2a4a' }
        },
        y: {
          position: 'left',
          ticks: { color: '#00e5ff', font: { family: 'Space Mono', size: 10 } },
          grid: { color: '#1f2a4a' },
          title: { display: true, text: 'Steps', color: '#00e5ff', font: { size: 10 } }
        },
        y1: {
          position: 'right',
          ticks: { color: '#f59e0b', font: { family: 'Space Mono', size: 10 } },
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Calories', color: '#f59e0b', font: { size: 10 } }
        }
      }
    }
  });
}

/* ─── Pie / Doughnut Chart ─── */
function renderPieChart(data) {
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (pieChart) pieChart.destroy();

  const totalSteps = data.reduce((s, d) => s + (d.steps || 0), 0);
  const totalCal   = data.reduce((s, d) => s + (d.calories || 0), 0);
  const totalDays  = data.length;
  const goal       = totalDays * 10000;
  const missed     = Math.max(0, goal - totalSteps);

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Steps Done', 'Calories', 'Steps Gap'],
      datasets: [{
        data: [totalSteps, totalCal, missed],
        backgroundColor: ['rgba(0,229,255,0.7)', 'rgba(245,158,11,0.7)', 'rgba(37,48,88,0.6)'],
        borderColor: ['#00e5ff', '#f59e0b', '#253058'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { family: 'Space Mono', size: 10 },
            boxWidth: 12, padding: 12
          }
        }
      }
    }
  });
}

/* ═══════════════════════════════════════════════════════
   LOG ENTRY
═══════════════════════════════════════════════════════ */
document.getElementById('btn-save').addEventListener('click', async () => {
  if (!currentUser) return;

  const logDate   = document.getElementById('log-date').value;
  const steps     = document.getElementById('log-steps').value;
  const calories  = document.getElementById('log-calories').value;
  const heartRate = document.getElementById('log-heart').value;
  const weight    = document.getElementById('log-weight').value;
  const height    = document.getElementById('log-height').value;
  const notes     = document.getElementById('log-notes').value;

  if (!logDate) { showMsg('save-msg', 'Please select a date.', 'error'); return; }
  if (!steps && !calories && !heartRate) {
    showMsg('save-msg', 'Please fill in at least one health value.', 'error'); return;
  }

  const btn = document.getElementById('btn-save');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  const { ok, data } = await api('/api/logs', 'POST', {
    user_id: currentUser.id,
    log_date: logDate,
    steps: steps || 0,
    calories: calories || 0,
    heart_rate: heartRate || 0,
    weight: weight || null,
    height: height || null,
    notes
  });

  btn.textContent = 'Save Entry';
  btn.disabled = false;

  if (ok && data.success) {
    const bmiMsg = data.bmi ? ` | BMI: ${data.bmi} (${data.bmi_category})` : '';
    showMsg('save-msg', `✅ Saved! Status: ${data.health_status}${bmiMsg}`, 'success');

    // Clear form
    document.getElementById('log-steps').value    = '';
    document.getElementById('log-calories').value = '';
    document.getElementById('log-heart').value    = '';
    document.getElementById('log-weight').value   = '';
    document.getElementById('log-height').value   = '';
    document.getElementById('log-notes').value    = '';
    document.getElementById('log-date').value     = today();

    loadAlertBadge();
  } else {
    showMsg('save-msg', '❌ Failed to save. Please try again.', 'error');
  }
});

/* ═══════════════════════════════════════════════════════
   HISTORY
═══════════════════════════════════════════════════════ */
async function loadHistory() {
  if (!currentUser) return;

  const tbody = document.getElementById('history-body');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Loading…</td></tr>';

  const { ok, data } = await api(`/api/logs/${currentUser.id}`);

  if (!ok || !data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No records yet. Start logging!</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(row => {
    const status = row.health_status || '—';
    const pill   = status !== '—'
      ? `<span class="status-pill status-${status}">${status}</span>`
      : '—';
    return `
      <tr>
        <td>${formatDate(row.log_date)}</td>
        <td>${row.steps ? row.steps.toLocaleString() : '—'}</td>
        <td>${row.calories ? row.calories + ' kcal' : '—'}</td>
        <td>${row.heart_rate ? row.heart_rate + ' bpm' : '—'}</td>
        <td>${row.bmi ? row.bmi.toFixed(1) + ' <small style="color:#64748b">(${row.bmi_category})</small>' : '—'}</td>
        <td>${pill}</td>
        <td><button class="btn-del" onclick="deleteLog(${row.id})">🗑</button></td>
      </tr>
    `;
  }).join('');
}

async function deleteLog(id) {
  if (!confirm('Delete this record?')) return;
  const { ok } = await api(`/api/logs/${id}`, 'DELETE');
  if (ok) loadHistory();
}

document.getElementById('btn-clear-all').addEventListener('click', async () => {
  if (!currentUser) return;
  if (!confirm('Delete ALL health records? This cannot be undone.')) return;
  const { ok } = await api(`/api/logs/clear/${currentUser.id}`, 'DELETE');
  if (ok) loadHistory();
});

/* ═══════════════════════════════════════════════════════
   BMI CALCULATOR
═══════════════════════════════════════════════════════ */
document.getElementById('btn-bmi').addEventListener('click', async () => {
  const weight = parseFloat(document.getElementById('bmi-weight').value);
  const height = parseFloat(document.getElementById('bmi-height').value);

  if (!weight || !height || weight <= 0 || height <= 0) {
    alert('Please enter valid weight and height values.');
    return;
  }

  const { ok, data } = await api('/api/bmi', 'POST', { weight, height });

  if (ok && data.bmi) {
    document.getElementById('bmi-number').textContent   = data.bmi.toFixed(1);
    document.getElementById('bmi-category').textContent = data.category;

    // Color the category
    const colors = {
      Underweight: '#0ea5e9',
      Normal:      '#10b981',
      Overweight:  '#f59e0b',
      Obese:       '#ef4444'
    };
    document.getElementById('bmi-number').style.color   = colors[data.category] || '#00e5ff';
    document.getElementById('bmi-category').style.color = colors[data.category] || '#94a3b8';

    // Move needle on scale
    // Scale: 10 → 40 mapped to 0% → 100%
    const pct = Math.min(Math.max(((data.bmi - 10) / 30) * 100, 2), 98);
    document.getElementById('scale-needle').style.left = pct + '%';
  }
});

// Allow Enter on BMI inputs
['bmi-weight', 'bmi-height'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-bmi').click();
  });
});

/* ═══════════════════════════════════════════════════════
   ALERTS
═══════════════════════════════════════════════════════ */
async function loadAlertBadge() {
  if (!currentUser) return;
  const { ok, data } = await api(`/api/alerts/${currentUser.id}`);
  if (!ok) return;

  const unread = data.filter(a => !a.is_read).length;
  const badge  = document.getElementById('alert-badge');

  if (unread > 0) {
    badge.textContent    = unread;
    badge.style.display  = 'inline-block';
  } else {
    badge.style.display  = 'none';
  }
}

async function loadAlerts() {
  if (!currentUser) return;

  const list = document.getElementById('alerts-list');
  list.innerHTML = '<div class="empty-alerts">Loading…</div>';

  const { ok, data } = await api(`/api/alerts/${currentUser.id}`);

  if (!ok || !data || data.length === 0) {
    list.innerHTML = '<div class="empty-alerts">No alerts yet. Keep logging your health data!</div>';
    return;
  }

  const iconMap = {
    'High Heart Rate': '❤️',
    'Low Heart Rate':  '💙',
    'Low Activity':    '🚶',
    'Low Calorie Burn':'🔥'
  };

  list.innerHTML = data.map(a => {
    const unread = !a.is_read ? 'unread' : '';
    const icon   = iconMap[a.alert_type] || '⚠️';
    const time   = new Date(a.created_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    return `
      <div class="alert-item ${unread}" id="alert-${a.id}">
        <span class="alert-icon">${icon}</span>
        <div class="alert-body">
          <div class="alert-type">${a.alert_type}</div>
          <div class="alert-msg">${a.message}</div>
          <div class="alert-time">${time}</div>
        </div>
        <button class="alert-del" onclick="deleteAlert(${a.id})">✕</button>
      </div>
    `;
  }).join('');

  // Mark all as read
  await api(`/api/alerts/read/${currentUser.id}`, 'PUT');
  loadAlertBadge();
}

async function deleteAlert(id) {
  await api(`/api/alerts/${id}`, 'DELETE');
  document.getElementById('alert-' + id)?.remove();

  // If list is now empty
  const list = document.getElementById('alerts-list');
  if (!list.querySelector('.alert-item')) {
    list.innerHTML = '<div class="empty-alerts">No alerts yet. Keep logging your health data!</div>';
  }
  loadAlertBadge();
}

document.getElementById('btn-mark-read').addEventListener('click', async () => {
  if (!currentUser) return;
  await api(`/api/alerts/read/${currentUser.id}`, 'PUT');
  document.querySelectorAll('.alert-item.unread').forEach(el => el.classList.remove('unread'));
  loadAlertBadge();
});

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});
