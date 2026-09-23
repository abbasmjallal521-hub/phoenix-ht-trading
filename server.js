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
    analysisText: "XAUUSD is showing strong bullish momentum on the 5M chart. Price respected the key demand zone at 3642 and broke the recent high. Looking for continuation towards TP1 and TP2.",
    createdAt: new Date().toISOString()
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
    analysisText: "GBPUSD facing strong resistance at 1.2670 level. Expecting a pullback towards lower targets.",
    createdAt: new Date().toISOString()
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
    analysisText: "Gold hit TP1 perfectly after liquidity sweep at equal highs.",
    createdAt: new Date().toISOString()
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
    analysisText: "EURUSD stopped out due to high impact news volatility.",
    createdAt: new Date().toISOString()
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
      id: crypto.randomUUID(),
      symbol: "XAUUSD",
      direction,
      entry: entry,
      stop: String((num - 6).toFixed(2)),
      tp1: String((num + 6).toFixed(2)),
      tp2: String((num + 12).toFixed(2)),
      status: "ACTIVE",
      timeAgo: "Just now",
      confidence: "7/7 (A+)",
      analysisText: "New signal created via live test panel. SMC Order block structure intact.",
      createdAt: new Date().toISOString()
    };
    signals.unshift(newSig);
    return newSig;
  }
  return null;
}

// APIs
app.get("/health", (req, res) => res.json({ ok: true, status: "OK" }));
app.get("/api/data", (req, res) => res.json({ ok: true, signals, analyses, chatQuestions }));

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

app.get("/", (req, res) => {
  res.type("html").send(getHTMLContent());
});

function getHTMLContent() {
  const initialDataJSON = JSON.stringify({ signals, analyses, chatQuestions });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#0B0E14">
<title>Phoenix HT Trading</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
body { background: #0B0E14; color: #FFFFFF; min-height: 100vh; overflow-x: hidden; }
.hidden { display: none !important; }

.app-container { max-width: 440px; margin: 0 auto; padding: 16px 16px 100px; }

/* Top Navigation Bar */
.top-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 16px; }
.brand-group { display: flex; align-items: center; gap: 12px; }
.phoenix-logo-badge { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(145deg, #241D12 0%, #0F0D09 100%); border: 1px solid rgba(245, 196, 81, 0.4); display: grid; place-items: center; box-shadow: 0 4px 20px rgba(245, 196, 81, 0.2); }
.phoenix-logo-svg { width: 32px; height: 32px; }
.brand-titles { display: flex; flex-direction: column; }
.brand-main { font-size: 17px; font-weight: 900; letter-spacing: 0.5px; background: linear-gradient(180deg, #FFFFFF 0%, #E2B13C 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.brand-sub { font-size: 9px; color: #E2B13C; font-weight: 800; letter-spacing: 2px; }

.icon-button { width: 40px; height: 40px; border-radius: 12px; background: #141B29; border: 1px solid rgba(255,255,255,0.08); color: #E2B13C; display: grid; place-items: center; font-size: 18px; cursor: pointer; }

/* Hero Banner Card */
.hero-card { background: linear-gradient(145deg, #172033 0%, #0E1422 100%); border: 1px solid rgba(226, 177, 60, 0.3); border-radius: 20px; padding: 20px; margin-bottom: 20px; position: relative; overflow: hidden; }
.hero-watermark { position: absolute; right: -15px; bottom: -15px; width: 130px; height: 130px; opacity: 0.08; pointer-events: none; }
.banner-tag { font-size: 10px; font-weight: 800; color: #E2B13C; letter-spacing: 1.5px; margin-bottom: 6px; }
.banner-heading { font-size: 22px; font-weight: 900; color: #FFF; margin-bottom: 6px; line-height: 1.2; }
.banner-subtext { font-size: 12px; color: #8A97A8; }

/* Section Header */
.section-header { font-size: 16px; font-weight: 800; color: #FFF; margin: 20px 0 12px; display: flex; justify-content: space-between; align-items: center; }
.section-header span { font-size: 12px; color: #E2B13C; font-weight: 700; cursor: pointer; }

/* Filter Scroll Pills */
.filter-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 14px; scrollbar-width: none; }
.filter-btn { padding: 8px 18px; border-radius: 20px; background: #141B29; border: 1px solid rgba(255,255,255,0.08); color: #8A97A8; font-size: 12px; font-weight: 700; cursor: pointer; whitespace: nowrap; transition: 0.2s; }
.filter-btn.active { background: linear-gradient(135deg, #E2B13C 0%, #A87A18 100%); color: #000; border-color: #E2B13C; font-weight: 800; box-shadow: 0 4px 12px rgba(226, 177, 60, 0.25); }

/* Signal Card UI */
.signal-card { background: #141B29; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: 0.2s; box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
.signal-card:active { transform: scale(0.98); }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.pair-title { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 16px; }
.dir-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 900; }
.dir-badge.buy { background: rgba(40, 199, 111, 0.15); color: #28C76F; border: 1px solid rgba(40, 199, 111, 0.3); }
.dir-badge.sell { background: rgba(255, 77, 97, 0.15); color: #FF4D61; border: 1px solid rgba(255, 77, 97, 0.3); }

.status-badge { padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
.status-badge.active { background: rgba(40, 199, 111, 0.12); color: #28C76F; border: 1px solid rgba(40, 199, 111, 0.3); }
.status-badge.tp_hit { background: rgba(226, 177, 60, 0.15); color: #E2B13C; border: 1px solid rgba(226, 177, 60, 0.3); }
.status-badge.sl_hit { background: rgba(255, 77, 97, 0.15); color: #FF4D61; border: 1px solid rgba(255, 77, 97, 0.3); }

.price-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #0B0E14; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.04); }
.price-box { text-align: center; }
.price-box label { display: block; font-size: 10px; color: #6C7D93; font-weight: 700; margin-bottom: 3px; }
.price-box val { font-size: 13px; font-weight: 800; color: #FFF; }

/* Analysis Card */
.analysis-card { background: #141B29; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; margin-bottom: 12px; }
.an-header { font-size: 16px; font-weight: 800; color: #FFF; margin-bottom: 4px; }
.an-subhead { font-size: 11px; color: #E2B13C; margin-bottom: 10px; font-weight: 700; }
.an-text { font-size: 13px; color: #8A97A8; line-height: 1.5; margin-bottom: 14px; }
.btn-outline { width: 100%; padding: 11px; border-radius: 12px; background: transparent; border: 1px solid #E2B13C; color: #E2B13C; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; }

/* Chat Card */
.chat-card { background: #141B29; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px; margin-bottom: 10px; }
.chat-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.chat-user { font-weight: 800; font-size: 13px; color: #FFF; }
.chat-time { font-size: 10px; color: #6C7D93; }
.chat-question { font-size: 13px; color: #CBD5E1; margin-bottom: 10px; }
.chat-reply { background: #0B0E14; padding: 10px 12px; border-radius: 10px; font-size: 12px; color: #E2B13C; border-left: 3px solid #E2B13C; }

/* Profile Card & VIP Box */
.profile-card { background: #141B29; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 22px; text-align: center; margin-bottom: 16px; }
.avatar-circle { width: 70px; height: 70px; border-radius: 50%; background: #1A2232; color: #E2B13C; font-size: 32px; display: grid; place-items: center; margin: 0 auto 12px; border: 2px solid #E2B13C; box-shadow: 0 4px 15px rgba(226, 177, 60, 0.2); }
.profile-name { font-size: 19px; font-weight: 900; }
.profile-tag { font-size: 12px; color: #6C7D93; margin-bottom: 12px; }

.vip-card { background: linear-gradient(145deg, #1E180D 0%, #100D07 100%); border: 1px solid rgba(226, 177, 60, 0.4); border-radius: 20px; padding: 22px; text-align: center; margin-bottom: 16px; }
.vip-header { font-size: 22px; font-weight: 900; color: #E2B13C; margin-bottom: 6px; }
.vip-list { text-align: left; margin: 16px 0; display: flex; flex-direction: column; gap: 10px; }
.vip-list-item { font-size: 12px; color: #CBD5E1; display: flex; align-items: center; gap: 10px; font-weight: 600; }
.vip-list-item::before { content: '✓'; color: #E2B13C; font-weight: 900; }

.btn-gold { width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, #E2B13C 0%, #A87A18 100%); border: none; color: #000; font-weight: 900; font-size: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(226, 177, 60, 0.3); }

.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 18px; background: #141B29; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #FFF; cursor: pointer; }
.menu-item span { color: #6C7D93; font-size: 12px; }

/* Modal Popup */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: grid; place-items: center; padding: 20px; z-index: 200; }
.modal-content { width: min(400px, 100%); background: #141B29; border: 1px solid rgba(226, 177, 60, 0.4); border-radius: 24px; padding: 22px; position: relative; }
.modal-close-btn { position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: #8A97A8; font-size: 22px; cursor: pointer; }

.chart-graphic { width: 100%; height: 140px; background: #0B0E14; border-radius: 14px; margin: 14px 0; padding: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05); }

/* Bottom Nav Bar */
.bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: min(440px, 100%); padding: 10px 12px 14px; background: rgba(11, 14, 20, 0.96); backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,0.08); display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; z-index: 100; }
.nav-btn { border: none; background: transparent; color: #6C7D93; padding: 6px; border-radius: 12px; font-weight: 700; font-size: 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: 0.2s; }
.nav-btn.active { color: #E2B13C; background: rgba(226, 177, 60, 0.12); }
.nav-btn i { font-size: 18px; font-style: normal; }

/* Test Panel */
.test-box { background: #141B29; border: 1px dashed rgba(226, 177, 60, 0.4); border-radius: 18px; padding: 16px; margin-top: 24px; }
.test-box h4 { color: #E2B13C; font-size: 14px; font-weight: 800; margin-bottom: 10px; }
.test-input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: #0B0E14; color: #FFF; font-size: 12px; outline: none; margin-bottom: 10px; }
.test-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-sm { padding: 10px; border-radius: 10px; font-weight: 800; font-size: 11px; border: none; cursor: pointer; }
.btn-sm.green { background: rgba(40, 199, 111, 0.2); color: #28C76F; border: 1px solid rgba(40, 199, 111, 0.4); }
.btn-sm.red { background: rgba(255, 77, 97, 0.2); color: #FF4D61; border: 1px solid rgba(255, 77, 97, 0.4); }
</style>
</head>
<body>

<div class="app-container">

  <!-- Top Header -->
  <div class="top-header">
    <div class="brand-group">
      <div class="phoenix-logo-badge">
        <svg class="phoenix-logo-svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="pGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFE885"/>
              <stop offset="40%" stop-color="#E2B13C"/>
              <stop offset="80%" stop-color="#C8961D"/>
              <stop offset="100%" stop-color="#7A5808"/>
            </linearGradient>
          </defs>
          <path d="M50 10 L54 2 L58 10 L63 4 L61 14 L68 10 L62 18 L50 22 L38 18 L32 10 L39 14 L37 4 L42 10 L46 2 Z" fill="url(#pGold)"/>
          <path d="M48 25 C30 15, 10 20, 2 38 C14 34, 26 33, 36 36 C22 39, 8 48, 6 60 C18 53, 30 51, 42 48 C28 55, 18 68, 20 78 C30 69, 40 62, 46 53 C44 66, 45 78, 49 88 C48 76, 47 63, 46 51 Z" fill="url(#pGold)"/>
          <path d="M52 25 C70 15, 90 20, 98 38 C86 34, 74 33, 64 36 C78 39, 92 48, 94 60 C82 53, 70 51, 58 48 C72 55, 82 68, 80 78 C70 69, 60 62, 54 53 C56 66, 55 78, 51 88 C52 76, 53 63, 54 51 Z" fill="url(#pGold)"/>
        </svg>
      </div>
      <div class="brand-titles">
        <div class="brand-main">PHOENIX HT</div>
        <div class="brand-sub">TRADING</div>
      </div>
    </div>
    <div class="icon-button" onclick="switchTab('profile')">🔔</div>
  </div>

  <!-- TAB 1: HOME -->
  <div id="tab-home">
    <div class="hero-card">
      <div class="banner-tag">DAILY ANALYSIS & TRADING SIGNALS</div>
      <div class="banner-heading">Trade Smarter, Not Harder</div>
      <div class="banner-subtext">Stay ahead. Trade with confidence.</div>
    </div>

    <div class="section-header">
      Latest Signal
      <span onclick="switchTab('signals')">View All →</span>
    </div>
    <div id="homeLatestSignal"></div>

    <div class="section-header">
      Latest Analysis
      <span onclick="switchTab('analysis')">View All →</span>
    </div>
    <div id="homeLatestAnalysis"></div>

    <!-- Live Test Creator -->
    <div class="test-box">
      <h4>🛠️ Live Signal Test Panel</h4>
      <input id="quickInput" class="test-input" value="شراء ذهب على 3650 SL 3644 TP 3662">
      <div class="test-grid">
        <button class="btn-sm green" onclick="sendQuickTest('شراء ذهب 3655 SL 3648 TP 3670')">+ BUY Signal</button>
        <button class="btn-sm red" onclick="sendQuickTest('بيع ذهب 3660 SL 3668 TP 3645')">+ SELL Signal</button>
      </div>
    </div>
  </div>

  <!-- TAB 2: SIGNALS -->
  <div id="tab-signals" class="hidden">
    <div class="section-header" style="margin-top:0;">Free Signals</div>
    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterSignals('ALL', this)">All</button>
      <button class="filter-btn" onclick="filterSignals('ACTIVE', this)">Active</button>
      <button class="filter-btn" onclick="filterSignals('TP_HIT', this)">TP/SL</button>
      <button class="filter-btn" onclick="filterSignals('CLOSED', this)">Closed</button>
    </div>
    <div id="signalsList"></div>
  </div>

  <!-- TAB 3: ANALYSIS -->
  <div id="tab-analysis" class="hidden">
    <div class="section-header" style="margin-top:0;">Market Analysis</div>
    <div class="filter-bar">
      <button class="filter-btn active">All</button>
      <button class="filter-btn">Gold</button>
      <button class="filter-btn">Forex</button>
      <button class="filter-btn">Market</button>
    </div>
    <div id="analysisList"></div>
  </div>

  <!-- TAB 4: CHAT -->
  <div id="tab-chat" class="hidden">
    <div class="section-header" style="margin-top:0;">Questions / Chat</div>
    <input id="chatInput" class="test-input" placeholder="Ask a question about signals..." style="padding:14px; margin-bottom:10px;">
    <button class="btn-gold" style="margin-bottom:18px; padding:12px;" onclick="submitQuestion()">Ask a Question</button>
    <div id="chatList"></div>
  </div>

  <!-- TAB 5: PROFILE -->
  <div id="tab-profile" class="hidden">
    <div class="profile-card">
      <div class="avatar-circle">👤</div>
      <div class="profile-name">Abbas Mjallal</div>
      <div class="profile-tag">@abbasmj</div>
      <div style="font-size:11px; background:#1A2232; color:#E2B13C; padding:4px 14px; border-radius:12px; display:inline-block; font-weight:800; border:1px solid rgba(226, 177, 60, 0.3);">Free Plan</div>
    </div>

    <div class="vip-card">
      <div class="vip-header">👑 VIP Coming Soon</div>
      <div style="font-size:12px; color:#8A97A8;">Get premium signals, advanced analysis, private chat and more.</div>
      <div class="vip-list">
        <div class="vip-list-item">VIP Signals (higher accuracy)</div>
        <div class="vip-list-item">Advanced Analysis</div>
        <div class="vip-list-item">Real-time Notifications</div>
        <div class="vip-list-item">VIP Chat (direct)</div>
        <div class="vip-list-item">Exclusive Content & Priority Support</div>
      </div>
      <button class="btn-gold" onclick="alert('Added to VIP notification list!')">Notify Me</button>
    </div>

    <div class="menu-item">Subscription <span>Free Plan</span></div>
    <div class="menu-item">Notifications <span>On</span></div>
    <div class="menu-item">Language <span>English ></span></div>
    <div class="menu-item">Help & Support</div>
    <div class="menu-item">About Phoenix HT Trading</div>
  </div>

</div>

<!-- Signal Modal -->
<div id="detailsModal" class="modal-overlay hidden">
  <div class="modal-content">
    <button class="modal-close-btn" onclick="closeModal()">✕</button>
    <div id="modalBody"></div>
  </div>
</div>

<!-- Bottom Navigation Bar -->
<div class="bottom-nav">
  <button class="nav-btn active" id="btn-home" onclick="switchTab('home')"><i>🏠</i>Home</button>
  <button class="nav-btn" id="btn-signals" onclick="switchTab('signals')"><i>📊</i>Signals</button>
  <button class="nav-btn" id="btn-analysis" onclick="switchTab('analysis')"><i>📈</i>Analysis</button>
  <button class="nav-btn" id="btn-chat" onclick="switchTab('chat')"><i>💬</i>Chat</button>
  <button class="nav-btn" id="btn-profile" onclick="switchTab('profile')"><i>👤</i>Profile</button>
</div>

<script>
// Data pre-loaded instantly
var appData = ${initialDataJSON};
var currentFilter = 'ALL';

window.switchTab = function(tabName) {
  var tabs = ['home', 'signals', 'analysis', 'chat', 'profile'];
  for(var i=0; i<tabs.length; i++){
    var t = tabs[i];
    var c = document.getElementById('tab-' + t);
    var b = document.getElementById('btn-' + t);
    if(c) c.classList.add('hidden');
    if(b) b.classList.remove('active');
  }
  var activeC = document.getElementById('tab-' + tabName);
  var activeB = document.getElementById('btn-' + tabName);
  if(activeC) activeC.classList.remove('hidden');
  if(activeB) activeB.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.filterSignals = function(status, el) {
  currentFilter = status;
  var btns = document.querySelectorAll('.filter-btn');
  for(var i=0; i<btns.length; i++) btns[i].classList.remove('active');
  if(el) el.classList.add('active');
  renderSignals();
};

window.openSignalDetails = function(id) {
  var sig = null;
  for(var i=0; i<appData.signals.length; i++){
    if(appData.signals[i].id === id) { sig = appData.signals[i]; break; }
  }
  if(!sig) return;

  var isBuy = sig.direction === 'BUY';
  var dirClass = isBuy ? 'buy' : 'sell';

  var html = '<div style="font-size:20px; font-weight:900; margin-bottom:4px; color:#FFF;">' + sig.symbol + ' <span class="dir-badge ' + dirClass + '">' + sig.direction + '</span></div>' +
    '<div style="font-size:11px; color:#8A97A8; margin-bottom:14px; font-weight:700;">Confidence: ' + sig.confidence + ' • ' + sig.timeAgo + '</div>' +
    '<div class="price-grid" style="margin-bottom:14px;">' +
      '<div class="price-box"><label>Entry</label><val>' + sig.entry + '</val></div>' +
      '<div class="price-box"><label>SL</label><val>' + sig.stop + '</val></div>' +
      '<div class="price-box"><label>TP1</label><val>' + sig.tp1 + '</val></div>' +
      '<div class="price-box"><label>TP2</label><val>' + sig.tp2 + '</val></div>' +
    '</div>' +
    '<div class="chart-graphic">' +
      '<svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">' +
        '<path d="M10 75 Q 80 20, 150 55 T 290 25" fill="none" stroke="' + (isBuy ? '#28C76F' : '#FF4D61') + '" stroke-width="3"/>' +
        '<line x1="0" y1="55" x2="300" y2="55" stroke="#E2B13C" stroke-dasharray="4" stroke-width="1"/>' +
      '</svg>' +
    '</div>' +
    '<div style="font-size:12px; color:#CBD5E1; line-height:1.5; margin-bottom:18px;">' + sig.analysisText + '</div>' +
    '<button class="btn-gold" onclick="alert(\'TradingView chart view\')">View on Chart</button>';

  document.getElementById('modalBody').innerHTML = html;
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
  }).then(function(){ refreshData(); });
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
    refreshData();
  });
};

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
    homeSigBox.innerHTML = createCardHTML(activeSig);
  } else {
    homeSigBox.innerHTML = '<div style="color:#6C7D93; font-size:12px; padding:10px;">No active signal</div>';
  }

  var latestAn = appData.analyses[0];
  var homeAnBox = document.getElementById('homeLatestAnalysis');
  if(latestAn){
    homeAnBox.innerHTML = '<div class="analysis-card">' +
      '<div class="an-header">' + latestAn.title + '</div>' +
      '<div class="an-subhead">' + latestAn.symbol + ' • ' + latestAn.timeAgo + '</div>' +
      '<div class="an-text">' + latestAn.text + '</div>' +
      '<button class="btn-outline" onclick="switchTab(\'analysis\')">View Analysis</button>' +
    '</div>';
  }
}

function renderSignals() {
  var list = appData.signals;
  if(currentFilter !== 'ALL') {
    var filtered = [];
    for(var i=0; i<list.length; i++){
      if(list[i].status === currentFilter) filtered.push(list[i]);
    }
    list = filtered;
  }
  var container = document.getElementById('signalsList');
  if(!list.length) {
    container.innerHTML = '<div style="color:#6C7D93; font-size:13px; text-align:center; padding:30px;">No signals found</div>';
    return;
  }
  var htmlArr = [];
  for(var j=0; j<list.length; j++) htmlArr.push(createCardHTML(list[j]));
  container.innerHTML = htmlArr.join('');
}

function createCardHTML(sig) {
  var isBuy = sig.direction === 'BUY';
  var dirClass = isBuy ? 'buy' : 'sell';
  var statusClass = sig.status.toLowerCase();

  return '<div class="signal-card" onclick="openSignalDetails(\'' + sig.id + '\')">' +
    '<div class="card-top">' +
      '<div class="pair-title">' + sig.symbol + ' <span class="dir-badge ' + dirClass + '">' + sig.direction + '</span></div>' +
      '<div class="status-badge ' + statusClass + '">' + sig.status.replace('_', ' ') + '</div>' +
    '</div>' +
    '<div class="price-grid">' +
      '<div class="price-box"><label>Entry</label><val>' + sig.entry + '</val></div>' +
      '<div class="price-box"><label>SL</label><val>' + sig.stop + '</val></div>' +
      '<div class="price-box"><label>TP1</label><val>' + sig.tp1 + '</val></div>' +
      '<div class="price-box"><label>TP2</label><val>' + sig.tp2 + '</val></div>' +
    '</div>' +
  '</div>';
}

function renderAnalysis() {
  var container = document.getElementById('analysisList');
  var htmlArr = [];
  for(var i=0; i<appData.analyses.length; i++){
    var an = appData.analyses[i];
    htmlArr.push(
      '<div class="analysis-card">' +
        '<div class="an-header">' + an.title + '</div>' +
        '<div class="an-subhead">' + an.symbol + ' • ' + an.date + '</div>' +
        '<div class="an-text">' + an.text + '</div>' +
        '<button class="btn-outline" onclick="alert(\'Opening analysis...\')">Read More</button>' +
      '</div>'
    );
  }
  container.innerHTML = htmlArr.join('');
}

function renderChat() {
  var container = document.getElementById('chatList');
  var htmlArr = [];
  for(var i=0; i<appData.chatQuestions.length; i++){
    var q = appData.chatQuestions[i];
    htmlArr.push(
      '<div class="chat-card">' +
        '<div class="chat-top"><span class="chat-user">👤 ' + q.author + '</span><span class="chat-time">' + q.timeAgo + '</span></div>' +
        '<div class="chat-question">' + q.question + '</div>' +
        '<div class="chat-reply">💬 ' + q.answer + '</div>' +
      '</div>'
    );
  }
  container.innerHTML = htmlArr.join('');
}

function refreshData() {
  fetch('/api/data')
    .then(function(res){ return res.json(); })
    .then(function(data){
      if(data.ok){
        appData = data;
        renderAll();
      }
    }).catch(function(){});
}

// Initial render immediately
renderAll();
setInterval(refreshData, 5000);
</script>
</body>
</html>`;
}

app.listen(PORT, "0.0.0.0", () => {
  console.log("Phoenix HT Trading running on port " + PORT);
});
