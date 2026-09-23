require("dotenv").config();
const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// مصفوفة التوصيات في الذاكرة (مجانية وتعمل مباشرة على Render)
const signals = [
  {
    id: "demo-1",
    symbol: "XAUUSD",
    direction: "BUY",
    entry: 2650.00,
    stop: 2640.00,
    target: 2670.00,
    status: "ACTIVE",
    profitUpdates: [{ pips: 50, text: "+50 PIP", time: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// دالة معالجة النصوص وحل رموز الأرقام العربية
function normalize(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/ـ/g, "")
    .trim();
}

function getDirection(text) {
  const t = normalize(text).toLowerCase();
  if (t.includes("شراء") || /\b(buy|long)\b/.test(t)) return "BUY";
  if (t.includes("بيع") || /\b(sell|short)\b/.test(t)) return "SELL";
  return null;
}

function getEntry(text) {
  const t = normalize(text);
  const patterns = [
    /(?:شراء|buy|long)(?:\s+ذهب|\s+gold)?\s+(?:على\s+|from\s+|at\s+)?(\d+(?:\.\d+)?)/i,
    /(?:بيع|sell|short)(?:\s+ذهب|\s+gold)?\s+(?:على\s+|from\s+|at\s+)?(\d+(?:\.\d+)?)/i,
    /(?:دخول|entry)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i
  ];
  for (const pattern of patterns) {
    const match = t.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

function getStop(text) {
  const match = normalize(text).match(/(?:ستوب|stop|sl)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function getTarget(text) {
  const match = normalize(text).match(/(?:هدفك|هدف|target|tp|tp1)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function getPips(text) {
  const match = normalize(text).match(/\+\s*(\d+(?:\.\d+)?)\s*(?:pip|pips)\b/i);
  return match ? Number(match[1]) : null;
}

function isCancel(text) {
  const t = normalize(text).toLowerCase();
  return (
    t.includes("نلغي") ||
    t.includes("الغاء") ||
    t.includes("إلغاء") ||
    t.includes("ملغي") ||
    /\bcancel\b/i.test(t)
  );
}

function currentSignal() {
  return signals.find(s => s.status === "ACTIVE" || s.status === "PENDING") || null;
}

function createSignal(direction, entry) {
  const now = new Date().toISOString();
  const signal = {
    id: crypto.randomUUID(),
    symbol: "XAUUSD",
    direction,
    entry,
    stop: null,
    target: null,
    status: "ACTIVE",
    profitUpdates: [],
    createdAt: now,
    updatedAt: now
  };
  signals.unshift(signal);
  return signal;
}

function processSignal(text) {
  const original = String(text || "");
  const normalized = normalize(original);

  if (isCancel(normalized)) {
    const active = currentSignal();
    if (active) {
      active.status = "CANCELLED";
      active.updatedAt = new Date().toISOString();
    }
    return { type: "CANCEL", signal: active };
  }

  const direction = getDirection(normalized);
  const entry = getEntry(normalized);

  if (direction && entry !== null) {
    const old = currentSignal();
    if (old) {
      old.status = "CLOSED";
      old.updatedAt = new Date().toISOString();
    }
    const newSig = createSignal(direction, entry);
    const stop = getStop(normalized);
    const target = getTarget(normalized);
    if (stop !== null) newSig.stop = stop;
    if (target !== null) newSig.target = target;
    return { type: "NEW_SIGNAL", signal: newSig };
  }

  const active = currentSignal();
  if (!active) return { type: "IGNORED", signal: null };

  const stop = getStop(normalized);
  const target = getTarget(normalized);
  const pips = getPips(normalized);

  if (stop !== null) active.stop = stop;
  if (target !== null) active.target = target;

  if (stop !== null || target !== null || pips !== null) {
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

// API Routes
app.get("/health", (req, res) => {
  res.json({ ok: true, app: "Phoenix HT Trading", status: "Free Test Mode" });
});

app.get("/api/signals", (req, res) => {
  res.json({ ok: true, signals });
});

// مسار الاختبار المباشر (Manual Test Endpoint)
app.post("/api/signals/process", (req, res) => {
  const text = String(req.body?.text || "");
  if (!text) return res.status(400).json({ ok: false, error: "النص مطلوب" });
  const result = processSignal(text);
  res.json({ ok: true, result, signals });
});

// الواجهة الرئيسية للبرنامج
app.get("/", (req, res) => {
  res.type("html").send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#080B11">
<title>Phoenix HT Trading</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Tajawal', sans-serif; -webkit-tap-highlight-color: transparent; }
body { background: #080B11; color: #FFFFFF; min-height: 100vh; overflow-x: hidden; }
.hidden { display: none !important; }

.wrap { max-width: 480px; margin: auto; padding: 20px 16px 120px; }

/* Top Header */
.top-bar { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; }
.brand-title { display: flex; align-items: center; gap: 12px; }
.logo-box { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #E2B13C 0%, #8A6510 100%); display: grid; place-items: center; box-shadow: 0 4px 20px rgba(226, 177, 60, 0.25); }
.brand-name { font-weight: 900; font-size: 20px; letter-spacing: 0.5px; background: linear-gradient(180deg, #FFF 0%, #A3B1C2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.btn-icon { width: 42px; height: 42px; border: 1px solid rgba(255,255,255,0.08); background: #111622; color: #E2B13C; border-radius: 12px; font-size: 18px; cursor: pointer; display: grid; place-items: center; transition: 0.2s; }
.btn-icon:active { transform: scale(0.95); background: #182030; }

/* Banner */
.banner { border: 1px solid rgba(226, 177, 60, 0.2); background: linear-gradient(145deg, #121824 0%, #0B0E17 100%); border-radius: 20px; padding: 20px; margin-bottom: 20px; position: relative; overflow: hidden; }
.banner-sub { color: #E2B13C; font-size: 11px; font-weight: 800; letter-spacing: 1px; }
.banner-title { font-size: 24px; font-weight: 800; margin: 4px 0; color: #FFF; }
.banner-desc { color: #7A8B9E; font-size: 13px; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
.stat-card { background: #111622; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 12px; text-align: center; }
.stat-card b { display: block; font-size: 22px; font-weight: 800; color: #E2B13C; }
.stat-card span { color: #6C7D93; font-size: 11px; font-weight: 700; }

/* Section Header */
.sec-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 4px; }
.sec-head h3 { font-size: 17px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 8px; }
.sec-head span { color: #6C7D93; font-size: 12px; }

/* Signal Card UI */
.signal-card { background: #111622; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 18px; margin-bottom: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.signal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.direction-tag { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 18px; }
.direction-tag.buy { color: #00E676; }
.direction-tag.sell { color: #FF5252; }
.status-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; background: #1A2232; color: #8C9CAE; }
.status-badge.active { background: rgba(0, 230, 118, 0.15); color: #00E676; border: 1px solid rgba(0, 230, 118, 0.3); }

/* Details Grid */
.grid-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
.cell { background: #18202F; padding: 10px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.03); }
.cell span { display: block; color: #6C7D93; font-size: 11px; font-weight: 700; margin-bottom: 4px; }
.cell b { font-size: 15px; font-weight: 800; color: #FFF; }
.cell.tp b { color: #00E676; }
.cell.sl b { color: #FF5252; }

/* Profit Badges */
.pips-box { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); }
.pip-badge { background: linear-gradient(135deg, rgba(226, 177, 60, 0.2) 0%, rgba(226, 177, 60, 0.05) 100%); border: 1px solid rgba(226, 177, 60, 0.4); color: #FFD700; font-weight: 800; padding: 6px 12px; border-radius: 10px; font-size: 12px; display: flex; align-items: center; gap: 4px; }

/* Test Panel Box */
.test-panel { background: #111622; border: 1px dashed rgba(226, 177, 60, 0.4); border-radius: 20px; padding: 16px; margin-top: 24px; }
.test-panel h4 { color: #E2B13C; font-size: 15px; font-weight: 800; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.test-input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: #080B11; color: #FFF; font-size: 13px; outline: none; margin-bottom: 10px; }
.test-btns { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.btn-test { padding: 10px; border: none; border-radius: 10px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; }
.btn-test.green { background: rgba(0, 230, 118, 0.2); color: #00E676; border: 1px solid rgba(0, 230, 118, 0.4); }
.btn-test.red { background: rgba(255, 82, 82, 0.2); color: #FF5252; border: 1px solid rgba(255, 82, 82, 0.4); }
.btn-test.gold { background: rgba(226, 177, 60, 0.2); color: #FFD700; border: 1px solid rgba(226, 177, 60, 0.4); grid-column: span 2; }

/* Empty state */
.empty-box { border: 2px dashed rgba(255,255,255,0.08); border-radius: 20px; padding: 32px 16px; text-align: center; color: #6C7D93; font-size: 14px; }

/* Nav Bar Bottom */
.nav-bottom { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: min(480px, 100%); padding: 10px 16px 16px; background: rgba(8, 11, 17, 0.95); backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,0.08); display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; z-index: 100; }
.nav-item { border: none; background: transparent; color: #6C7D93; padding: 8px; border-radius: 12px; font-weight: 700; font-size: 11px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: 0.2s; }
.nav-item.active { color: #E2B13C; background: rgba(226, 177, 60, 0.1); }
.nav-item i { font-size: 18px; font-style: normal; }
</style>
</head>
<body>

<div class="wrap">
  
  <!-- Top Bar -->
  <div class="top-bar">
    <div class="brand-title">
      <div class="logo-box"><span style="font-size:20px;">🦅</span></div>
      <div class="brand-name">PHOENIX HT</div>
    </div>
    <button class="btn-icon" id="refreshBtn">↻</button>
  </div>

  <!-- Banner -->
  <div class="banner">
    <div class="banner-sub">PHOENIX TRADING</div>
    <div class="banner-title">توصيات الذهب XAUUSD</div>
    <div class="banner-desc">تحديثات فورية ومباشرة بدون تعقيد</div>
  </div>

  <!-- Stats -->
  <div class="stats-grid">
    <div class="stat-card"><b id="activeCount">0</b><span>نشطة</span></div>
    <div class="stat-card"><b id="closedCount">0</b><span>المغلقة</span></div>
    <div class="stat-card"><b id="totalCount">0</b><span>الإجمالي</span></div>
  </div>

  <!-- الرئيسية -->
  <div id="homeView">
    <div class="sec-head">
      <h3>🔥 التوصية الحالية</h3>
      <span id="lastUpdate">—</span>
    </div>
    <div id="activeBox"></div>

    <!-- لوحة تجربة الأوامر -->
    <div class="test-panel">
      <h4>🛠️ لوحة تجربة الأوامر (تحديث فوري)</h4>
      <input id="customText" class="test-input" placeholder="أدخل نص التوصية للتجربة..." value="شراء ذهب على 2660 SL 2648 TP 2685">
      <div class="test-btns">
        <button class="btn-test green" onclick="sendTestText('شراء ذهب 2665 SL 2650 TP 2690')">🟢 إرسال توصية شراء</button>
        <button class="btn-test red" onclick="sendTestText('بيع ذهب 2670 SL 2682 TP 2645')">🔴 إرسال توصية بيع</button>
        <button class="btn-test gold" onclick="sendTestText('+50 PIP')">💰 إضافة تحديث +50 PIP</button>
        <button class="btn-test gold" onclick="sendTestText('+80 PIP')">💰 إضافة تحديث +80 PIP</button>
        <button class="btn-test red" style="grid-column: span 2;" onclick="sendTestText('إلغاء الأمر')">❌ إلغاء التوصية الحالية</button>
      </div>
    </div>
  </div>

  <!-- سجل التوصيات -->
  <div id="historyView" class="hidden">
    <div class="sec-head">
      <h3>📜 سجل التوصيات</h3>
      <span>الأحدث أولاً</span>
    </div>
    <div id="historyBox"></div>
  </div>

</div>

<!-- Nav Bar Bottom -->
<div class="nav-bottom">
  <button class="nav-item active" id="homeNav"><i>🏠</i>الرئيسية</button>
  <button class="nav-item" id="historyNav"><i>📜</i>السجل</button>
  <button class="nav-item" id="refreshNav"><i>🔄</i>تحديث</button>
</div>

<script>
let signals = [];

const $ = id => document.getElementById(id);

async function loadSignals(){
  try {
    const res = await fetch("/api/signals");
    const data = await res.json();
    signals = data.signals || [];
    render();
  } catch(e) {
    $("activeBox").innerHTML = '<div class="empty-box">خطأ في الاتصال بالسيرفر</div>';
  }
}

async function sendTestText(textToSend){
  const text = textToSend || $("customText").value;
  if(!text) return;
  try {
    const res = await fetch("/api/signals/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    signals = data.signals || [];
    render();
  } catch(e) {
    alert("فشل إرسال التوصية للتجربة");
  }
}

function render(){
  const active = signals.filter(s => s.status === "ACTIVE" || s.status === "PENDING");
  const closed = signals.filter(s => s.status !== "ACTIVE" && s.status !== "PENDING");

  $("activeCount").textContent = active.length;
  $("closedCount").textContent = closed.length;
  $("totalCount").textContent = signals.length;

  $("lastUpdate").textContent = signals[0] ? formatTime(signals[0].updatedAt) : "—";

  if(!active.length){
    $("activeBox").innerHTML = '<div class="empty-box">لا توجد توصية نشطة حالياً<br><small style="color:#4A5B6D">استخدم لوحة التجربة بالأسفل لإضافة توصية</small></div>';
  } else {
    $("activeBox").innerHTML = active.map(createCard).join("");
  }

  if(!closed.length){
    $("historyBox").innerHTML = '<div class="empty-box">السجل فارغ حالياً</div>';
  } else {
    $("historyBox").innerHTML = closed.map(createCard).join("");
  }
}

function createCard(signal){
  const isBuy = signal.direction === "BUY";
  const dirClass = isBuy ? "buy" : "sell";
  const dirIcon = isBuy ? "🟢 BUY" : "🔴 SELL";

  const statusMap = {
    ACTIVE: "نشطة",
    PENDING: "معلقة",
    CANCELLED: "ملغاة",
    CLOSED: "مغلقة"
  };

  const updates = (signal.profitUpdates || []).map(x => `<div class="pip-badge">💰 +${x.pips} PIP</div>`).join("");

  return `
    <div class="signal-card">
      <div class="signal-header">
        <div class="direction-tag ${dirClass}">
          ${dirIcon}${signal.symbol}
        </div>
        <span class="status-badge ${signal.status === 'ACTIVE' ? 'active' : ''}">
          ${statusMap[signal.status] || signal.status}
        </span>
      </div>

      <div class="grid-details">
        <div class="cell">
          <span>Entry</span>
          <b>${val(signal.entry)}</b>
        </div>
        <div class="cell sl">
          <span>Stop Loss</span>
          <b>${val(signal.stop)}</b>
        </div>
        <div class="cell tp">
          <span>Target</span>
          <b>${val(signal.target)}</b>
        </div>
      </div>

      ${updates ? `<div class="pips-box">${updates}</div>` : ''}
    </div>
  `;
}

function val(v) { return (v === null || v === undefined) ? "—" : v; }

function formatTime(v){
  if(!v) return "—";
  try {
    return new Date(v).toLocaleTimeString("ar-LB", { hour: "2-digit", minute: "2-digit" });
  } catch(e) { return "—"; }
}

function showHome(){
  $("homeView").classList.remove("hidden");
  $("historyView").classList.add("hidden");
  $("homeNav").classList.add("active");
  $("historyNav").classList.remove("active");
}

function showHistory(){
  $("homeView").classList.add("hidden");
  $("historyView").classList.remove("hidden");
  $("homeNav").classList.remove("active");
  $("historyNav").classList.add("active");
}

// Events
$("refreshBtn").addEventListener("click", loadSignals);
$("refreshNav").addEventListener("click", loadSignals);
$("homeNav").addEventListener("click", showHome);
$("historyNav").addEventListener("click", showHistory);

// أول تحميل
loadSignals();

// التحديث التلقائي كل 5 ثوانٍ
setInterval(loadSignals, 5000);
</script>
</body>
</html>
  `);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Phoenix HT Trading running on port " + PORT);
});
