require("dotenv").config();
const express=require("express"),crypto=require("crypto");
const app=express();app.use(express.json({limit:"1mb"}));
const PORT=process.env.PORT||3000;
const signals=[],users=[];
const page=()=>`<!doctype html><html lang="ar" dir="rtl"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phoenix HT Trading</title><style>body{margin:0;background:#090909;color:#eee;font-family:Arial;padding:18px}main{max-width:650px;margin:auto}.card{background:#151515;border:1px solid #292929;border-radius:18px;padding:16px;margin:12px 0}.gold{color:#d9b55a}.buy{color:#55d98b}.sell{color:#ff6969}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.box{background:#202020;padding:10px;border-radius:10px}input,button{width:100%;padding:12px;margin:5px 0;box-sizing:border-box;border-radius:10px}input{background:#111;color:#fff;border:1px solid #333}button{background:#d9b55a;border:0;font-weight:bold}</style><main><h1 class="gold">PHOENIX HT TRADING</h1><p>Private Recommendations</p><div id="auth" class="card"><h3>دخول</h3><input id="u" placeholder="Username"><input id="p" type="password" placeholder="Password"><button onclick="go()">دخول</button><p id="m"></p></div><div id="app" style="display:none"><div class="card"><h3>التوصيات</h3><div id="list"></div></div><div class="card"><b>VIP</b><p>VIP SOON</p></div></div><script>async function go(){let r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u.value,password:p.value})});let d=await r.json();if(d.ok){auth.style.display="none";app.style.display="block";load()}else m.textContent="بيانات الدخول غير صحيحة"}async function load(){let d=await (await fetch("/api/signals")).json();list.innerHTML=d.signals.length?d.signals.slice().reverse().map(s=>'<div class="card"><b class="'+s.direction.toLowerCase()+'">'+s.direction+" XAUUSD</b><div class=\"grid\"><div class=\"box\">Entry<br><b>"+s.entry+"</b></div><div class=\"box\">SL<br><b>"+(s.sl||"—")+"</b></div><div class=\"box\">Target<br><b>"+(s.target||"—")+"</b></div></div><p>"+s.status+"</p>"+(s.updates||[]).map(x=>'<span class="gold">+'+x+" pips</span>").join("<br>")+"</div>").join(""):"لا يوجد توصيات بعد"}load();setInterval(load,5000)</script></main></html>`;

function parse(t){
 const n=String(t||"").toLowerCase();
 const direction=/شراء|buy|long/.test(n)?"BUY":/بيع|sell|short/.test(n)?"SELL":null;
 const entry=(n.match(/(?:entry|دخول|شراء|بيع)\s*[:=-]?\s*(\d+(?:\.\d+)?)/)||[])[1];
 const sl=(n.match(/(?:sl|stop|ستوب|وقف)\s*[:=-]?\s*(\d+(?:\.\d+)?)/)||[])[1];
 const target=(n.match(/(?:tp|target|هدف)\s*[:=-]?\s*(\d+(?:\.\d+)?)/)||[])[1];
 const pip=(n.match(/\+\s*(\d+(?:\.\d+)?)\s*p+i+p+/i)||[])[1];
 const cancel=/نلغ|الغاء|ملغي|cancel/.test(n);
 return {direction,entry:entry?Number(entry):null,sl:sl?Number(sl):null,target:target?Number(target):null,pip:pip?Number(pip):null,cancel};
}
function apply(text){
 const p=parse(text);let s=signals[signals.length-1];
 if(p.cancel&&s){s.status="CANCELLED";return s}
 if(p.direction&&p.entry!=null){s={id:crypto.randomUUID(),symbol:"XAUUSD",direction:p.direction,entry:p.entry,sl:p.sl,target:p.target,status:"PENDING",updates:[]};signals.push(s)}
 if(!s)return null;
 if(p.sl!=null)s.sl=p.sl;if(p.target!=null)s.target=p.target;
 if(p.pip!=null){s.status="ACTIVE";s.updates.push(p.pip)}
 return s;
}
app.get("/",(_,res)=>res.send(page()));
app.get("/health",(_,res)=>res.json({ok:true,app:"Phoenix HT Trading"}));
app.get("/api/signals",(_,res)=>res.json({signals}));
app.post("/api/login",(req,res)=>res.json({ok:true,user:{username:req.body?.username||"demo"}}));
app.post("/telegram/webhook",(req,res)=>{const m=req.body?.message||req.body?.channel_post;if(m)apply(m.text||m.caption||"");res.json({ok:true})});
app.listen(PORT,()=>console.log("Phoenix HT Trading running on "+PORT));
