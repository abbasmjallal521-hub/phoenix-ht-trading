require("dotenv").config();
const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// البيانات الأولية للتطبيق
const signals = [
  {
    id: "sig-1",
    symbol: "XAUUSD",
    direction: "BUY",
    entry: "3648.00",
    stop: "3642.00",
    tp1: "3654.00",
    tp2: "3660.00",
    status: "ACTIVE",
    timeAgo: "2h ago",
    confidence: "7/7 (A+)",
    analysisText: "XAUUSD is showing strong bullish momentum on the 5M chart. Price respected the key demand zone at 3642 and broke the recent high. Looking for continuation towards TP1 and TP2."
  },
  {
    id: "sig-2",
    symbol: "GBPUSD",
    direction: "SELL",
    entry: "1.2630",
    stop: "1.2670",
    tp1: "1.2580",
    tp2: "1.2530",
    status: "ACTIVE",
    timeAgo: "5h ago",
    confidence: "6/7 (A)",
    analysisText: "GBPUSD facing strong resistance at 1.2670 level. Expecting a pullback towards lower targets."
  },
  {
    id: "sig-3",
    symbol: "XAUUSD",
    direction: "SELL",
    entry: "3665.00",
    stop: "3671.00",
    tp1: "3658.00",
    tp2: "3652.00",
    status: "TP_HIT",
    timeAgo: "7h ago",
    confidence: "7/7 (A+)",
    analysisText: "Gold hit TP1 perfectly after liquidity sweep at equal highs."
  },
  {
    id: "sig-4",
    symbol: "EURUSD",
    direction: "BUY",
    entry: "1.0780",
    stop: "1.0740",
    tp1: "1.0820",
    tp2: "1.0860",
    status: "SL_HIT",
    timeAgo: "9h ago",
    confidence: "5/7 (B+)",
    analysisText: "EURUSD stopped out due to high impact news volatility."
  }
];

const analyses = [
  {
    id: "an-1",
    title: "Gold Analysis - 5M",
    symbol: "XAUUSD | 5M",
    date: "9 Sep 2026",
    timeAgo: "4h ago",
    text: "Gold is showing strong bullish momentum above the key support zone. As long as price holds above 3635, we could see a push towards 3655 - 3670 targets."
  },
  {
    id: "an-2",
    title: "Market Overview",
    symbol: "GLOBAL MARKETS",
    date: "9 Sep 2026",
    timeAgo: "6h ago",
    text: "Key levels, trend outlook and important news for today's trading session across gold and major pairs."
  },
  {
    id: "an-3",
    title: "Forex Analysis",
    symbol: "EURUSD, GBPUSD, USDJPY",
    date: "8 Sep 2026",
    timeAgo: "1d ago",
    text: "Weekly forex structure analysis and high probability Smart Money Concept setup zones for major pairs."
  }
];

const chatQuestions = [
  {
    id: "q-1",
    author: "Ahmad",
    timeAgo: "2h ago",
    question: "Why did we enter Buy on XAUUSD here?",
    answer: "Because price formed a bullish Fair Value Gap on the 5M chart following a liquidity sweep."
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
    answer: "EURUSD is retesting a daily order block, looking for bullish lower timeframe confirmation."
  }
];

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
  if (matchEntry) entry = matchEntry[1];

  if (direction && entry) {
    const num = Number(entry);
    const newSig = {
      id: "sig-" + Date.now(),
      symbol: "XAUUSD",
      direction,
      entry: entry,
      stop: String((num - 6).toFixed(2)),
      tp1: String((num + 6).toFixed(2)),
      tp2: String((num + 12).toFixed(2)),
      status: "ACTIVE",
      timeAgo: "Just now",
      confidence: "7/7 (A+)",
      analysisText: "New signal created via live test panel. SMC Order block structure intact."
    };
    signals.unshift(newSig);
    return newSig;
  }
  return null;
}

// API Endpoints
app.get("/health", (req, res) => res.json({ ok: true, app: "Phoenix HT Trading" }));
app.get("/api/data", (req, res) => res.json({ ok: true, signals, analyses, chatQuestions }));

app.post("/api/signals/process", (req, res) => {
  const text = String(req.body?.text || "");
  processSignalText(text);
  res.json({ ok: true, signals });
});

app.post("/api/chat/ask", (req, res) => {
  const question = String(req.body?.question || "");
  if (question) {
    chatQuestions.unshift({
      id: "q-" + Date.now(),
      author: "You",
      timeAgo: "Just now",
      question,
      answer: "Under review by Phoenix HT analysts..."
    });
  }
  res.json({ ok: true, chatQuestions });
});

// Server-Side Rendered Components
function renderCardHTML(sig) {
  const isBuy = sig.direction === "BUY";
  const dirClass = isBuy ? "buy" : "sell";
  const statusClass = sig.status.toLowerCase();
  const statusText = sig.status.replace("_", " ");

  return `
  <div class="sig-card" data-status="${sig.status}" onclick="openModal('${sig.id}')">
    <div class="sig-head">
      <div class="sig-pair">
        ${sig.symbol} <span class="badge-dir ${dirClass}">${sig.direction}</span>
      </div>
      <div class="badge-status ${statusClass}">${statusText}</div>
    </div>
    <div class="sig-grid">
      <div class="sig-cell"><label>Entry</label><val>${sig.entry}</val></div>
      <div class="sig-cell"><label>SL</label><val>${sig.stop}</val></div>
      <div class="sig-cell"><label>TP1</label><val>${sig.tp1}</val></div>
      <div class="sig-cell"><label>TP2</label><val>${sig.tp2}</val></div>
    </div>
  </div>`;
}

function renderAnalysisHTML(an) {
  return `
  <div class="an-card">
    <div class="an-title">${an.title}</div>
    <div class="an-meta">${an.symbol} • ${an.timeAgo || an.date}</div>
    <div class="an-desc">${an.text}</div>
    <button type="button" class="btn-outline" onclick="switchTab('analysis')">View Analysis</button>
  </div>`;
}

function renderChatHTML(q) {
  return `
  <div class="chat-card">
    <div class="chat-user"><span>👤 ${q.author}</span><span style="font-size:10px; color:#6C7D93;">${q.timeAgo}</span></div>
    <div style="font-size:13px; color:#CBD5E1; margin:6px 0 10px;">${q.question}</div>
    <div style="background:#080C14; padding:10px 12px; border-radius:10px; font-size:12px; color:#F5C451; border-left:3px solid #F5C451;">💬 ${q.answer}</div>
  </div>`;
}

// SVG الخاص بشعار الفينيكس مع الشموع المتقاطعة المطابق للصورة
const PHOENIX_CANDLE_SVG = `
<svg viewBox="0 0 100 100" style="width:100%; height:100%;">
  <defs>
    <linearGradient id="pGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE082"/>
      <stop offset="40%" stop-color="#F5C451"/>
      <stop offset="80%" stop-color="#E28B00"/>
      <stop offset="100%" stop-color="#8A4B00"/>
    </linearGradient>
  </defs>
  <!-- Candlesticks top wings -->
  <rect x="25" y="8" width="3" height="18" fill="url(#pGoldGrad)" rx="1"/>
  <rect x="23" y="12" width="7" height="10" fill="url(#pGoldGrad)" rx="1"/>
  <rect x="33" y="14" width="2" height="16" fill="url(#pGoldGrad)" rx="1"/>
  <rect x="31" y="18" width="6" height="9" fill="url(#pGoldGrad)" rx="1"/>

  <rect x="72" y="8" width="3" height="18" fill="url(#pGoldGrad)" rx="1"/>
  <rect x="70" y="12" width="7" height="10" fill="url(#pGoldGrad)" rx="1"/>
  <rect x="65" y="14" width="2" height="16" fill="url(#pGoldGrad)" rx="1"/>
  <rect x="63" y="18" width="6" height="9" fill="url(#pGoldGrad)" rx="1"/>

  <!-- Phoenix Head & V-Body -->
  <path d="M50 22 C44 22, 40 28, 44 34 L50 44 L56 34 C60 28, 56 22, 50 22 Z" fill="url(#pGoldGrad)"/>
  <path d="M50 18 L53 25 L47 25 Z" fill="url(#pGoldGrad)"/>
  <path d="M50 42 L32 25 L18 36 L30 48 L50 72 L70 48 L82 36 L68 25 Z" fill="url(#pGoldGrad)"/>
  
  <!-- Wing Feather Details -->
  <path d="M22 38 L8 46 L24 54 L36 44 Z" fill="url(#pGoldGrad)"/>
  <path d="M78 38 L92 46 L76 54 L64 44 Z" fill="url(#pGoldGrad)"/>
  <path d="M26 50 L14 58 L30 64 L40 54 Z" fill="url(#pGoldGrad)"/>
  <path d="M74 50 L86 58 L70 64 L60 54 Z" fill="url(#pGoldGrad)"/>
  
  <!-- Tail -->
  <path d="M50 68 L44 80 L50 88 L56 80 Z" fill="url(#pGoldGrad)"/>
</svg>`;

app.get("/", (req, res) => {
  const latestSignalHTML = signals[0] ? renderCardHTML(signals[0]) : '<div style="color:#6C7D93; font-size:12px; padding:10px;">No active signal</div>';
  const allSignalsHTML = signals.map(renderCardHTML).join("");
  const latestAnalysisHTML = analyses[0] ? renderAnalysisHTML(analyses[0]) : '';
  const allAnalysesHTML = analyses.map(renderAnalysisHTML).join("");
  const allChatHTML = chatQuestions.map(renderChatHTML).join("");
  const signalsJSON = JSON.stringify(signals);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#080C14">
<title>Phoenix HT Trading</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
body { background: #080C14; color: #FFFFFF; min-height: 100vh; overflow-x: hidden; position: relative; }
button, input, .nav-tab, .sig-card, .filter-pill { cursor: pointer; pointer-events: auto !important; touch-action: manipulation; }
.hidden { display: none !important; }

.app-viewport { max-width: 440px; margin: 0 auto; padding: 16px 16px 110px; position: relative; z-index: 10; }

/* Top Header */
.app-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 16px; }
.header-brand { display: flex; align-items: center; gap: 12px; }
.phoenix-logo-box { width: 46px; height: 46px; border-radius: 14px; background: #0F1420; border: 1px solid rgba(245, 196, 81, 0.4); display: grid; place-items: center; padding: 4px; box-shadow: 0 4px 20px rgba(245, 196, 81, 0.25); }
.brand-title-main { font-size: 17px; font-weight: 900; letter-spacing: 0.5px; background: linear-gradient(180deg, #FFFFFF 0%, #F5C451 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.brand-sub-title { font-size: 9px; color: #F5C451; font-weight: 800; letter-spacing: 2px; }

.icon-btn { width: 40px; height: 40px; border-radius: 12px; background: #111723; border: 1px solid rgba(255,255,255,0.08); color: #F5C451; display: grid; place-items: center; font-size: 18px; border: none; }

/* Hero Banner */
.hero-banner { background: linear-gradient(145deg, #161E2E 0%, #0D121C 100%); border: 1px solid rgba(245, 196, 81, 0.3); border-radius: 20px; padding: 20px; margin-bottom: 20px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
.banner-badge { font-size: 10px; font-weight: 800; color: #F5C451; letter-spacing: 1.5px; margin-bottom: 6px; }
.banner-title { font-size: 22px; font-weight: 900; color: #FFF; margin-bottom: 6px; line-height: 1.2; }
.banner-sub { font-size: 12px; color: #8A97A8; }

/* Section Title */
.sec-title { font-size: 16px; font-weight: 800; color: #FFF; margin: 20px 0 12px; display: flex; justify-content: space-between; align-items: center; }
.sec-title button { background: none; border: none; color: #F5C451; font-size: 12px; font-weight: 700; }

/* Filter Bar */
.filter-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 14px; scrollbar-width: none; }
.filter-pill { padding: 8px 18px; border-radius: 20px; background: #111723; border: 1px solid rgba(255,255,255,0.08); color: #8A97A8; font-size: 12px; font-weight: 700; white-space: nowrap; transition: 0.2s; }
.filter-pill.active { background: linear-gradient(135deg, #F5C451 0%, #D4AF37 100%); color: #000; border-color: #F5C451; font-weight: 800; box-shadow: 0 4px 12px rgba(245, 196, 81, 0.25); }

/* Signal Card */
.sig-card { background: #111723; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 16px; margin-bottom: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.25); transition: 0.2s; }
.sig-card:active { transform: scale(0.98); }
.sig-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.sig-pair { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 16px; }
.badge-dir { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 900; }
.badge-dir.buy { background: rgba(40, 199, 111, 0.15); color: #28C76F; border: 1px solid rgba(40, 199, 111, 0.3); }
.badge-dir.sell { background: rgba(255, 77, 97, 0.15); color: #FF4D61; border: 1px solid rgba(255, 77, 97, 0.3); }

.badge-status { padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
.badge-status.active { background: rgba(40, 199, 111, 0.12); color: #28C76F; border: 1px solid rgba(40, 199, 111, 0.3); }
.badge-status.tp_hit { background: rgba(245, 196, 81, 0.15); color: #F5C451; border: 1px solid rgba(245, 196, 81, 0.3); }
.badge-status.sl_hit { background: rgba(255, 77, 97, 0.15); color: #FF4D61; border: 1px solid rgba(255, 77, 97, 0.3); }

.sig-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #080C14; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.04); }
.sig-cell { text-align: center; }
.sig-cell label { display: block; font-size: 10px; color: #6C7D93; font-weight: 700; margin-bottom: 3px; }
.sig-cell val { font-size: 13px; font-weight: 800; color: #FFF; }

/* Analysis Card */
.an-card { background: #111723; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; margin-bottom: 12px; }
.an-title { font-size: 16px; font-weight: 800; color: #FFF; margin-bottom: 4px; }
.an-meta { font-size: 11px; color: #F5C451; margin-bottom: 10px; font-weight: 700; }
.an-desc { font-size: 13px; color: #8A97A8; line-height: 1.5; margin-bottom: 14px; }
.btn-outline { width: 100%; padding: 11px; border-radius: 12px; background: transparent; border: 1px solid #F5C451; color: #F5C451; font-weight: 800; font-size: 13px; transition: 0.2s; }

/* Chat Card */
.chat-card { background: #111723; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px; margin-bottom: 10px; }
.chat-user { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 13px; color: #FFF; }

/* Profile Card & VIP Box */
.profile-card { background: #111723; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 22px; text-align: center; margin-bottom: 16px; }
.avatar-box { width: 80px; height: 80px; border-radius: 50%; background: #1A2232; overflow: hidden; margin: 0 auto 12px; border: 2px solid #F5C451; box-shadow: 0 4px 15px rgba(245, 196, 81, 0.2); padding: 8px; }
.profile-name { font-size: 19px; font-weight: 900; }
.profile-handle { font-size: 12px; color: #6C7D93; margin-bottom: 12px; }

.vip-box { background: linear-gradient(145deg, #1E180D 0%, #100D07 100%); border: 1px solid rgba(245, 196, 81, 0.4); border-radius: 20px; padding: 22px; text-align: center; margin-bottom: 16px; }
.vip-title { font-size: 22px; font-weight: 900; color: #F5C451; margin-bottom: 6px; }
.vip-feature-list { text-align: left; margin: 16px 0; display: flex; flex-direction: column; gap: 10px; }
.vip-item { font-size: 12px; color: #CBD5E1; display: flex; align-items: center; gap: 10px; font-weight: 600; }
.vip-item::before { content: '✓'; color: #F5C451; font-weight: 900; }

.btn-gold { width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, #F5C451 0%, #D4AF37 100%); border: none; color: #000; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(245, 196, 81, 0.3); }

.menu-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 18px; background: #111723; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #FFF; }
.menu-row span { color: #6C7D93; font-size: 12px; }

/* Modal Popup */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: grid; place-items: center; padding: 20px; z-index: 999; }
.modal-card { width: min(400px, 100%); background: #111723; border: 1px solid rgba(245, 196, 81, 0.4); border-radius: 24px; padding: 22px; position: relative; }
.modal-close { position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: #8A97A8; font-size: 22px; }

/* Bottom Nav Bar - Fixed High Z-Index for Instant Clickability */
.nav-bottom-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: min(440px, 100%); padding: 10px 12px 14px; background: rgba(8, 12, 20, 0.98); backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,0.08); display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; z-index: 9999; }
.nav-tab { border: none; background: transparent; color: #6C7D93; padding: 6px; border-radius: 12px; font-weight: 700; font-size: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: 0.2s; }
.nav-tab.active { color: #F5C451; background: rgba(245, 196, 81, 0.12); }
.nav-tab i { font-size: 18px; font-style: normal; }

/* Test Panel */
.test-panel { background: #111723; border: 1px dashed rgba(245, 196, 81, 0.4); border-radius: 18px; padding: 16px; margin-top: 24px; }
.test-panel h4 { color: #F5C451; font-size: 14px; font-weight: 800; margin-bottom: 10px; }
.test-input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: #080C14; color: #FFF; font-size: 12px; outline: none; margin-bottom: 10px; }
.test-btn-group { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-sm { padding: 10px; border-radius: 10px; font-weight: 800; font-size: 11px; border: none; }
.btn-sm.green { background: rgba(40, 199, 111, 0.2); color: #28C76F; border: 1px solid rgba(40, 199, 111, 0.4); }
.btn-sm.red { background: rgba(255, 77, 97, 0.2); color: #FF4D61; border: 1px solid rgba(255, 77, 97, 0.4); }
</style>
</head>
<body>

<div class="app-viewport">

  <!-- Header -->
  <div class="app-header">
    <div class="header-brand">
      <div class="phoenix-logo-box">
        ${PHOENIX_CANDLE_SVG}
      </div>
      <div>
        <div class="brand-title-main">PHOENIX HT</div>
        <div class="brand-sub-title">TRADING</div>
      </div>
    </div>
    <button type="button" class="icon-btn" onclick="switchTab('profile')">🔔</button>
  </div>

  <!-- TAB 1: HOME -->
  <div id="tab-home" class="tab-page">
    <div class="hero-banner">
      <div class="banner-badge">DAILY ANALYSIS & TRADING SIGNALS</div>
      <div class="banner-title">Trade Smarter, Not Harder</div>
      <div class="banner-sub">Stay ahead. Trade with confidence.</div>
    </div>

    <div class="sec-title">
      Latest Signal
      <button type="button" onclick="switchTab('signals')">View All →</button>
    </div>
    <div id="homeLatestSignal">${latestSignalHTML}</div>

    <div class="sec-title">
      Latest Analysis
      <button type="button" onclick="switchTab('analysis')">View All →</button>
    </div>
    <div id="homeLatestAnalysis">${latestAnalysisHTML}</div>

    <!-- Live Signal Creator -->
    <div class="test-panel">
      <h4>🛠️ Live Signal Test Panel</h4>
      <input id="quickInput" class="test-input" value="شراء ذهب على 3650 SL 3644 TP 3662">
      <div class="test-btn-group">
        <button type="button" class="btn-sm green" onclick="sendQuickTest('شراء ذهب 3655 SL 3648 TP 3670')">+ BUY Signal</button>
        <button type="button" class="btn-sm red" onclick="sendQuickTest('بيع ذهب 3660 SL 3668 TP 3645')">+ SELL Signal</button>
      </div>
    </div>
  </div>

  <!-- TAB 2: SIGNALS -->
  <div id="tab-signals" class="tab-page hidden">
    <div class="sec-title" style="margin-top:0;">Free Signals</div>
    <div class="filter-scroll">
      <button type="button" class="filter-pill active" onclick="filterSignals('ALL', this)">All</button>
      <button type="button" class="filter-pill" onclick="filterSignals('ACTIVE', this)">Active</button>
      <button type="button" class="filter-pill" onclick="filterSignals('TP_HIT', this)">TP/SL</button>
      <button type="button" class="filter-pill" onclick="filterSignals('CLOSED', this)">Closed</button>
    </div>
    <div id="signalsList">${allSignalsHTML}</div>
  </div>

  <!-- TAB 3: ANALYSIS -->
  <div id="tab-analysis" class="tab-page hidden">
    <div class="sec-title" style="margin-top:0;">Market Analysis</div>
    <div id="analysisList">${allAnalysesHTML}</div>
  </div>

  <!-- TAB 4: CHAT -->
  <div id="tab-chat" class="tab-page hidden">
    <div class="sec-title" style="margin-top:0;">Questions / Chat</div>
    <input id="chatInput" class="test-input" placeholder="Ask a question about signals..." style="padding:14px; margin-bottom:10px;">
    <button type="button" class="btn-gold" style="margin-bottom:18px; padding:12px;" onclick="submitQuestion()">Ask a Question</button>
    <div id="chatList">${allChatHTML}</div>
  </div>

  <!-- TAB 5: PROFILE -->
  <div id="tab-profile" class="tab-page hidden">
    <div class="profile-card">
      <div class="avatar-box">
        ${PHOENIX_CANDLE_SVG}
      </div>
      <div class="profile-name">Abbas Mjallal</div>
      <div class="profile-handle">@abbasmj</div>
      <div style="font-size:11px; background:#1A2232; color:#F5C451; padding:4px 14px; border-radius:12px; display:inline-block; font-weight:800; border:1px solid rgba(245, 196, 81, 0.3);">Free Plan</div>
    </div>

    <div class="vip-box">
      <div class="vip-title">👑 VIP Coming Soon</div>
      <div style="font-size:12px; color:#8A97A8;">Get premium signals, advanced analysis, private chat and more.</div>
      <div class="vip-feature-list">
        <div class="vip-item">VIP Signals (higher accuracy)</div>
        <div class="vip-item">Advanced Analysis</div>
        <div class="vip-item">Real-time Notifications</div>
        <div class="vip-item">VIP Chat (direct)</div>
        <div class="vip-item">Exclusive Content & Priority Support</div>
      </div>
      <button type="button" class="btn-gold" onclick="alert('Notify Me registered!')">Notify Me</button>
    </div>

    <div class="menu-row">Subscription <span>Free Plan</span></div>
    <div class="menu-row">Notifications <span>On</span></div>
    <div class="menu-row">Language <span>English ></span></div>
    <div class="menu-row">Help & Support</div>
    <div class="menu-row">About Phoenix HT Trading</div>
  </div>

</div>

<!-- Modal Popup -->
<div id="detailsModal" class="modal-overlay hidden">
  <div class="modal-card">
    <button type="button" class="modal-close" onclick="closeModal()">✕</button>
    <div id="modalBody"></div>
  </div>
</div>

<!-- Bottom Nav Bar -->
<div class="nav-bottom-bar">
  <button type="button" class="nav-tab active" id="btn-home" onclick="switchTab('home')"><i>🏠</i>Home</button>
  <button type="button" class="nav-tab" id="btn-signals" onclick="switchTab('signals')"><i>📊</i>Signals</button>
  <button type="button" class="nav-tab" id="btn-analysis" onclick="switchTab('analysis')"><i>📈</i>Analysis</button>
  <button type="button" class="nav-tab" id="btn-chat" onclick="switchTab('chat')"><i>💬</i>Chat</button>
  <button type="button" class="nav-tab" id="btn-profile" onclick="switchTab('profile')"><i>👤</i>Profile</button>
</div>

<script>
var rawSignals = ${signalsJSON};

function switchTab(tabName) {
  var pages = document.querySelectorAll('.tab-page');
  var btns = document.querySelectorAll('.nav-tab');
  for(var i=0; i<pages.length; i++) pages[i].classList.add('hidden');
  for(var j=0; j<btns.length; j++) btns[j].classList.remove('active');
  
  var targetPage = document.getElementById('tab-' + tabName);
  var targetBtn = document.getElementById('btn-' + tabName);
  if(targetPage) targetPage.classList.remove('hidden');
  if(targetBtn) targetBtn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterSignals(status, el) {
  var pills = document.querySelectorAll('.filter-pill');
  for(var i=0; i<pills.length; i++) pills[i].classList.remove('active');
  if(el) el.classList.add('active');

  var cards = document.querySelectorAll('#signalsList .sig-card');
  for(var j=0; j<cards.length; j++){
    var cardStatus = cards[j].getAttribute('data-status');
    if(status === 'ALL' || cardStatus === status) {
      cards[j].classList.remove('hidden');
    } else {
      cards[j].classList.add('hidden');
    }
  }
}

function openModal(id) {
  var sig = null;
  for(var i=0; i<rawSignals.length; i++){
    if(rawSignals[i].id === id) { sig = rawSignals[i]; break; }
  }
  if(!sig) return;

  var isBuy = sig.direction === 'BUY';
  var dirClass = isBuy ? 'buy' : 'sell';

  var html = '<div style="font-size:20px; font-weight:900; margin-bottom:4px; color:#FFF;">' + sig.symbol + ' <span class="badge-dir ' + dirClass + '">' + sig.direction + '</span></div>' +
    '<div style="font-size:11px; color:#8A97A8; margin-bottom:14px; font-weight:700;">Confidence: ' + (sig.confidence || '7/7 (A+)') + ' • ' + (sig.timeAgo || '2h ago') + '</div>' +
    '<div class="sig-grid" style="margin-bottom:14px;">' +
      '<div class="sig-cell"><label>Entry</label><val>' + sig.entry + '</val></div>' +
      '<div class="sig-cell"><label>SL</label><val>' + sig.stop + '</val></div>' +
      '<div class="sig-cell"><label>TP1</label><val>' + sig.tp1 + '</val></div>' +
      '<div class="sig-cell"><label>TP2</label><val>' + sig.tp2 + '</val></div>' +
    '</div>' +
    '<div style="width:100%; height:130px; background:#080C14; border-radius:12px; margin:14px 0; padding:10px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.05);">' +
      '<svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">' +
        '<path d="M10 75 Q 80 20, 150 55 T 290 25" fill="none" stroke="' + (isBuy ? '#28C76F' : '#FF4D61') + '" stroke-width="3"/>' +
        '<line x1="0" y1="55" x2="300" y2="55" stroke="#F5C451" stroke-dasharray="4" stroke-width="1"/>' +
      '</svg>' +
    '</div>' +
    '<div style="font-size:12px; color:#CBD5E1; line-height:1.5; margin-bottom:18px;">' + (sig.analysisText || 'XAUUSD structure looking strong.') + '</div>' +
    '<button type="button" class="btn-gold" onclick="alert(\'TradingView Chart View\')">View on Chart</button>';

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('detailsModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detailsModal').classList.add('hidden');
}

function sendQuickTest(txt) {
  var input = txt || document.getElementById('quickInput').value;
  fetch('/api/signals/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input })
  }).then(function(){ location.reload(); });
}

function submitQuestion() {
  var q = document.getElementById('chatInput').value;
  if(!q) return;
  fetch('/api/chat/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: q })
  }).then(function(){ location.reload(); });
}
</script>
</body>
</html>`;

  res.send(html);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Phoenix HT Trading running on port " + PORT);
});
