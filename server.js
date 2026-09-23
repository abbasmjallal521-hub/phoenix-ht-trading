require("dotenv").config();
const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// بيانات تجريبية أولية مطابقة للصورة
const signals = [
  {
    id: "sig-1",
    symbol: "XAUUSD",
    direction: "BUY",
    entry: 3648.00,
    stop: 3642.00,
    tp1: 3654.00,
    tp2: 3660.00,
    status: "ACTIVE",
    timeAgo: "2h ago",
    confidence: "7/7 (A+)",
    analysisText: "XAUUSD is showing bullish momentum on the 5M chart. Price respected the demand zone and broke the recent high. We are looking for a continuation towards TP1 and TP2 if momentum holds.",
    profitUpdates: [{ pips: 50, text: "+50 PIP", time: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "sig-2",
    symbol: "GBPUSD",
    direction: "SELL",
    entry: 1.2630,
    stop: 1.2670,
    tp1: 1.2580,
    tp2: 1.2530,
    status: "ACTIVE",
    timeAgo: "5h ago",
    confidence: "6/7 (A)",
    analysisText: "GBPUSD facing strong resistance at 1.2670 level. Expecting a pullback towards lower targets.",
    profitUpdates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "sig-3",
    symbol: "XAUUSD",
    direction: "SELL",
    entry: 3665.00,
    stop: 3671.00,
    tp1: 3658.00,
    tp2: 3652.00,
    status: "TP_HIT",
    timeAgo: "7h ago",
    confidence: "7/7 (A+)",
    analysisText: "Gold hit TP1 perfectly after liquidity sweep at equal highs.",
    profitUpdates: [{ pips: 70, text: "+70 PIP", time: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "sig-4",
    symbol: "EURUSD",
    direction: "BUY",
    entry: 1.0780,
    stop: 1.0740,
    tp1: 1.0820,
    tp2: 1.0860,
    status: "SL_HIT",
    timeAgo: "9h ago",
    confidence: "5/7 (B+)",
    analysisText: "EURUSD stopped out due to high impact news volatility.",
    profitUpdates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const analyses = [
  {
    id: "an-1",
    title: "Gold Analysis - 5M",
    symbol: "XAUUSD | 5M",
    date: "9 Sep 2025",
    timeAgo: "4h ago",
    text: "Gold is showing strong bullish momentum above the key support zone. As long as price holds above 3635, we could see a push towards 3655 - 3670..."
  },
  {
    id: "an-2",
    title: "Market Overview",
    symbol: "GLOBAL MARKETS",
    date: "9 Sep 2025",
    timeAgo: "6h ago",
    text: "Key levels, trend and important news for today's trading session across indices and forex pairs."
  },
  {
    id: "an-3",
    title: "Forex Analysis",
    symbol: "EURUSD, GBPUSD, USDJPY",
    date: "8 Sep 2025",
    timeAgo: "1d ago",
    text: "Weekly forex structure analysis and high probability setup zones for major pairs."
  }
];

const chatQuestions = [
  {
    id: "q-1",
    author: "Ahmad",
    timeAgo: "2h ago",
    question: "Why did we enter Buy on XAUUSD here?",
    answer: "Because price formed a bullish Fair Value Gap on the 5M chart following liquidity sweep."
  },
  {
    id: "q-2",
    author: "Zeinab",
    timeAgo: "4h ago",
    question: "What are the key levels for gold today?",
    answer: "Support sits at 3635 - 3640, and resistance at 3670 - 3680."
  },
  {
    id: "q-3",
    author: "Ali",
    timeAgo: "6h ago",
    question: "Can you explain the analysis for EURUSD?",
    answer: "EURUSD is retesting a daily order block, looking for bullish confirmation."
  }
];

// دالة معالجة النصوص
function normalize(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/ـ/g, "")
    .trim();
}

function processSignalText(text) {
  const norm = normalize(text);
  const t = norm.toLowerCase();
  
  let direction = null;
  if (t.includes("شراء") || /\b(buy|long)\b/.test(t)) direction = "BUY";
  if (t.includes("بيع") || /\b(sell|short)\b/.test(t)) direction = "SELL";

  let entry = null;
  const matchEntry = norm.match(/(?:دخول|buy|sell|شراء|بيع)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
  if (matchEntry) entry = Number(matchEntry[1]);

  if (direction && entry) {
    const newSig = {
      id: crypto.randomUUID(),
      symbol: "XAUUSD",
      direction,
      entry,
      stop: entry - 6,
      tp1: entry + 6,
      tp2: entry + 12,
      status: "ACTIVE",
      timeAgo: "Just now",
      confidence: "7/7 (A+)",
      analysisText: "New signal created via live test panel.",
      profitUpdates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    signals.unshift(newSig);
    return newSig;
  }
  return null;
}

// Routes
app.get("/health", (req, res) => {
  res.json({ ok: true, app: "Phoenix HT Trading", status: "Full UI Running" });
});

app.get("/api/data", (req, res) => {
  res.json({ ok: true, signals, analyses, chatQuestions });
});

app.post("/api/signals/process", (req, res) => {
  const text = String(req.body?.text || "");
  const result = processSignalText(text);
  res.json({ ok: true, result, signals });
});

app.post("/api/chat/ask", (req, res) => {
  const question = String(req.body?.question || "");
  if (question) {
    chatQuestions.unshift({
      id: crypto.randomUUID(),
      author: "You",
      timeAgo: "Just now",
      question,
      answer: "Under review by Phoenix HT analysts..."
    });
  }
  res.json({ ok: true, chatQuestions });
});

// Front-end Render
app.get("/", (req, res) => {
  res.type("html").send(getHTMLContent());
});

function getHTMLContent() {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#090d16">
<title>Phoenix HT Trading</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
body { background: #090d16; color: #FFFFFF; min-height: 100vh; overflow-x: hidden; }
.hidden { display: none !important; }

/* Phone Frame Container */
.app-viewport { max-width: 440px; margin: auto; padding: 16px 16px 100px; min-height: 100vh; }

/* Top Header Bar */
.app-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 20px; }
.header-brand { display: flex; align-items: center; gap: 10px; }
.brand-logo-icon { width: 38px; height: 38px; border-radius: 12px; background: linear-gradient(135deg, #e2b13c 0%, #8a6510 100%); display: grid; place-items: center; font-size: 20px; box-shadow: 0 4px 15px rgba(226, 177, 60, 0.3); }
.brand-text { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; color: #FFF; display: flex; flex-direction: column; line-height: 1.1; }
.brand-text span { font-size: 9px; color: #e2b13c; letter-spacing: 2px; font-weight: 800; }
.header-actions { display: flex; gap: 10px; }
.icon-btn { width: 38px; height: 38px; border-radius: 12px; background: #121826; border: 1px solid rgba(255,255,255,0.08); color: #FFF; display: grid; place-items: center; font-size: 16px; cursor: pointer; }

/* Hero Banner */
.hero-banner { background: linear-gradient(135deg, #171f30 0%, #0d121d 100%); border: 1px solid rgba(226, 177, 60, 0.25); border-radius: 20px; padding: 20px; margin-bottom: 20px; position: relative; overflow: hidden; }
.hero-banner::after { content: '🦅'; position: absolute; right: -10px; bottom: -10px; font-size: 90px; opacity: 0.08; pointer-events: none; }
.banner-badge { font-size: 10px; font-weight: 800; color: #e2b13c; letter-spacing: 1px; margin-bottom: 6px; }
.banner-title { font-size: 20px; font-weight: 800; color: #FFF; margin-bottom: 6px; line-height: 1.2; }
.banner-sub { font-size: 12px; color: #8994a7; }

/* Section Title */
.sec-title { font-size: 15px; font-weight: 800; color: #FFF; margin: 18px 0 12px; display: flex; justify-content: space-between; align-items: center; }
.sec-title span { font-size: 12px; color: #8994a7; font-weight: 500; }

/* Filter Tabs */
.filter-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 12px; scrollbar-width: none; }
.filter-pill { padding: 8px 16px; border-radius: 20px; background: #121826; border: 1px solid rgba(255,255,255,0.06); color: #8994a7; font-size: 12px; font-weight: 700; cursor: pointer; whitespace: nowrap; transition: 0.2s; }
.filter-pill.active { background: #e2b13c; color: #000; border-color: #e2b13c; }

/* Signal Card (Exact Image 2 Style) */
.sig-card { background: #121826; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 16px; margin-bottom: 12px; transition: 0.2s; cursor: pointer; }
.sig-card:active { transform: scale(0.98); }
.sig-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.sig-pair { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 15px; }
.badge-dir { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 900; }
.badge-dir.buy { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
.badge-dir.sell { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
.sig-time { font-size: 11px; color: #64748b; }
.badge-status { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
.badge-status.active { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
.badge-status.tp_hit { background: rgba(226, 177, 60, 0.15); color: #e2b13c; border: 1px solid rgba(226, 177, 60, 0.3); }
.badge-status.sl_hit { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

.sig-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #0b0f17; padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03); }
.sig-cell { text-align: center; }
.sig-cell label { display: block; font-size: 10px; color: #64748b; font-weight: 700; margin-bottom: 2px; }
.sig-cell val { font-size: 12px; font-weight: 800; color: #FFF; }

/* Analysis Card */
.an-card { background: #121826; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 16px; margin-bottom: 12px; }
.an-title { font-size: 15px; font-weight: 800; color: #FFF; margin-bottom: 4px; }
.an-meta { font-size: 11px; color: #e2b13c; margin-bottom: 8px; font-weight: 700; }
.an-desc { font-size: 12px; color: #8994a7; line-height: 1.5; margin-bottom: 12px; }
.btn-outline { width: 100%; padding: 10px; border-radius: 10px; background: transparent; border: 1px solid #e2b13c; color: #e2b13c; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; }
.btn-outline:active { background: rgba(226, 177, 60, 0.1); }

/* Chat Card */
.chat-card { background: #121826; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px; margin-bottom: 10px; }
.chat-user { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.chat-name { font-weight: 800; font-size: 13px; color: #FFF; }
.chat-time { font-size: 10px; color: #64748b; }
.chat-q { font-size: 12px; color: #cbd5e1; margin-bottom: 8px; }
.chat-a { background: #0b0f17; padding: 8px 12px; border-radius: 8px; font-size: 11px; color: #e2b13c; border-left: 3px solid #e2b13c; }

/* Profile & VIP Screen */
.profile-card { background: #121826; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 20px; text-align: center; margin-bottom: 16px; }
.avatar-box { width: 64px; height: 64px; border-radius: 50%; background: #1e293b; color: #e2b13c; font-size: 28px; display: grid; place-items: center; margin: 0 auto 10px; border: 2px solid #e2b13c; }
.profile-name { font-size: 18px; font-weight: 800; }
.profile-handle { font-size: 12px; color: #64748b; margin-bottom: 12px; }

.vip-box { background: linear-gradient(145deg, #1f180c 0%, #110e08 100%); border: 1px solid rgba(226, 177, 60, 0.4); border-radius: 20px; padding: 20px; text-align: center; margin-bottom: 16px; }
.vip-title { font-size: 22px; font-weight: 900; color: #e2b13c; margin-bottom: 6px; }
.vip-feature-list { text-align: left; margin: 16px 0; display: flex; flex-direction: column; gap: 8px; }
.vip-item { font-size: 12px; color: #cbd5e1; display: flex; align-items: center; gap: 8px; }
.vip-item::before { content: '✓'; color: #e2b13c; font-weight: 900; }

.btn-gold { width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, #e2b13c 0%, #a87a18 100%); border: none; color: #000; font-weight: 900; font-size: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(226, 177, 60, 0.25); }

/* Menu Rows */
.menu-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #121826; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #FFF; cursor: pointer; }
.menu-row span { color: #8994a7; font-size: 11px; }

/* Modal Popup for Signal Details */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: grid; place-items: center; padding: 20px; z-index: 200; }
.modal-card { width: min(400px, 100%); background: #121826; border: 1px solid rgba(226, 177, 60, 0.3); border-radius: 24px; padding: 20px; position: relative; }
.modal-close { position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: #8994a7; font-size: 20px; cursor: pointer; }

/* Mini Chart Graphic SVG */
.chart-box { width: 100%; height: 140px; background: #0b0f17; border-radius: 14px; margin: 14px 0; padding: 10px; display: flex; align-items: center; justify-content: center; position: relative; border: 1px solid rgba(255,255,255,0.05); }

/* Bottom Navigation Bar (Exact 5 Tabs) */
.nav-bottom-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: min(440px, 100%); padding: 10px 12px 14px; background: rgba(9, 13, 22, 0.95); backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,0.08); display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; z-index: 100; }
.nav-tab { border: none; background: transparent; color: #64748b; padding: 6px; border-radius: 12px; font-weight: 700; font-size: 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: 0.2s; }
.nav-tab.active { color: #e2b13c; background: rgba(226, 177, 60, 0.1); }
.nav-tab i { font-size: 18px; font-style: normal; }

/* Test Panel Box */
.test-panel { background: #121826; border: 1px dashed rgba(226, 177, 60, 0.4); border-radius: 16px; padding: 14px; margin-top: 20px; }
.test-panel h4 { color: #e2b13c; font-size: 13px; font-weight: 800; margin-bottom: 8px; }
.test-input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #090d16; color: #FFF; font-size: 12px; outline: none; margin-bottom: 8px; }
.test-btn-group { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.btn-sm { padding: 8px; border-radius: 8px; font-weight: 800; font-size: 11px; border: none; cursor: pointer; }
.btn-sm.green { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.btn-sm.red { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
</style>
</head>
<body>

<div class="app-viewport">

  <!-- Top Header -->
  <div class="app-header">
    <div class="header-brand">
      <div class="brand-logo-icon">🦅</div>
      <div class="brand-text">
        PHOENIX HT
        <span>TRADING</span>
      </div>
    </div>
    <div class="header-actions">
      <div class="icon-btn" onclick="switchTab('profile')">🔔</div>
    </div>
  </div>

  <!-- TAB 1: HOME -->
  <div id="tab-home">
    <div class="hero-banner">
      <div class="banner-badge">DAILY ANALYSIS & TRADING SIGNALS</div>
      <div class="banner-title">Trade Smarter, Not Harder</div>
      <div class="banner-sub">Stay ahead. Trade with confidence.</div>
    </div>

    <div class="sec-title">
      Latest Signal
      <span onclick="switchTab('signals')">View All →</span>
    </div>
    <div id="homeLatestSignal"></div>

    <div class="sec-title">
      Latest Analysis
      <span onclick="switchTab('analysis')">View All →</span>
    </div>
    <div id="homeLatestAnalysis"></div>

    <!-- Quick Test Bar -->
    <div class="test-panel">
      <h4>🛠️ Quick Signal Test Panel</h4>
      <input id="quickInput" class="test-input" value="شراء ذهب على 3650 SL 3644 TP 3662">
      <div class="test-btn-group">
        <button class="btn-sm green" onclick="sendQuickTest('شراء ذهب 3655 SL 3648 TP 3670')">+ BUY Signal</button>
        <button class="btn-sm red" onclick="sendQuickTest('بيع ذهب 3660 SL 3668 TP 3645')">+ SELL Signal</button>
      </div>
    </div>
  </div>

  <!-- TAB 2: SIGNALS -->
  <div id="tab-signals" class="hidden">
    <div class="sec-title" style="margin-top:0;">Free Signals</div>
    <div class="filter-scroll">
      <div class="filter-pill active" onclick="filterSignals('ALL', this)">All</div>
      <div class="filter-pill" onclick="filterSignals('ACTIVE', this)">Active</div>
      <div class="filter-pill" onclick="filterSignals('TP_HIT', this)">TP/SL</div>
      <div class="filter-pill" onclick="filterSignals('CLOSED', this)">Closed</div>
    </div>
    <div id="signalsList"></div>
  </div>

  <!-- TAB 3: ANALYSIS -->
  <div id="tab-analysis" class="hidden">
    <div class="sec-title" style="margin-top:0;">Market Analysis</div>
    <div class="filter-scroll">
      <div class="filter-pill active">All</div>
      <div class="filter-pill">Gold</div>
      <div class="filter-pill">Forex</div>
      <div class="filter-pill">Market</div>
    </div>
    <div id="analysisList"></div>
  </div>

  <!-- TAB 4: CHAT -->
  <div id="tab-chat" class="hidden">
    <div class="sec-title" style="margin-top:0;">Questions / Chat</div>
    <input id="chatInput" class="test-input" placeholder="Ask a question about signals..." style="padding:12px;">
    <button class="btn-gold" style="margin-bottom:16px; padding:10px;" onclick="submitQuestion()">Ask a Question</button>
    <div id="chatList"></div>
  </div>

  <!-- TAB 5: PROFILE -->
  <div id="tab-profile" class="hidden">
    <div class="profile-card">
      <div class="avatar-box">👤</div>
      <div class="profile-name">Abbas Mjallal</div>
      <div class="profile-handle">@abbasmj</div>
      <div style="font-size:11px; background:#1e293b; color:#e2b13c; padding:4px 12px; border-radius:12px; display:inline-block; font-weight:800;">Free Plan</div>
    </div>

    <div class="vip-box">
      <div class="vip-title">👑 VIP Coming Soon</div>
      <div style="font-size:12px; color:#8994a7;">Get premium signals, advanced analysis, private chat and more.</div>
      <div class="vip-feature-list">
        <div class="vip-item">VIP Signals (higher accuracy)</div>
        <div class="vip-item">Advanced Analysis</div>
        <div class="vip-item">Real-time Notifications</div>
        <div class="vip-item">VIP Chat (direct)</div>
        <div class="vip-item">Exclusive Content & Priority Support</div>
      </div>
      <button class="btn-gold" onclick="alert('You are registered for VIP notification!')">Notify Me</button>
    </div>

    <div class="menu-row">Subscription <span>Free Plan</span></div>
    <div class="menu-row">Notifications <span>On</span></div>
    <div class="menu-row">Language <span>English ></span></div>
    <div class="menu-row">Help & Support</div>
    <div class="menu-row">About Phoenix HT Trading</div>
  </div>

</div>

<!-- Signal Details Modal -->
<div id="detailsModal" class="modal-overlay hidden">
  <div class="modal-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div id="modalContent"></div>
  </div>
</div>

<!-- Bottom Navigation Bar (Exact 5 Tabs from Image 2) -->
<div class="nav-bottom-bar">
  <button class="nav-tab active" id="btn-home" onclick="switchTab('home')"><i>🏠</i>Home</button>
  <button class="nav-tab" id="btn-signals" onclick="switchTab('signals')"><i>📊</i>Signals</button>
  <button class="nav-tab" id="btn-analysis" onclick="switchTab('analysis')"><i>📈</i>Analysis</button>
  <button class="nav-tab" id="btn-chat" onclick="switchTab('chat')"><i>💬</i>Chat</button>
  <button class="nav-tab" id="btn-profile" onclick="switchTab('profile')"><i>👤</i>Profile</button>
</div>

<script>
var appData = { signals: [], analyses: [], chatQuestions: [] };
var currentFilter = 'ALL';

function loadData() {
  fetch('/api/data')
    .then(function(res){ return res.json(); })
    .then(function(data){
      if(data.ok){
        appData = data;
        renderAll();
      }
    });
}

function renderAll() {
  renderHome();
  renderSignals();
  renderAnalysis();
  renderChat();
}

function renderHome() {
  var activeSig = appData.signals[0];
  var homeSigBox = document.getElementById('homeLatestSignal');
  if(activeSig){
    homeSigBox.innerHTML = createSignalCardHTML(activeSig);
  } else {
    homeSigBox.innerHTML = '<div style="color:#64748b; font-size:12px; padding:10px;">No active signal</div>';
  }

  var latestAn = appData.analyses[0];
  var homeAnBox = document.getElementById('homeLatestAnalysis');
  if(latestAn){
    homeAnBox.innerHTML = '<div class="an-card">' +
      '<div class="an-title">' + latestAn.title + '</div>' +
      '<div class="an-meta">' + latestAn.symbol + ' • ' + latestAn.timeAgo + '</div>' +
      '<div class="an-desc">' + latestAn.text + '</div>' +
      '<button class="btn-outline" onclick="switchTab(\'analysis\')">View Analysis</button>' +
    '</div>';
  }
}

function renderSignals() {
  var list = appData.signals;
  if(currentFilter !== 'ALL') {
    list = list.filter(function(s){ return s.status === currentFilter; });
  }
  var container = document.getElementById('signalsList');
  if(!list.length) {
    container.innerHTML = '<div style="color:#64748b; font-size:13px; text-align:center; padding:30px;">No signals found</div>';
    return;
  }
  container.innerHTML = list.map(createSignalCardHTML).join('');
}

function createSignalCardHTML(sig) {
  var isBuy = sig.direction === 'BUY';
  var dirClass = isBuy ? 'buy' : 'sell';
  var statusClass = sig.status.toLowerCase();

  return '<div class="sig-card" onclick="openSignalDetails(\'' + sig.id + '\')">' +
    '<div class="sig-head">' +
      '<div class="sig-pair">' + sig.symbol + ' <span class="badge-dir ' + dirClass + '">' + sig.direction + '</span></div>' +
      '<div class="badge-status ' + statusClass + '">' + sig.status.replace('_', ' ') + '</div>' +
    '</div>' +
    '<div class="sig-grid">' +
      '<div class="sig-cell"><label>Entry</label><val>' + sig.entry + '</val></div>' +
      '<div class="sig-cell"><label>SL</label><val>' + sig.stop + '</val></div>' +
      '<div class="sig-cell"><label>TP1</label><val>' + sig.tp1 + '</val></div>' +
      '<div class="sig-cell"><label>TP2</label><val>' + sig.tp2 + '</val></div>' +
    '</div>' +
  '</div>';
}

function renderAnalysis() {
  var container = document.getElementById('analysisList');
  container.innerHTML = appData.analyses.map(function(an){
    return '<div class="an-card">' +
      '<div class="an-title">' + an.title + '</div>' +
      '<div class="an-meta">' + an.symbol + ' • ' + an.date + '</div>' +
      '<div class="an-desc">' + an.text + '</div>' +
      '<button class="btn-outline" onclick="alert(\'Opening full chart analysis...\')">Read More</button>' +
    '</div>';
  }).join('');
}

function renderChat() {
  var container = document.getElementById('chatList');
  container.innerHTML = appData.chatQuestions.map(function(q){
    return '<div class="chat-card">' +
      '<div class="chat-user"><span class="chat-name">👤 ' + q.author + '</span><span class="chat-time">' + q.timeAgo + '</span></div>' +
      '<div class="chat-q">' + q.question + '</div>' +
      '<div class="chat-a">💬 ' + q.answer + '</div>' +
    '</div>';
  }).join('');
}

function openSignalDetails(id) {
  var sig = appData.signals.find(function(s){ return s.id === id; });
  if(!sig) return;

  var isBuy = sig.direction === 'BUY';
  var dirClass = isBuy ? 'buy' : 'sell';

  var html = '<div style="font-size:18px; font-weight:900; margin-bottom:4px;">' + sig.symbol + ' <span class="badge-dir ' + dirClass + '">' + sig.direction + '</span></div>' +
    '<div style="font-size:11px; color:#8994a7; margin-bottom:12px;">Confidence: ' + sig.confidence + '</div>' +
    '<div class="sig-grid" style="margin-bottom:14px;">' +
      '<div class="sig-cell"><label>Entry</label><val>' + sig.entry + '</val></div>' +
      '<div class="sig-cell"><label>SL</label><val>' + sig.stop + '</val></div>' +
      '<div class="sig-cell"><label>TP1</label><val>' + sig.tp1 + '</val></div>' +
      '<div class="sig-cell"><label>TP2</label><val>' + sig.tp2 + '</val></div>' +
    '</div>' +
    '<div class="chart-box">' +
      '<svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">' +
        '<path d="M10 80 Q 80 20, 150 50 T 290 20" fill="none" stroke="' + (isBuy ? '#22c55e' : '#ef4444') + '" stroke-width="3"/>' +
        '<line x1="0" y1="50" x2="300" y2="50" stroke="#e2b13c" stroke-dasharray="4" stroke-width="1"/>' +
      '</svg>' +
    '</div>' +
    '<div style="font-size:12px; color:#cbd5e1; line-height:1.5; margin-bottom:16px;">' + sig.analysisText + '</div>' +
    '<button class="btn-gold" onclick="alert(\'Chart view expanded\')">View on Chart</button>';

  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('detailsModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detailsModal').classList.add('hidden');
}

function switchTab(tabName) {
  ['home', 'signals', 'analysis', 'chat', 'profile'].forEach(function(t){
    document.getElementById('tab-' + t).classList.add('hidden');
    document.getElementById('btn-' + t).classList.remove('active');
  });
  document.getElementById('tab-' + tabName).classList.remove('hidden');
  document.getElementById('btn-' + tabName).classList.add('active');
}

function filterSignals(status, el) {
  currentFilter = status;
  var pills = document.querySelectorAll('.filter-pill');
  pills.forEach(function(p){ p.classList.remove('active'); });
  if(el) el.classList.add('active');
  renderSignals();
}

function sendQuickTest(txt) {
  var input = txt || document.getElementById('quickInput').value;
  fetch('/api/signals/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input })
  }).then(function(){ loadData(); });
}

function submitQuestion() {
  var q = document.getElementById('chatInput').value;
  if(!q) return;
  fetch('/api/chat/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: q })
  }).then(function(){
    document.getElementById('chatInput').value = '';
    loadData();
  });
}

// Initial Load
loadData();
setInterval(loadData, 5000);
</script>
</body>
</html>`;
}

app.listen(PORT, "0.0.0.0", () => {
  console.log("Phoenix HT Trading running on port " + PORT);
});
