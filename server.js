require("dotenv").config();
const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const signals = [];
const sessions = new Map();

function normalizeText(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/ـ/g, "")
    .trim();
}

function detectDirection(text) {
  const t = normalizeText(text).toLowerCase();
  if (/\b(buy|long)\b/.test(t) || t.includes("شراء")) return "BUY";
  if (/\b(sell|short)\b/.test(t) || t.includes("بيع")) return "SELL";
  return null;
}

function detectEntry(text) {
  const t = normalizeText(text);
  const patterns = [
    /(?:امر\s+معلق\s+)?(?:شراء|buy|long)(?:\s+ذهب|\s+gold)?\s+(?:على\s+)?(\d+(?:\.\d+)?)/i,
    /(?:امر\s+معلق\s+)?(?:بيع|sell|short)(?:\s+ذهب|\s+gold)?\s+(?:على\s+)?(\d+(?:\.\d+)?)/i,
    /(?:دخول|entry)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i
  ];
  for (const pattern of patterns) {
    const match = t.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

function detectStop(text) {
  const match = normalizeText(text).match(/(?:ستوب|stop|sl)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function detectTarget(text) {
  const match = normalizeText(text).match(/(?:هدفك|هدف|target|tp)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function detectPips(text) {
  const match = normalizeText(text).match(/\+\s*(\d+(?:\.\d+)?)\s*(?:pip|pips|pipp)\b/i);
  return match ? Number(match[1]) : null;
}

function isCancel(text) {
  const t = normalizeText(text).toLowerCase();
  return t.includes("نلغي الامر") ||
    t.includes("الغاء الامر") ||
    t.includes("إلغاء الأمر") ||
    t.includes("ملغي") ||
    t.includes("الغاء") ||
    /\bcancel\b/i.test(t);
}

function currentSignal() {
  return signals.find(s => s.status === "PENDING" || s.status === "ACTIVE") || null;
}

function createSignal(direction, entry) {
  const now = new Date().toISOString();
  const signal = {
    id: crypto.randomUUID(),
    direction,
    entry,
    stop: null,
    target: null,
    status: "PENDING",
    profitUpdates: [],
    createdAt: now,
    updatedAt: now
  };
  signals.unshift(signal);
  return signal;
}

function processSignalMessage(text) {
  const original = String(text || "");
  const normalized = normalizeText(original);

  if (isCancel(normalized)) {
    const active = currentSignal();
    if (active) {
      active.status = "CANCELLED";
      active.updatedAt = new Date().toISOString();
    }
    return { type: "CANCEL", signal: active };
  }

  const direction = detectDirection(normalized);
  const entry = detectEntry(normalized);

  if (direction && entry !== null) {
    const old = currentSignal();
    if (old) {
      old.status = "REPLACED";
      old.updatedAt = new Date().toISOString();
    }
    return {
      type: "NEW_SIGNAL",
      signal: createSignal(direction, entry)
    };
  }

  const active = currentSignal();
  if (!active) return { type: "IGNORED", signal: null };

  const stop = detectStop(normalized);
  const target = detectTarget(normalized);
  const pips = detectPips(normalized);

  if (stop !== null) active.stop = stop;
  if (target !== null) active.target = target;

  if (stop !== null || target !== null || pips !== null) {
    active.status = "ACTIVE";
    active.updatedAt = new Date().toISOString();
  }

  if (pips !== null) {
    active.profitUpdates.push({
      pips,
      text: original,
      time: new Date().toISOString()
    });
  }

  return { type: "UPDATE", signal: active };
}

function createSession() {
  return crypto.randomBytes(32).toString("hex");
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  req.token = token;
  next();
}

app.get("/health", (req, res) => {
  res.json({ ok: true, app: "Phoenix HT Trading", version: "0.3.1" });
});

app.post("/api/login", (req, res) => {
  const username = String(req.body?.username || "");
  const password = String(req.body?.password || "");

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return res.status(500).json({ ok: false, error: "Login credentials are not configured." });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }

  const token = createSession();
  sessions.set(token, { username, role: "admin", createdAt: Date.now() });

  res.json({ ok: true, token, user: { username, role: "admin" } });
});

app.post("/api/logout", auth, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

app.get("/api/signals", auth, (req, res) => {
  res.json({ ok: true, signals });
});

app.post("/api/signals/process", auth, (req, res) => {
  const text = String(req.body?.text || "");
  if (!text) return res.status(400).json({ ok: false, error: "text is required" });
  res.json({ ok: true, result: processSignalMessage(text) });
});

app.post("/telegram/webhook", (req, res) => {
  try {
    const message =
      req.body?.channel_post ||
      req.body?.message ||
      req.body?.edited_channel_post ||
      req.body?.edited_message;

    if (message) {
      const text = message.text || message.caption || "";
      if (text) processSignalMessage(text);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Phoenix HT Trading</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#0b0f19;color:#fff;font-family:Arial,sans-serif}
.container{max-width:480px;margin:auto;padding:20px}
.card{background:#141a26;border:1px solid #252d3d;border-radius:18px;padding:20px;margin-top:30px}
h1{text-align:center;margin:0 0 8px}
.subtitle{text-align:center;color:#8d96a8;margin-bottom:22px}
input{width:100%;padding:14px;margin-top:10px;border-radius:12px;border:1px solid #30394c;background:#0d121c;color:#fff;font-size:16px}
button{width:100%;padding:14px;margin-top:14px;border:0;border-radius:12px;background:#2f7df6;color:#fff;font-size:16px;font-weight:bold}
button.secondary{background:#202a3d}
button.danger{background:#b52c3b}
.error{text-align:center;color:#ff6262;margin-top:12px}
.hidden{display:none}
.signal{background:#0e1420;border:1px solid #293348;border-radius:15px;padding:15px;margin-top:12px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #202839}
.row:last-child{border-bottom:0}
.badge{padding:5px 9px;border-radius:8px;background:#273149}
.empty{text-align:center;color:#8d96a8;padding:28px 0}
</style>
</head>
<body>
<div class="container">
<div id="loginCard" class="card">
<h1>🔥 Phoenix HT Trading</h1>
<div class="subtitle">تسجيل الدخول</div>
<input id="username" type="text" placeholder="اسم المستخدم" autocomplete="username">
<input id="password" type="password" placeholder="كلمة المرور" autocomplete="current-password">
<button id="loginBtn">دخول</button>
<div id="loginError" class="error"></div>
</div>
<div id="appCard" class="card hidden">
<h1>🔥 Phoenix HT Trading</h1>
<div class="subtitle">توصيات الذهب</div>
<button id="refreshBtn" class="secondary">تحديث التوصيات</button>
<button id="logoutBtn" class="danger">تسجيل الخروج</button>
<div id="signals"><div class="empty">لا توجد توصيات حالياً</div></div>
</div>
</div>
<script>
(function(){
var token=localStorage.getItem("phoenix_token")||"";
var loginCard=document.getElementById("loginCard");
var appCard=document.getElementById("appCard");
var loginError=document.getElementById("loginError");
var signalsBox=document.getElementById("signals");

function showApp(){loginCard.classList.add("hidden");appCard.classList.remove("hidden");loadSignals();}
function showLogin(){loginCard.classList.remove("hidden");appCard.classList.add("hidden");}

async function login(){
loginError.textContent="";
var username=document.getElementById("username").value.trim();
var password=document.getElementById("password").value;
if(!username||!password){loginError.textContent="عبّي اسم المستخدم وكلمة المرور";return;}
try{
var response=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:username,password:password})});
var data=await response.json();
if(!response.ok||!data.ok){loginError.textContent=data.error||"فشل تسجيل الدخول";return;}
token=data.token;localStorage.setItem("phoenix_token",token);showApp();
}catch(error){loginError.textContent="صار خطأ بالاتصال بالسيرفر";}
}

async function loadSignals(){
if(!token){showLogin();return;}
try{
var response=await fetch("/api/signals",{headers:{"Authorization":"Bearer "+token}});
if(response.status===401){token="";localStorage.removeItem("phoenix_token");showLogin();return;}
var data=await response.json();renderSignals(data.signals||[]);
}catch(error){signalsBox.innerHTML='<div class="empty">تعذر تحميل التوصيات</div>';}
}

function renderSignals(list){
if(!list.length){signalsBox.innerHTML='<div class="empty">لا توجد توصيات حالياً</div>';return;}
signalsBox.innerHTML=list.map(function(signal){
var updates=(signal.profitUpdates||[]).map(function(item){return "+"+item.pips+" pip";}).join(" → ");
return '<div class="signal">'+
'<div class="row"><span>النوع</span><b>'+escapeHtml(signal.direction)+'</b></div>'+
'<div class="row"><span>الدخول</span><b>'+value(signal.entry)+'</b></div>'+
'<div class="row"><span>Stop Loss</span><b>'+value(signal.stop)+'</b></div>'+
'<div class="row"><span>Target</span><b>'+value(signal.target)+'</b></div>'+
'<div class="row"><span>الحالة</span><span class="badge">'+escapeHtml(signal.status)+'</span></div>'+
'<div class="row"><span>الأرباح</span><b>'+escapeHtml(updates||"-")+'</b></div>'+
'</div>';
}).join("");
}

function value(v){return v===null||v===undefined?"-":escapeHtml(String(v));}
function escapeHtml(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}

async function logout(){
try{await fetch("/api/logout",{method:"POST",headers:{"Authorization":"Bearer "+token}});}catch(error){}
token="";localStorage.removeItem("phoenix_token");showLogin();
}

document.getElementById("loginBtn").addEventListener("click",login);
document.getElementById("refreshBtn").addEventListener("click",loadSignals);
document.getElementById("logoutBtn").addEventListener("click",logout);
document.getElementById("password").addEventListener("keydown",function(event){if(event.key==="Enter")login();});
if(token)showApp();else showLogin();
})();
</script>
</body>
</html>`);
});

app.listen(PORT,"0.0.0.0",function(){
  console.log("Phoenix HT Trading running on port "+PORT);
});
