require("dotenv").config();

const express = require("express");
const crypto = require("crypto");

const app = express();

app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// ===============================
// CONFIG
// ===============================

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.warn(
    "WARNING: ADMIN_USERNAME / ADMIN_PASSWORD are not configured."
  );
}

// ===============================
// MEMORY DATA
// ===============================

const signals = [];
const sessions = new Map();

// ===============================
// HELPERS
// ===============================

function normalizeText(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/ـ/g, "")
    .trim();
}

function getNumber(text) {
  const m = normalizeText(text).match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function detectDirection(text) {
  const t = normalizeText(text).toLowerCase();

  if (
    /\b(buy|long)\b/.test(t) ||
    t.includes("شراء") ||
    t.includes("شرا")
  ) {
    return "BUY";
  }

  if (
    /\b(sell|short)\b/.test(t) ||
    t.includes("بيع")
  ) {
    return "SELL";
  }

  return null;
}

function detectEntry(text) {
  const t = normalizeText(text);

  const patterns = [
    /(?:امر\s+معلق\s+)?(?:شراء|buy|long)(?:\s+ذهب|\s+gold)?\s+(?:على\s+)?(\d+(?:\.\d+)?)/i,
    /(?:امر\s+معلق\s+)?(?:بيع|sell|short)(?:\s+ذهب|\s+gold)?\s+(?:على\s+)?(\d+(?:\.\d+)?)/i,
    /(?:دخول|entry)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i
  ];

  for (const p of patterns) {
    const m = t.match(p);
    if (m) return Number(m[1]);
  }

  return null;
}

function detectStop(text) {
  const t = normalizeText(text);

  const m = t.match(
    /(?:ستوب|stop|sl)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i
  );

  return m ? Number(m[1]) : null;
}

function detectTarget(text) {
  const t = normalizeText(text);

  const m = t.match(
    /(?:هدفك|هدف|target|tp)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i
  );

  return m ? Number(m[1]) : null;
}

function detectPips(text) {
  const t = normalizeText(text);

  const m = t.match(
    /\+\s*(\d+(?:\.\d+)?)\s*(?:pip|pips|pipp|pips?)/i
  );

  return m ? Number(m[1]) : null;
}

function isCancel(text) {
  const t = normalizeText(text).toLowerCase();

  return (
    t.includes("نلغي الامر") ||
    t.includes("نلغي الأمر") ||
    t.includes("الغاء الامر") ||
    t.includes("إلغاء الأمر") ||
    t.includes("ملغي") ||
    t.includes("الغاء") ||
    /\bcancel\b/i.test(t)
  );
}

function createSignal(direction, entry) {
  const signal = {
    id: crypto.randomUUID(),
    direction,
    entry,
    stop: null,
    target: null,
    status: "PENDING",
    profitUpdates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  signals.unshift(signal);

  return signal;
}

function currentSignal() {
  return signals.find(
    s =>
      s.status === "PENDING" ||
      s.status === "ACTIVE"
  );
}

// ===============================
// TELEGRAM / MESSAGE PARSER
// ===============================

function processSignalMessage(text) {
  const originalText = String(text || "");
  const normalized = normalizeText(originalText);

  // Cancel current signal
  if (isCancel(normalized)) {
    const active = currentSignal();

    if (active) {
      active.status = "CANCELLED";
      active.updatedAt = new Date().toISOString();
    }

    return {
      type: "CANCEL",
      signal: active || null
    };
  }

  const direction = detectDirection(normalized);
  const entry = detectEntry(normalized);

  // New signal only when direction + entry are detected
  if (direction && entry !== null) {
    const old = currentSignal();

    if (old) {
      old.status = "REPLACED";
      old.updatedAt = new Date().toISOString();
    }

    const signal = createSignal(direction, entry);

    return {
      type: "NEW_SIGNAL",
      signal
    };
  }

  const active = currentSignal();

  if (!active) {
    return {
      type: "IGNORED",
      signal: null
    };
  }

  // Stop
  const stop = detectStop(normalized);

  if (stop !== null) {
    active.stop = stop;
    active.updatedAt = new Date().toISOString();
  }

  // Target
  const target = detectTarget(normalized);

  if (target !== null) {
    active.target = target;
    active.updatedAt = new Date().toISOString();
  }

  // Activate when stop or target is supplied
  if (
    (active.stop !== null || active.target !== null) &&
    active.status === "PENDING"
  ) {
    active.status = "ACTIVE";
  }

  // Profit update
  const pips = detectPips(normalized);

  if (pips !== null) {
    active.profitUpdates.push({
      pips,
      text: originalText,
      time: new Date().toISOString()
    });

    active.status = "ACTIVE";
    active.updatedAt = new Date().toISOString();
  }

  return {
    type: "UPDATE",
    signal: active
  };
}

// ===============================
// AUTH
// ===============================

function createSession() {
  return crypto.randomBytes(32).toString("hex");
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !sessions.has(token)) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized"
    });
  }

  req.user = sessions.get(token);
  next();
}

// ===============================
// API
// ===============================

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "Phoenix HT Trading",
    version: "0.3"
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return res.status(500).json({
      ok: false,
      error: "Login credentials are not configured on the server."
    });
  }

  if (
    username !== ADMIN_USERNAME ||
    password !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      ok: false,
      error: "اسم المستخدم أو كلمة المرور غير صحيحة"
    });
  }

  const token = createSession();

  sessions.set(token, {
    username,
    role: "admin",
    createdAt: Date.now()
  });

  res.json({
    ok: true,
    token,
    user: {
      username,
      role: "admin"
    }
  });
});

// Logout
app.post("/api/logout", auth, (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    sessions.delete(token);
  }

  res.json({
    ok: true
  });
});

// Get signals
app.get("/api/signals", auth, (req, res) => {
  res.json({
    ok: true,
    signals
  });
});

// Manually process a message
app.post("/api/signals/process", auth, (req, res) => {
  const text = req.body?.text;

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: "text is required"
    });
  }

  const result = processSignalMessage(text);

  res.json({
    ok: true,
    result
  });
});

// Telegram webhook
app.post("/telegram/webhook", (req, res) => {
  try {
    const message =
      req.body?.channel_post ||
      req.body?.message ||
      req.body?.edited_channel_post ||
      req.body?.edited_message;

    if (!message) {
      return res.json({ ok: true });
    }

    const text =
      message.text ||
      message.caption ||
      "";

    if (text) {
      processSignalMessage(text);
    }

    res.json({
      ok: true
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false
    });
  }
});

// ===============================
// WEB APP
// ===============================

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Phoenix HT Trading</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0b0f19;
  color: #fff;
}

.container {
  width: 100%;
  max-width: 480px;
  margin: auto;
  padding: 20px;
}

.card {
  background: #141a26;
  border: 1px solid #252d3d;
  border-radius: 18px;
  padding: 20px;
  margin-top: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
}

h1 {
  text-align: center;
  margin-bottom: 5px;
}

.subtitle {
  text-align: center;
  color: #8d96a8;
  margin-bottom: 25px;
}

input {
  width: 100%;
  padding: 14px;
  margin-top: 10px;
  border-radius: 12px;
  border: 1px solid #30394c;
  background: #0d121c;
  color: white;
  font-size: 16px;
}

button {
  width: 100%;
  border: 0;
  padding: 14px;
  margin-top: 15px;
  border-radius: 12px;
  background: #2f7df6;
  color: white;
  font-size: 16px;
  font-weight: bold;
}

button:active {
  transform: scale(.98);
}

.error {
  color: #ff6262;
  text-align: center;
  margin-top: 12px;
}

.hidden {
  display: none;
}

.signal {
  background: #0e1420;
  border: 1px solid #293348;
  border-radius: 15px;
  padding: 15px;
  margin-top: 12px;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  border-bottom: 1px solid #202839;
}

.row:last-child {
  border-bottom: 0;
}

.badge {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 8px;
  background: #273149;
}

.refresh {
  background: #202a3d;
}

.logout {
  background: #b52c3b;
}

.empty {
  text-align: center;
  color: #8d96a8;
  padding: 30px 0;
}
</style>
</head>

<body>

<div class="container">

  <div id="loginCard" class="card">

    <h1>🔥 Phoenix HT Trading</h1>

    <div class="subtitle">
      تسجيل الدخول
    </div>

    <input
      id="username"
      type="text"
      placeholder="اسم المستخدم"
      autocomplete="username"
    >

    <input
      id="password"
      type="password"
      placeholder="كلمة المرور"
      autocomplete="current-password"
    >

    <button onclick="login()">
      دخول
    </button>

    <div id="loginError" class="error"></div>

  </div>


  <div id="appCard" class="card hidden">

    <h1>🔥 Phoenix HT Trading</h1>

    <div class="subtitle">
      توصيات الذهب
    </div>

    <button class="refresh" onclick="loadSignals()">
      تحديث التوصيات
    </button>

    <button class="logout" onclick="logout()">
      تسجيل الخروج
    </button>

    <div id="signals">
      <div class="empty">
        لا توجد توصيات حالياً
      </div>
    </div>

  </div>

</div>

<script>

let token = localStorage.getItem("phoenix_token");

function showApp() {
  document.getElementById("loginCard").classList.add("hidden");
  document.getElementById("appCard").classList.remove("hidden");

  loadSignals();
}

function showLogin() {
  document.getElementById("loginCard").classList.remove("hidden");
  document.getElementById("appCard").classList.add("hidden");
}

async function login() {

  const username =
    document.getElementById("username").value.trim();

  const password =
    document.getElementById("password").value;

  const error =
    document.getElementById("loginError");

  error.textContent = "";

  if (!username || !password) {
    error.textContent =
      "عبّي اسم المستخدم وكلمة المرور";

    return;
  }

  try {

    const response = await fetch("/api/login", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      error.textContent =
        data.error || "فشل تسجيل الدخول";

      return;
    }

    token = data.token;

    localStorage.setItem(
      "phoenix_token",
      token
    );

    showApp();

  } catch (e) {

    error.textContent =
      "صار خطأ بالاتصال بالسيرفر";

  }
}

async function loadSignals() {

  if (!token) {
    showLogin();
    return;
  }

  try {

    const response = await fetch(
      "/api/signals",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("phoenix_token");
      token = null;
      showLogin();
      return;
    }

    const data = await response.json();

    renderSignals(data.signals || []);

  } catch (e) {

    document.getElementById("signals").innerHTML =
      '<div class="empty">تعذر تحميل التوصيات</div>';

  }
}

function renderSignals(signals) {

  const box =
    document.getElementById("signals");

  if (!signals.length) {

    box.innerHTML =
      '<div class="empty">لا توجد توصيات حالياً</div>';

    return;
  }

  box.innerHTML = signals.map(signal => {

    const updates =
      (signal.profitUpdates || [])
        .map(x => "+" + x.pips + " pip")
        .join(" → ");

    return \`
      <div class="signal">

        <div class="row">
          <span>النوع</span>
          <b>\${signal.direction}</b>
        </div>

        <div class="row">
          <span>الدخول</span>
          <b>\${signal.entry ?? "-"}</b>
        </div>

        <div class="row">
          <span>Stop Loss</span>
          <b>\${signal.stop ?? "-"}</b>
        </div>

        <div class="row">
          <span>Target</span>
          <b>\${signal.target ?? "-"}</b>
        </div>

        <div class="row">
          <span>الحالة</span>
          <span class="badge">
            \${signal.status}
          </span>
        </div>

        <div class="row">
          <span>الأرباح</span>
          <b>\${updates || "-"}</b>
        </div>

      </div>
    \`;

  }).join("");
}

async function logout() {

  try {

    await fetch("/api/logout", {
      method: "POST",

      headers: {
        Authorization: "Bearer " + token
      }
    });

  } catch(e) {}

  localStorage.removeItem("phoenix_token");

  token = null;

  showLogin();
}

if (token) {
  showApp();
} else {
  showLogin();
}

</script>

</body>
</html>
  `);
});

// ===============================
// START
// ===============================

app.listen(PORT, () => {
  console.log(
    `Phoenix HT Trading running on port ${PORT}`
  );
});
