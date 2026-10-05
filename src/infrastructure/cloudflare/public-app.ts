import type { Market } from "../../domain/market.js";
import type { Offer } from "../../domain/offer.js";
import { compareDecimalStrings } from "../../domain/offer.js";
import type { ScannerSchedulerRuntimeState } from "./scanner-scheduler-do.js";

const MAX_VISIBLE_OFFERS = 8;

export interface PublicMarketOffer {
  readonly id: string;
  readonly side: "BUY" | "SELL";
  readonly rate: string;
  readonly amount: string;
  readonly availableAmount: string;
  readonly observedAt: string;
}

export interface PublicMarketMetrics {
  readonly totalOffers: number;
  readonly buyOffers: number;
  readonly sellOffers: number;
  readonly totalAvailableAmount: string;
  readonly bestBuyRate: string | null;
  readonly bestSellRate: string | null;
  readonly spread: string | null;
  readonly spreadPercent: number | null;
  readonly crossedMarket: boolean;
  readonly snapshotAt: string | null;
}

export interface PublicScannerState {
  readonly configured: boolean;
  readonly coin: string | null;
  readonly intervalSeconds: number | null;
  readonly nextAlarmAt: number | null;
  readonly running: boolean;
  readonly lastStartedAt: string | null;
  readonly lastCompletedAt: string | null;
  readonly lastError: string | null;
  readonly metrics: PublicMarketMetrics;
  readonly buyOffers: readonly PublicMarketOffer[];
  readonly sellOffers: readonly PublicMarketOffer[];
}

function addPositiveDecimals(values: readonly string[]): string {
  const normalized = values.map((value) => {
    const [integer = "0", fraction = ""] = value.split(".");
    return { integer: integer.replace(/^0+(?=\d)/, ""), fraction };
  });
  const fractionLength = normalized.reduce(
    (max, value) => Math.max(max, value.fraction.length),
    0,
  );
  let carry = 0;
  let fraction = "";
  for (let index = fractionLength - 1; index >= 0; index -= 1) {
    let digit = carry;
    for (const value of normalized) {
      digit += Number(value.fraction[index] ?? "0");
    }
    fraction = String(digit % 10) + fraction;
    carry = Math.floor(digit / 10);
  }
  let integer = "";
  const maxIntegerLength = normalized.reduce(
    (max, value) => Math.max(max, value.integer.length),
    0,
  );
  for (let index = maxIntegerLength - 1; index >= 0; index -= 1) {
    let digit = carry;
    for (const value of normalized) {
      const position = index - (maxIntegerLength - value.integer.length);
      digit += Number(position >= 0 ? value.integer[position] : "0");
    }
    integer = String(digit % 10) + integer;
    carry = Math.floor(digit / 10);
  }
  while (carry > 0) {
    integer = String(carry % 10) + integer;
    carry = Math.floor(carry / 10);
  }
  fraction = fraction.replace(/0+$/, "");
  return fraction ? integer + "." + fraction : integer || "0";
}

function toPublicOffer(offer: Offer): PublicMarketOffer {
  return {
    id: offer.id,
    side: offer.side,
    rate: offer.rate,
    amount: offer.amount,
    availableAmount: offer.availableAmount,
    observedAt: offer.observedAt,
  };
}

function buildMarketView(market: Market | null, completedAt: string | null) {
  if (!market) {
    return {
      metrics: {
        totalOffers: 0,
        buyOffers: 0,
        sellOffers: 0,
        totalAvailableAmount: "0",
        bestBuyRate: null,
        bestSellRate: null,
        spread: null,
        spreadPercent: null,
        crossedMarket: false,
        snapshotAt: null,
      } satisfies PublicMarketMetrics,
      buyOffers: [] as PublicMarketOffer[],
      sellOffers: [] as PublicMarketOffer[],
    };
  }

  const buy = market.offers
    .filter((offer) => offer.side === "BUY")
    .sort((left, right) => compareDecimalStrings(right.rate, left.rate));
  const sell = market.offers
    .filter((offer) => offer.side === "SELL")
    .sort((left, right) => compareDecimalStrings(left.rate, right.rate));
  const bestBuy = buy[0]?.rate ?? null;
  const bestSell = sell[0]?.rate ?? null;
  const crossedMarket =
    bestBuy !== null &&
    bestSell !== null &&
    compareDecimalStrings(bestBuy, bestSell) > 0;
  const bestBuyNumber = bestBuy === null ? null : Number(bestBuy);
  const bestSellNumber = bestSell === null ? null : Number(bestSell);
  const spread =
    bestBuyNumber !== null && bestSellNumber !== null
      ? (bestSellNumber - bestBuyNumber)
          .toFixed(8)
          .replace(/0+$/, "")
          .replace(/\.$/, "")
      : null;
  const spreadPercent =
    bestBuyNumber !== null &&
    bestBuyNumber !== 0 &&
    bestSellNumber !== null
      ? ((bestSellNumber - bestBuyNumber) / bestBuyNumber) * 100
      : null;

  return {
    metrics: {
      totalOffers: market.offers.length,
      buyOffers: buy.length,
      sellOffers: sell.length,
      totalAvailableAmount: addPositiveDecimals(
        market.offers.map((offer) => offer.availableAmount),
      ),
      bestBuyRate: bestBuy,
      bestSellRate: bestSell,
      spread,
      spreadPercent,
      crossedMarket,
      snapshotAt: completedAt,
    } satisfies PublicMarketMetrics,
    buyOffers: buy.slice(0, MAX_VISIBLE_OFFERS).map(toPublicOffer),
    sellOffers: sell.slice(0, MAX_VISIBLE_OFFERS).map(toPublicOffer),
  };
}

export function toPublicScannerState(
  state: ScannerSchedulerRuntimeState,
): PublicScannerState {
  const marketView = buildMarketView(
    state.market,
    state.execution.lastCompletedAt,
  );
  return {
    configured: state.configured,
    coin: state.coin,
    intervalSeconds: state.intervalSeconds,
    nextAlarmAt: state.nextAlarmAt,
    running:
      state.execution.lastStartedAt !== null &&
      (state.execution.lastCompletedAt === null ||
        state.execution.lastStartedAt > state.execution.lastCompletedAt),
    lastStartedAt: state.execution.lastStartedAt,
    lastCompletedAt: state.execution.lastCompletedAt,
    lastError: state.execution.lastError,
    ...marketView,
  };
}

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="QvaPay-AI professional P2P market intelligence dashboard">
<title>QvaPay-AI · Live Market</title>
<style>
:root{color-scheme:dark;--bg:#070b14;--panel:#0d1424;--panel2:#111a2d;--line:#24314d;--text:#edf3ff;--muted:#8f9dbb;--good:#55e39a;--warn:#f4c95d;--bad:#ff7188;--accent:#7c9cff;--buy:#47d7a0;--sell:#ff7890;--shadow:0 18px 55px rgba(0,0,0,.25);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 15% 0,#16233f 0,transparent 35%),radial-gradient(circle at 90% 10%,#211a3e 0,transparent 32%),var(--bg);color:var(--text)}
main{max-width:1440px;margin:auto;padding:22px clamp(14px,3vw,38px) 40px}.top{display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap}.brand{display:flex;gap:14px;align-items:center}.logo{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#6f8cff,#9b6dff);font-size:26px;box-shadow:var(--shadow)}h1{font-size:clamp(22px,3vw,32px);margin:0}.subtitle{margin:3px 0 0;color:var(--muted);font-size:13px}.live{display:flex;align-items:center;gap:9px;padding:10px 14px;border:1px solid var(--line);border-radius:999px;background:#0b1220}.dot{width:9px;height:9px;border-radius:50%;background:var(--good);box-shadow:0 0 14px var(--good)}.live.bad .dot{background:var(--bad);box-shadow:0 0 14px var(--bad)}
.hero{margin-top:22px;display:grid;grid-template-columns:1.5fr 1fr;gap:16px}.panel{background:linear-gradient(145deg,rgba(17,26,45,.94),rgba(10,16,29,.94));border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow)}.overview{padding:24px}.eyebrow{color:var(--muted);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.coin{font-size:42px;font-weight:800;margin:5px 0}.health{display:flex;gap:9px;align-items:center;color:var(--good)}.countdown{font-variant-numeric:tabular-nums;font-size:44px;font-weight:800;color:var(--accent)}.countdown small{font-size:13px;color:var(--muted);font-weight:500}.metrics{margin-top:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric{padding:15px;border-radius:14px;background:rgba(6,11,22,.65);border:1px solid #1e2a44}.metric b{display:block;font-size:18px;margin-top:5px}.metric span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.best{padding:22px}.bestgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:13px}.quote{padding:18px;border-radius:16px;background:#0a1220;border:1px solid var(--line)}.quote.buy{border-color:rgba(71,215,160,.35)}.quote.sell{border-color:rgba(255,120,144,.35)}.side{font-size:12px;font-weight:800;letter-spacing:.08em}.buy .side{color:var(--buy)}.sell .side{color:var(--sell)}.rate{font-size:25px;font-weight:800;margin:8px 0}.small{font-size:12px;color:var(--muted)}
.tables{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px}.tablepanel{overflow:hidden}.tablehead{display:flex;justify-content:space-between;align-items:center;padding:17px 19px;border-bottom:1px solid var(--line)}.tablehead h2{font-size:17px;margin:0}.badge{font-size:11px;color:var(--muted);padding:5px 8px;border:1px solid var(--line);border-radius:999px}table{width:100%;border-collapse:collapse}th,td{text-align:right;padding:12px 16px;border-bottom:1px solid rgba(36,49,77,.55);font-variant-numeric:tabular-nums}th:first-child,td:first-child{text-align:left}th{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}td{font-size:13px}.ratecell{font-weight:750}.buyrate{color:var(--buy)}.sellrate{color:var(--sell)}tr:last-child td{border-bottom:0}.empty{padding:35px;text-align:center;color:var(--muted)}
.footer{margin-top:17px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:var(--muted);font-size:11px}.iso{display:flex;gap:12px;flex-wrap:wrap}.tag{padding:5px 8px;border:1px solid #1d2942;border-radius:7px}
@media(max-width:900px){.hero,.tables{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){main{padding:15px 10px 30px}.overview{padding:18px}.coin{font-size:34px}.countdown{font-size:34px}.metrics{grid-template-columns:1fr 1fr}.bestgrid{grid-template-columns:1fr}th,td{padding:10px 8px;font-size:11px}}
</style>
</head>
<body>
<main>
<header class="top">
<div class="brand"><div class="logo">⚡</div><div><h1>QvaPay-AI</h1><p class="subtitle">P2P Market Intelligence · Server-Side Monitoring</p></div></div>
<div id="live" class="live"><i class="dot"></i><strong id="liveText">CONNECTING</strong><span>·</span><span id="updated">—</span></div>
</header>
<section class="hero">
<div class="panel overview">
<div class="eyebrow">📊 Market overview</div><div class="coin" id="coin">—</div>
<div class="health"><span id="healthIcon">●</span><span id="health">Waiting for first server scan</span></div>
<div class="metrics">
<div class="metric"><span>💰 Liquidity</span><b id="liquidity">—</b></div>
<div class="metric"><span>📋 Offers</span><b id="offers">—</b></div>
<div class="metric"><span>↕️ Spread</span><b id="spread">—</b></div>
<div class="metric"><span>🎯 Data quality</span><b id="quality">—</b></div>
</div>
</div>
<div class="panel best"><div class="eyebrow">🏆 Best market opportunities</div>
<div class="bestgrid">
<div class="quote buy"><div class="side">🟢 BEST BUY</div><div class="rate" id="bestBuy">—</div><div class="small">Highest observed BUY rate</div></div>
<div class="quote sell"><div class="side">🔴 BEST SELL</div><div class="rate" id="bestSell">—</div><div class="small">Lowest observed SELL rate</div></div>
</div>
<div style="margin-top:15px"><div class="eyebrow">⏱️ Next server scan</div><div class="countdown" id="countdown">— <small>seconds</small></div></div>
</div>
</section>
<section class="tables">
<div class="panel tablepanel"><div class="tablehead"><h2>🟢 BUY — mejores tasas</h2><span class="badge" id="buyCount">0 offers</span></div><div id="buyTable"></div></div>
<div class="panel tablepanel"><div class="tablehead"><h2>🔴 SELL — mejores tasas</h2><span class="badge" id="sellCount">0 offers</span></div><div id="sellTable"></div></div>
</section>
<footer class="footer">
<div class="iso"><span class="tag">ISO-aligned observability</span><span class="tag">Read-only</span><span class="tag">Server-side 24/7</span><span class="tag">No orders sent</span></div>
<div>Auto-refresh: <strong id="intervalLabel">10</strong>s · Snapshot: <span id="snapshot">—</span></div>
</footer>
</main>
<script>
const $=id=>document.getElementById(id);
let state=null;
const esc=value=>String(value??"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtNumber=value=>Number.isFinite(Number(value))?Number(value).toLocaleString(undefined,{maximumFractionDigits:8}):"—";
const fmtTime=value=>value?new Date(value).toLocaleTimeString():"—";
const table=(offers,side)=>offers.length?\`<table><thead><tr><th>Rate</th><th>Available</th><th>Amount</th><th>Observed</th></tr></thead><tbody>\${offers.map((o,i)=>\`<tr><td class="ratecell \${side==="BUY"?"buyrate":"sellrate"}">\${i===0?"★ ":""}\${esc(o.rate)}</td><td>\${esc(o.availableAmount)}</td><td>\${esc(o.amount)}</td><td>\${fmtTime(o.observedAt)}</td></tr>\`).join("")}</tbody></table>\`:'<div class="empty">No compatible offers in the latest snapshot.</div>';
function render(){
 if(!state)return;
 $("coin").textContent=state.coin||"—";
 $("liquidity").textContent=state.metrics.totalAvailableAmount;
 $("offers").textContent=state.metrics.totalOffers;
 $("spread").textContent=state.metrics.spread===null?"—":state.metrics.spread+" ("+state.metrics.spreadPercent.toFixed(3)+"%)";
 const quality=state.metrics.snapshotAt?Math.max(0,Date.now()-new Date(state.metrics.snapshotAt).getTime()):Infinity;
 $("quality").textContent=quality<state.intervalSeconds*2000?"FRESH":"STALE";
 $("bestBuy").textContent=state.metrics.bestBuyRate||"—";
 $("bestSell").textContent=state.metrics.bestSellRate||"—";
 $("buyCount").textContent=state.metrics.buyOffers+" offers";
 $("sellCount").textContent=state.metrics.sellOffers+" offers";
 $("buyTable").innerHTML=table(state.buyOffers,"BUY");
 $("sellTable").innerHTML=table(state.sellOffers,"SELL");
 $("snapshot").textContent=fmtTime(state.metrics.snapshotAt);
 $("intervalLabel").textContent=state.intervalSeconds??10;
 $("updated").textContent=fmtTime(state.lastCompletedAt);
 const healthy=state.configured&&!state.lastError;
 $("live").className="live "+(healthy?"":"bad");
 $("liveText").textContent=healthy?"LIVE":"DEGRADED";
 $("health").textContent=state.lastError?"Scanner error: "+state.lastError:(state.running?"Scanner executing live market scan":"Server scanner healthy");
 $("healthIcon").textContent=state.lastError?"⚠":"●";
}
async function refresh(){
 try{
  const r=await fetch("/api/scanner/status",{headers:{Accept:"application/json"},cache:"no-store"});
  if(!r.ok)throw new Error("HTTP "+r.status);
  state=await r.json(); render();
 }catch(error){
  $("live").className="live bad"; $("liveText").textContent="OFFLINE"; $("health").textContent="Dashboard cannot reach server runtime";
 }
}
function tick(){
 if(!state||!state.nextAlarmAt){$("countdown").textContent="—";return}
 const seconds=Math.max(0,Math.ceil((state.nextAlarmAt-Date.now())/1000));
 $("countdown").innerHTML=seconds+' <small>seconds</small>';
}
refresh(); tick(); setInterval(refresh,10000); setInterval(tick,1000);
</script>
</body>
</html>`;

export function createPublicAppResponse(): Response {
  return new Response(HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}

export function createPublicScannerStateResponse(
  state: PublicScannerState,
): Response {
  return Response.json(state, {
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
