require("dotenv").config();
const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// بيانات التوصيات الأولية مطابقة للواقع
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
    analysisText: "XAUUSD is showing bullish momentum on the 5M chart. Price respected the key demand zone and broke the recent high. We are looking for continuation towards TP1 and TP2.",
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
    analysisText: "GBPUSD facing strong resistance at 1.2670 level. Expecting a pullback towards lower target levels.",
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
    date: "9 Sep 2026",
    timeAgo: "4h ago",
    text: "Gold is showing strong bullish momentum above key support zone. As long as price holds above 3635, we could see a push towards 3655 - 3670 target."
  },
  {
    id: "an-2",
    title: "Market Overview",
    symbol: "GLOBAL MARKETS",
    date: "9 Sep 2026",
    timeAgo: "6h ago",
    text: "Key levels, trend and important economic news outlook for today's trading session across indices and metals."
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
    question: "What are the key support & resistance levels for gold today?",
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
      analysisText: "New live signal added via test panel. SMC Order block structure intact.",
      profitUpdates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    signals.unshift(newSig);
    return newSig;
  }
  return null;
}

// API Endpoints
app.get("/health", (req, res) => {
  res.json({ ok: true, app: "Phoenix HT Trading", status: "Running" });
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
      author: " You",
      timeAgo: "Just now",
      question,
      answer: "Under review by Phoenix HT analysts..."
    });
  }
  res.json({ ok: true, chatQuestions });
});

// Render Main App
app.get("/", (req, res) => {
  res.type("html").send(getHTMLContent());
});

function getHTMLContent() {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#080c14">
<title>Phoenix HT Trading</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
body { background: #080c14; color: #FFFFFF; min-height: 100vh; overflow-x: hidden; }
.hidden { display: none !important; }

.app-viewport { max-width: 450px; margin: auto; padding: 16px 16px 110px; min-height: 100vh; position: relative; }

/* Top Header Bar */
.app-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 18px; }
.header-brand { display: flex; align-items: center; gap: 12px; }
.phoenix-logo-box { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #2a2215 0%, #110e08 100%); border: 1px solid rgba(245, 196, 81, 0.4); display: grid; place-items: center; box-shadow: 0 4px 20px rgba(245, 196, 81, 0.25); }
.phoenix-svg { width: 30px; height: 30px; }
.brand-text-wrap { display: flex; flex-direction: column; }
.brand-title-main { font-size: 17px; font-weight: 900; letter-spacing: 0.5px; background: linear-gradient(180deg, #FFFFFF 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.brand-sub-title { font-size: 9px; color: #F5C451; font-weight: 800; letter-spacing: 2.5px; }

.header-icon-btn { width: 40px; height: 40px; border-radius: 12px; background: #111723; border: 1px solid rgba(255,255,255,0.08); color: #F5C451; display: grid; place-items: center; font-size: 18px; cursor: pointer; }

/* Hero Banner */
.hero-banner { background: linear-gradient(145deg, #161e2e 0%, #0d121c 100%); border: 1px solid rgba(245, 196, 81, 0.3); border-radius: 20px; padding: 22px; margin-bottom: 20px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
.hero-bg-logo { position: absolute; right: -20px; bottom: -20px; width: 140px; height: 140px; opacity: 0.08; pointer-events: none; }
.banner-badge { font-size: 10px; font-weight: 800; color: #F5C451; letter-spacing: 1.5px; margin-bottom: 6px; text-transform: uppercase; }
.banner-title { font-size: 22px; font-weight: 900; color: #FFF; margin-bottom: 6px; line-height: 1.2; }
.banner-sub { font-size: 12px; color: #8A97A8; }

/* Section Title */
.sec-title { font-size: 16px; font-weight: 800; color: #FFF; margin: 20px 0 12px; display: flex; justify-content: space-between; align-items: center; }
.sec-title span { font-size: 12px; color: #F5C451; font-weight: 700; cursor: pointer; }

/* Filter Scroll */
.filter-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 14px; scrollbar-width: none; }
.filter-pill { padding: 8px 18px; border-radius: 20px; background: #111723; border: 1px solid rgba(255,255,255,0.08); color: #8A97A8; font-size: 12px; font-weight: 700; cursor: pointer; whitespace: nowrap; transition: 0.2s; }
.filter-pill.active { background: linear-gradient(135deg, #F5C451 0%, #D4AF37 100%); color: #000; border-color: #F5C451; box-shadow: 0 4px 12px rgba(245, 196, 81, 0.25); }

/* Signal Card */
.sig-card { background: #111723; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: 0.2s; box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
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

.sig-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #080c14; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.04); }
.sig-cell { text-align: center; }
.sig-cell label { display: block; font-size: 10px; color: #6C7D93; font-weight: 700; margin-bottom: 3px; }
.sig-cell val { font-size: 13px; font-weight: 800; color: #FFF; }

/* Analysis Card */
.an-card { background: #111723; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; margin-bottom: 12px; }
.an-title { font-size: 16px; font-weight: 800; color: #FFF; margin-bottom: 4px; }
.an-meta { font-size: 11px; color: #F5C451; margin-bottom: 10px; font-weight: 700; }
.an-desc { font-size: 13px; color: #8A97A8; line-height: 1.5; margin-bottom: 14px; }
.btn-outline { width: 100%; padding: 11px; border-radius: 12px; background: transparent; border: 1px solid #F5C451; color: #F5C451; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; }
.btn-outline:active { background: rgba(245, 196, 81, 0.12); }

/* Chat Card */
.chat-card { background: #111723; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px; margin-bottom: 10px; }
.chat-user { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.chat-name { font-weight: 800; font-size: 13px; color: #FFF; }
.chat-time { font-size: 10px; color: #6C7D93; }
.chat-q { font-size: 13px; color: #CBD5E1; margin-bottom: 10px; }
.chat-a { background: #080c14; padding: 10px 12px; border-radius: 10px; font-size: 12px; color: #F5C451; border-left: 3px solid #F5C451; }

/* Profile & VIP Screen */
.profile-card { background: #111723; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 22px; text-align: center; margin-bottom: 16px; }
.avatar-box { width: 70px; height: 70px; border-radius: 50%; background: #1A2232; color: #F5C451; font-size: 32px; display: grid; place-items: center; margin: 0 auto 12px; border: 2px solid #F5C451; box-shadow: 0 4px 15px rgba(245, 196, 81, 0.2); }
.profile-name { font-size: 19px; font-weight: 900; }
.profile-handle { font-size: 12px; color: #6C7D93; margin-bottom: 12px; }

.vip-box { background: linear-gradient(145deg, #1e180d 0%, #100d07 100%); border: 1px solid rgba(245, 196, 81, 0.4); border-radius: 20px; padding: 22px; text-align: center; margin-bottom: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
.vip-title { font-size: 22px; font-weight: 900; color: #F5C451; margin-bottom: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.vip-feature-list { text-align: left; margin: 16px 0; display: flex; flex-direction: column; gap: 10px; }
.vip-item { font-size: 12px; color: #CBD5E1; display: flex; align-items: center; gap: 10px; font-weight: 600; }
.vip-item::before { content: '✓'; color: #F5C451; font-weight: 900; font-size: 14px; }

.btn-gold { width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, #F5C451 0%, #D4AF37 100%); border: none; color: #000; font-weight: 900; font-size: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(245, 196, 81, 0.3); transition: 0.2s; }
.btn-gold:active { transform: scale(0.98); }

/* Menu Rows */
.menu-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 18px; background: #111723; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #FFF; cursor: pointer; }
.menu-row span { color: #6C7D93; font-size: 12px; }

/* Modal Popup */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: grid; place-items: center; padding: 20px; z-index: 200; }
.modal-card { width: min(400px, 100%); background: #111723; border: 1px solid rgba(245, 196, 81, 0.4); border-radius: 24px; padding: 22px; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
.modal-close { position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: #8A97A8; font-size: 22px; cursor: pointer; }

.chart-box { width: 100%; height: 150px; background: #080c14; border-radius: 14px; margin: 14px 0; padding: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05); }

/* Bottom Navigation Bar */
.nav-bottom-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: min(450px, 100%); padding: 10px 12px 14px; background: rgba(8, 12, 20, 0.95); backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,0.08); display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; z-index: 100; }
.nav-tab { border: none; background: transparent; color: #6C7D93; padding: 6px; border-radius: 12px; font-weight: 700; font-size: 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: 0.2s; }
.nav-tab.active { color: #F5C451; background: rgba(245, 196, 81, 0.12); }
.nav-tab i { font-size: 18px; font-style: normal; }

/* Test Panel Box */
.test-panel { background: #111723; border: 1px dashed rgba(245, 196, 81, 0.4); border-radius: 18px; padding: 16px; margin-top: 24px; }
.test-panel h4 { color: #F5C451; font-size: 14px; font-weight: 800; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.test-input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: #080c14; color: #FFF; font-size: 12px; outline: none; margin-bottom: 10px; }
.test-btn-group { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-sm { padding: 10px; border-radius: 10px; font-weight: 800; font-size: 11px; border: none; cursor: pointer; }
.btn-sm.green { background: rgba(40, 199, 111, 0.2); color: #28C76F; border: 1px solid rgba(40, 199, 111, 0.4); }
.btn-sm.red { background: rgba(255, 77, 97, 0.2); color: #FF4D61; border: 1px solid rgba(255, 77, 97, 0.4); }
</style>
</head>
<body>

<div class="app-viewport">

  <!-- Top Header -->
  <div class="app-header">
    <div class="header-brand">
      <div class="phoenix-logo-box">
        <!-- Exact Metallic Golden Phoenix SVG -->
        <svg class="phoenix-svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="pGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFF2A1"/>
              <stop offset="35%" stop-color="#F5C451"/>
              <stop offset="75%" stop-color="#D4AF37"/>
              <stop offset="100%" stop-color="#8A6510"/>
            </linearGradient>
          </defs>
          <path d="M50 12 L53 5 L56 12 L61 7 L59 15 L66 12 L60 19 L50 23 L40 19 L34 12 L41 15 L39 7 L44 12 L47 5 Z" fill="url(#pGold)"/>
          <path d="M48 26 C32 18, 12 22, 6 38 C16 34, 26 32, 36 34 C24 37, 10 44, 8 56 C18 50, 28 48, 40 46 C26 52, 16 64, 18 74 C28 66, 38 60, 44 52 C42 64, 43 76, 48 86 C47 76, 46 64, 46 52 Z" fill="url(#pGold)"/>
          <path d="M52 26 C68 18, 88 22, 94 38 C84 34, 74 32, 64 34 C76 37, 90 44, 92 56 C82 50, 72 48, 60 46 C74 52, 84 64, 82 74 C72 66, 62 60, 56 52 C58 64, 57 76, 52 86 C53 76, 54 64, 54 52 Z" fill="url(#pGold)"/>
        </svg>
      </div>
      <div class="brand-text-wrap">
        <div class="brand-title-main">PHOENIX HT</div>
        <div class="brand-sub-title">TRADING</div>
      </div>
    </div>
    <div class="header-icon-btn" onclick="switchTab('profile')">🔔</div>
  </div>

  <!-- TAB 1: HOME -->
  <div id="tab-home">
    <div class="hero-banner">
      <svg class="hero-bg-logo" viewBox="0 0 100 100">
        <path d="M50 12 L53 5 L56 12 L61 7 L59 15 L66 12 L60 19 L50 23 L40 19 L34 12 L41 15 L39 7 L44 12 L47 5 Z" fill="#F5C451"/>
        <path d="M48 26 C32 18, 12 22, 6 38 C16 34, 26 32, 36 34 C24 37, 10 44, 8 56 C18 50, 28 48, 40 46 C26 52, 16 64, 18 74 C28 66, 38 60, 44 52 C42 64, 43 76, 48 86 C47 76, 46 64, 46 52 Z" fill="#F5C451"/>
        <path d="M52 26 C68 18, 88 22, 94 38 C84 34, 74 32, 64 34 C76 37, 90 44, 92 56 C82 50, 72 48, 60 46 C74 52, 84 64, 82 74 C72 66, 62 60, 56 52 C58 64, 57 76, 52 86 C53 76, 54 64, 54 52 Z" fill="#F5C451"/>
      </svg>
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
      <h4>🛠️ Live Signal Creator (Test Panel)</h4>
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
    <input id="chatInput" class="test-input" placeholder="Ask a question about signals..." style="padding:14px; margin-bottom:10px;">
    <button class="btn-gold" style="margin-bottom:18px; padding:12px;" onclick="submitQuestion()">Ask a Question</button>
    <div id="chatList"></div>
  </div>

  <!-- TAB 5: PROFILE -->
  <div id="tab-profile" class="hidden">
    <div class="profile-card">
      <div class="avatar-box">👤</div>
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
      <button class="btn-gold" onclick="alert('You are on the VIP waitlist!')">Notify Me</button>
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

<!-- Bottom Navigation Bar -->
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

// Explicit Global Window Functions (Fixes all button issues)
window.switchTab = function(tabName) {
  var tabs = ['home', 'signals', 'analysis', 'chat', 'profile'];
  tabs.forEach(function(t){
    var content = document.getElementById('tab-' + t);
    var btn = document.getElementById('btn-' + t);
    if(content) content.classList.add('hidden');
    if(btn) btn.classList.remove('active');
  });
  var activeContent = document.getElementById('tab-' + tabName);
  var activeBtn = document.getElementById('btn-' + tabName);
  if(activeContent) activeContent.classList.remove('hidden');
  if(activeBtn) activeBtn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.filterSignals = function(status, el) {
  currentFilter = status;
  var pills = document.querySelectorAll('.filter-pill');
  pills.forEach(function(p){ p.classList.remove('active'); });
  if(el) el.classList.add('active');
  renderSignals();
};

window.openSignalDetails = function(id) {
  var sig = appData.signals.find(function(s){ return s.id === id; });
  if(!sig) return;

  var isBuy = sig.direction === 'BUY';
  var dirClass = isBuy ? 'buy' : 'sell';

  var html = '<div style="font-size:20px; font-weight:900; margin-bottom:4px; color:#FFF;">' + sig.symbol + ' <span class="badge-dir ' + dirClass + '">' + sig.direction + '</span></div>' +
    '<div style="font-size:11px; color:#8A97A8; margin-bottom:14px; font-weight:700;">Confidence: ' + sig.confidence + ' • ' + sig.timeAgo + '</div>' +
    '<div class="sig-grid" style="margin-bottom:14px;">' +
      '<div class="sig-cell"><label>Entry</label><val>' + sig.entry + '</val></div>' +
      '<div class="sig-cell"><label>SL</label><val>' + sig.stop + '</val></div>' +
      '<div class="sig-cell"><label>TP1</label><val>' + sig.tp1 + '</val></div>' +
      '<div class="sig-cell"><label>TP2</label><val>' + sig.tp2 + '</val></div>' +
    '</div>' +
    '<div class="chart-box">' +
      '<svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">' +
        '<path d="M10 75 Q 80 20, 150 55 T 290 25" fill="none" stroke="' + (isBuy ? '#28C76F' : '#FF4D61') + '" stroke-width="3"/>' +
        '<line x1="0" y1="55" x2="300" y2="55" stroke="#F5C451" stroke-dasharray="4" stroke-width="1"/>' +
      '</svg>' +
    '</div>' +
    '<div style="font-size:12px; color:#CBD5E1; line-height:1.5; margin-bottom:18px;">' + sig.analysisText + '</div>' +
    '<button class="btn-gold" onclick="alert(\'Expanding TradingView Chart...\')">View on Chart</button>';

  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('detailsModal').classList.remove('hidden');
};

window.closeModal = function() {
  document.getElementById('detailsModal').classList.add('hidden');
};

window.sendQuickTest = function(txt) {
  var input = txt || document.getElementById('quickInput').value;
  fetch('/api/signals/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input })
  }).then(function(){ loadData(); });
};

window.submitQuestion = function() {
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
};

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
    homeSigBox.innerHTML = '<div style="color:#6C7D93; font-size:12px; padding:10px;">No active signal</div>';
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
    container.innerHTML = '<div style="color:#6C7D93; font-size:13px; text-align:center; padding:30px;">No signals found</div>';
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

// Initial Load & Polling
loadData();
setInterval(loadData, 5000);
</script>
</body>
</html>`;
}

app.listen(PORT, "0.0.0.0", () => {
  console.log("Phoenix HT Trading running on port " + PORT);
});
