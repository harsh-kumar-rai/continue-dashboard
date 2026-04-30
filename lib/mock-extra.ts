// Extended deterministic mock data for the BETAGEN terminal.
// Powers: FII/DII history, block & bulk deals, depth ladder, time & sales,
// economic calendar, IPO calendar, analyst recs, shareholding history,
// VIX cone, sector rotation (RRG), insider/SAST disclosures, equity option chains.

import { EQUITIES, INDICES, getEquity, getIndex, genOptionChain as genIndexChain } from "./mock-data"
import type { OptionExpiry, OptionRow, Sector } from "./types"

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function strSeed(s: string, mul = 7919): number {
  return s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * mul
}

// ------------------------------------------------------------------
// FII / DII daily activity (cash + F&O), 90 trading days back
// ------------------------------------------------------------------

export interface FlowDay {
  date: string // YYYY-MM-DD (trading-day calendar approximation)
  fiiCash: number // INR cr
  diiCash: number
  fiiIdxFut: number
  fiiIdxOpt: number
  fiiStkFut: number
  fiiStkOpt: number
}

export const FLOW_HISTORY: FlowDay[] = (() => {
  const rng = mulberry32(2026_04_30)
  const days: FlowDay[] = []
  const now = new Date()
  let d = new Date(now)
  let i = 0
  while (days.length < 90) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      const date = d.toISOString().slice(0, 10)
      const trend = Math.sin(i / 8) * 800
      const fiiCash = Math.round((rng() - 0.55) * 4500 + trend)
      const diiCash = Math.round((rng() - 0.45) * 3500 - trend * 0.6)
      days.push({
        date,
        fiiCash,
        diiCash,
        fiiIdxFut: Math.round((rng() - 0.5) * 9000),
        fiiIdxOpt: Math.round((rng() - 0.45) * 30000),
        fiiStkFut: Math.round((rng() - 0.5) * 4000),
        fiiStkOpt: Math.round((rng() - 0.5) * 1200),
      })
      i++
    }
    d.setDate(d.getDate() - 1)
  }
  return days
})()

// ------------------------------------------------------------------
// Block & Bulk deals (last 5 sessions, deterministic)
// ------------------------------------------------------------------

export interface DealRow {
  date: string
  symbol: string
  client: string
  side: "BUY" | "SELL"
  qty: number
  price: number
  exch: "NSE" | "BSE"
}

const CLIENTS = [
  "MORGAN STANLEY ASIA",
  "GOLDMAN SACHS (SING)",
  "SOCIETE GENERALE",
  "BNP PARIBAS",
  "CITIGROUP GLOBAL",
  "ABU DHABI INV AUTH",
  "GOVT PENSION FUND - NORWAY",
  "VANGUARD EM FUND",
  "ICICI PRU MF",
  "HDFC MF",
  "SBI MF",
  "MIRAE ASSET MF",
  "LIC OF INDIA",
  "AXIS MF",
  "KOTAK MF",
  "PLUTUS WEALTH MGMT",
]

function buildDeals(seed: number, count: number): DealRow[] {
  const rng = mulberry32(seed)
  const out: DealRow[] = []
  for (let i = 0; i < count; i++) {
    const e = EQUITIES[Math.floor(rng() * EQUITIES.length)]
    const buyer = CLIENTS[Math.floor(rng() * CLIENTS.length)]
    const sideRng = rng()
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(rng() * 5))
    out.push({
      date: date.toISOString().slice(0, 10),
      symbol: e.symbol,
      client: buyer,
      side: sideRng > 0.5 ? "BUY" : "SELL",
      qty: Math.floor(rng() * 4_000_000 + 50_000),
      price: e.price * (1 + (rng() - 0.5) * 0.012),
      exch: rng() > 0.7 ? "BSE" : "NSE",
    })
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const BLOCK_DEALS: DealRow[] = buildDeals(8881, 18)
export const BULK_DEALS: DealRow[] = buildDeals(7771, 26)

// ------------------------------------------------------------------
// Depth ladder (5 / 20 levels)
// ------------------------------------------------------------------

export interface DepthLevel {
  price: number
  qty: number
  orders: number
}
export interface DepthBook {
  symbol: string
  spot: number
  bids: DepthLevel[]
  asks: DepthLevel[]
}

export function genDepth(symbol: string, levels = 10): DepthBook {
  const eq = getEquity(symbol)
  const idx = getIndex(symbol)
  const spot = eq?.price ?? idx?.value ?? 1000
  const tick = spot < 100 ? 0.05 : spot < 1000 ? 0.1 : spot < 10000 ? 0.5 : 5
  const rng = mulberry32(strSeed(symbol, 9311))
  const bids: DepthLevel[] = []
  const asks: DepthLevel[] = []
  for (let i = 1; i <= levels; i++) {
    const bidPrice = spot - i * tick
    const askPrice = spot + i * tick
    const baseQty = Math.floor(((eq?.avgVol20 ?? 5_00_000) / 1500) * (1 + rng() * 2))
    bids.push({
      price: bidPrice,
      qty: Math.max(50, baseQty),
      orders: Math.max(1, Math.floor(baseQty / (50 + rng() * 200))),
    })
    asks.push({
      price: askPrice,
      qty: Math.max(50, Math.floor(baseQty * (0.7 + rng() * 0.7))),
      orders: Math.max(1, Math.floor(baseQty / (50 + rng() * 200))),
    })
  }
  return { symbol, spot, bids, asks }
}

// ------------------------------------------------------------------
// Time & Sales (last N prints)
// ------------------------------------------------------------------

export interface TapePrint {
  t: number
  price: number
  qty: number
  side: "BUY" | "SELL" | "MID"
}

export function genTape(symbol: string, n = 60): TapePrint[] {
  const eq = getEquity(symbol)
  const idx = getIndex(symbol)
  const spot = eq?.price ?? idx?.value ?? 1000
  const rng = mulberry32(strSeed(symbol, 4271))
  const out: TapePrint[] = []
  let t = Date.now()
  let p = spot
  for (let i = 0; i < n; i++) {
    t -= Math.floor(rng() * 6_000) + 200
    const drift = (rng() - 0.5) * (spot * 0.0008)
    p = Math.max(0.05, p + drift)
    const side: TapePrint["side"] = drift > 0.1 ? "BUY" : drift < -0.1 ? "SELL" : "MID"
    out.push({
      t,
      price: p,
      qty: Math.floor(rng() * 6000 + 1),
      side,
    })
  }
  return out
}

// ------------------------------------------------------------------
// Economic calendar (RBI, Fed, ECB, BoJ, India CPI/IIP/GDP, NFP)
// ------------------------------------------------------------------

export type ImportanceStar = 1 | 2 | 3
export interface EconEvent {
  date: string // ISO
  time: string // HH:MM IST
  region: "IN" | "US" | "EU" | "JP" | "CN" | "UK"
  event: string
  importance: ImportanceStar
  prior?: string
  forecast?: string
  actual?: string
}

export const ECON_EVENTS: EconEvent[] = (() => {
  const today = new Date()
  const mk = (offsetDays: number, h: number, m: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offsetDays)
    d.setHours(h, m, 0, 0)
    return { date: d.toISOString().slice(0, 10), time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` }
  }
  const rows: EconEvent[] = []
  const seedEvents: Array<[string, "IN" | "US" | "EU" | "JP" | "CN" | "UK", ImportanceStar, string?, string?, string?]> = [
    ["RBI MPC RATE DECISION", "IN", 3, "6.50%", "6.50%", undefined],
    ["INDIA CPI YoY", "IN", 3, "5.09%", "4.85%", "4.85%"],
    ["INDIA WPI YoY", "IN", 2, "2.15%", "2.41%", "2.41%"],
    ["INDIA IIP YoY", "IN", 2, "4.8%", "5.2%", "5.2%"],
    ["INDIA GDP YoY", "IN", 3, "8.4%", "7.1%", "7.1%"],
    ["INDIA TRADE BALANCE", "IN", 1, "-19.1B", "-21.2B", undefined],
    ["INDIA FX RESERVES", "IN", 1, "676.3B", "678.4B", "678.4B"],
    ["FOMC RATE DECISION", "US", 3, "5.25-5.50%", "5.25-5.50%", undefined],
    ["US CPI YoY", "US", 3, "3.4%", "3.3%", undefined],
    ["US NON-FARM PAYROLLS", "US", 3, "303K", "245K", undefined],
    ["US RETAIL SALES MoM", "US", 2, "0.2%", "0.4%", undefined],
    ["US ISM MANUFACTURING", "US", 2, "49.2", "49.6", undefined],
    ["ECB DEPOSIT RATE", "EU", 3, "4.00%", "3.75%", undefined],
    ["EUROZONE CPI YoY", "EU", 3, "2.4%", "2.3%", undefined],
    ["BOJ POLICY RATE", "JP", 3, "0.10%", "0.10%", undefined],
    ["CHINA CPI YoY", "CN", 2, "0.3%", "0.4%", undefined],
    ["BOE BANK RATE", "UK", 3, "5.25%", "5.25%", undefined],
  ]
  const rng = mulberry32(202604_03)
  for (let i = 0; i < seedEvents.length; i++) {
    const [event, region, imp, prior, forecast, actual] = seedEvents[i]
    const offset = Math.floor(rng() * 14) - 5 // -5..+8
    const h = 9 + Math.floor(rng() * 8)
    const m = (Math.floor(rng() * 4) * 15) % 60
    const t = mk(offset, h, m)
    rows.push({ ...t, region, event, importance: imp, prior, forecast, actual: offset <= 0 ? actual : undefined })
  }
  return rows.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1))
})()

// ------------------------------------------------------------------
// IPO / earnings / corp-action calendar (next 30 days)
// ------------------------------------------------------------------

export interface IPORow {
  symbol: string
  name: string
  open: string
  close: string
  priceBand: string
  lot: number
  size: string
  gmp: number
  status: "OPEN" | "UPCOMING" | "CLOSED"
}

export const IPOS: IPORow[] = [
  { symbol: "BHARTIHEX", name: "BHARTI HEXACOM LTD", open: "2026-05-03", close: "2026-05-07", priceBand: "542-570", lot: 26, size: "4275 Cr", gmp: 28, status: "UPCOMING" },
  { symbol: "GOEAGLE", name: "GO DIGIT GENERAL INS", open: "2026-05-05", close: "2026-05-09", priceBand: "258-272", lot: 55, size: "2614 Cr", gmp: 12, status: "UPCOMING" },
  { symbol: "INDEGENE", name: "INDEGENE LTD", open: "2026-05-06", close: "2026-05-08", priceBand: "430-452", lot: 33, size: "1841 Cr", gmp: 75, status: "UPCOMING" },
  { symbol: "AADHAR", name: "AADHAR HOUSING FIN", open: "2026-04-29", close: "2026-05-02", priceBand: "300-315", lot: 47, size: "3000 Cr", gmp: 30, status: "OPEN" },
  { symbol: "TBO", name: "TBO TEK LTD", open: "2026-04-25", close: "2026-04-29", priceBand: "875-920", lot: 16, size: "1550 Cr", gmp: 220, status: "CLOSED" },
]

// ------------------------------------------------------------------
// Analyst recommendations
// ------------------------------------------------------------------

export interface AnalystRec {
  broker: string
  rating: "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL"
  target: number
  date: string
  prevTarget?: number
}

const BROKERS = [
  "MORGAN STANLEY",
  "GOLDMAN SACHS",
  "JPMORGAN",
  "JEFFERIES",
  "CITI",
  "UBS",
  "CLSA",
  "NOMURA",
  "MOTILAL OSWAL",
  "KOTAK INSTL EQ",
  "ICICI SECURITIES",
  "AXIS CAPITAL",
  "HDFC SECURITIES",
  "EMKAY",
  "PRABHUDAS LILLADHER",
  "MACQUARIE",
]

export function analystRecs(symbol: string): { recs: AnalystRec[]; consensus: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number; avgTarget: number; mean: string } } {
  const eq = getEquity(symbol)
  if (!eq) return { recs: [], consensus: { strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0, avgTarget: 0, mean: "—" } }
  const rng = mulberry32(strSeed(symbol, 5023))
  const n = 8 + Math.floor(rng() * 6)
  const recs: AnalystRec[] = []
  for (let i = 0; i < n; i++) {
    const broker = BROKERS[(i * 3 + Math.floor(rng() * 7)) % BROKERS.length]
    const r = rng()
    const rating: AnalystRec["rating"] =
      r < 0.18 ? "STRONG BUY" : r < 0.55 ? "BUY" : r < 0.82 ? "HOLD" : r < 0.94 ? "SELL" : "STRONG SELL"
    const tgtMul = rating === "STRONG BUY" ? 1.18 : rating === "BUY" ? 1.10 : rating === "HOLD" ? 1.02 : rating === "SELL" ? 0.92 : 0.85
    const target = Math.round(eq.price * (tgtMul + (rng() - 0.5) * 0.08))
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(rng() * 70))
    const prevTarget = Math.round(target * (1 - (rng() - 0.5) * 0.06))
    recs.push({ broker, rating, target, date: date.toISOString().slice(0, 10), prevTarget })
  }
  const counts = { strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 }
  for (const r of recs) {
    if (r.rating === "STRONG BUY") counts.strongBuy++
    else if (r.rating === "BUY") counts.buy++
    else if (r.rating === "HOLD") counts.hold++
    else if (r.rating === "SELL") counts.sell++
    else counts.strongSell++
  }
  const avgTarget = recs.reduce((s, r) => s + r.target, 0) / Math.max(1, recs.length)
  // 1=strong buy ... 5=strong sell mean
  const mScore =
    (counts.strongBuy * 1 + counts.buy * 2 + counts.hold * 3 + counts.sell * 4 + counts.strongSell * 5) /
    Math.max(1, recs.length)
  const mean = mScore < 1.7 ? "STRONG BUY" : mScore < 2.6 ? "BUY" : mScore < 3.4 ? "HOLD" : mScore < 4.2 ? "SELL" : "STRONG SELL"
  return {
    recs: recs.sort((a, b) => (a.date < b.date ? 1 : -1)),
    consensus: { ...counts, avgTarget, mean },
  }
}

// ------------------------------------------------------------------
// Shareholding history (8 quarters)
// ------------------------------------------------------------------

export interface SharePoint {
  q: string // Q3FY24
  promoter: number
  fii: number
  diiMf: number
  diiOther: number
  retail: number
  others: number
}

export function shareholdingHistory(symbol: string): SharePoint[] {
  const rng = mulberry32(strSeed(symbol, 311))
  const quarters = ["Q1FY25", "Q2FY25", "Q3FY25", "Q4FY25", "Q1FY26", "Q2FY26", "Q3FY26", "Q4FY26"]
  let promoter = 45 + (symbol.length % 7)
  let fii = 22 + (symbol.length % 5)
  let diiMf = 13 + (symbol.length % 4)
  let diiOther = 8
  let retail = 8
  return quarters.map((q) => {
    promoter += (rng() - 0.5) * 0.6
    fii += (rng() - 0.5) * 0.9
    diiMf += (rng() - 0.5) * 0.7
    diiOther += (rng() - 0.5) * 0.3
    retail += (rng() - 0.5) * 0.4
    const total = promoter + fii + diiMf + diiOther + retail
    const others = Math.max(0, 100 - total)
    return {
      q,
      promoter: +promoter.toFixed(2),
      fii: +fii.toFixed(2),
      diiMf: +diiMf.toFixed(2),
      diiOther: +diiOther.toFixed(2),
      retail: +retail.toFixed(2),
      others: +others.toFixed(2),
    }
  })
}

// ------------------------------------------------------------------
// VIX cone (realized vol vs implied across 7/30/60/90/180-day windows)
// ------------------------------------------------------------------

export interface VolPoint {
  window: string
  realizedMin: number
  realizedP25: number
  realizedMedian: number
  realizedP75: number
  realizedMax: number
  iv: number
}

export const VIX_CONE: VolPoint[] = [
  { window: "7D", realizedMin: 8.4, realizedP25: 11.2, realizedMedian: 13.4, realizedP75: 16.1, realizedMax: 26.8, iv: 14.2 },
  { window: "14D", realizedMin: 9.1, realizedP25: 11.8, realizedMedian: 13.6, realizedP75: 15.9, realizedMax: 24.2, iv: 13.8 },
  { window: "30D", realizedMin: 9.8, realizedP25: 12.1, realizedMedian: 13.8, realizedP75: 15.6, realizedMax: 22.1, iv: 13.4 },
  { window: "60D", realizedMin: 10.2, realizedP25: 12.4, realizedMedian: 14.0, realizedP75: 15.4, realizedMax: 19.6, iv: 13.5 },
  { window: "90D", realizedMin: 10.6, realizedP25: 12.6, realizedMedian: 14.1, realizedP75: 15.3, realizedMax: 18.4, iv: 13.6 },
  { window: "180D", realizedMin: 11.0, realizedP25: 12.9, realizedMedian: 14.3, realizedP75: 15.4, realizedMax: 17.8, iv: 13.9 },
]

// ------------------------------------------------------------------
// Sector rotation (RRG): JdK RS-Ratio + RS-Momentum quadrant
// LEADING (RS>100, MOM>100), WEAKENING (RS>100, MOM<100),
// LAGGING (RS<100, MOM<100), IMPROVING (RS<100, MOM>100)
// ------------------------------------------------------------------

export interface RRGPoint {
  sector: Sector
  rsRatio: number
  rsMom: number
  trail: { rsRatio: number; rsMom: number }[]
}

export function genRRG(): RRGPoint[] {
  const sectors: Sector[] = [
    "BANK",
    "IT",
    "ENERGY",
    "AUTO",
    "PHARMA",
    "FMCG",
    "METAL",
    "REALTY",
    "INFRA",
    "TELECOM",
    "MEDIA",
    "FIN",
    "POWER",
    "CHEM",
  ]
  return sectors.map((sec, i) => {
    const rng = mulberry32(strSeed(sec, 1009 + i * 17))
    const rs = 95 + (rng() - 0.5) * 12
    const mom = 99 + (rng() - 0.5) * 6
    const trail: { rsRatio: number; rsMom: number }[] = []
    let r = rs - (rng() - 0.4) * 4
    let m = mom - (rng() - 0.4) * 3
    for (let k = 0; k < 6; k++) {
      r += (rng() - 0.5) * 0.9
      m += (rng() - 0.5) * 0.7
      trail.push({ rsRatio: r, rsMom: m })
    }
    trail.push({ rsRatio: rs, rsMom: mom })
    return { sector: sec, rsRatio: rs, rsMom: mom, trail }
  })
}

// ------------------------------------------------------------------
// Insider / SAST disclosures (promoter buy/sell, pledges)
// ------------------------------------------------------------------

export interface InsiderRow {
  date: string
  symbol: string
  insider: string
  type: "BUY" | "SELL" | "PLEDGE" | "REVOKE"
  qty: number
  value: number // crore INR
}

export const INSIDER_DEALS: InsiderRow[] = (() => {
  const rng = mulberry32(99203)
  const out: InsiderRow[] = []
  for (let i = 0; i < 18; i++) {
    const e = EQUITIES[Math.floor(rng() * EQUITIES.length)]
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(rng() * 30))
    const qty = Math.floor(rng() * 2_500_000 + 25_000)
    const r = rng()
    const type: InsiderRow["type"] = r < 0.35 ? "BUY" : r < 0.7 ? "SELL" : r < 0.9 ? "PLEDGE" : "REVOKE"
    out.push({
      date: date.toISOString().slice(0, 10),
      symbol: e.symbol,
      insider: type === "PLEDGE" || type === "REVOKE" ? "PROMOTER GROUP" : "DIRECTOR / KMP",
      type,
      qty,
      value: +((qty * e.price) / 1e7).toFixed(2),
    })
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
})()

// ------------------------------------------------------------------
// Equity option chain (extends the existing INDEX-only chain)
// ------------------------------------------------------------------

function nextThursday(): string {
  const d = new Date()
  const day = d.getDay()
  const add = (4 - day + 7) % 7 || 7
  d.setDate(d.getDate() + add)
  return d.toISOString().slice(0, 10)
}

function lastThursdayThisMonth(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + 1)
  d.setDate(0) // last day prev month -> end of current month
  while (d.getDay() !== 4) d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function genEquityOptionChain(symbol: string): OptionExpiry {
  const eq = getEquity(symbol)
  if (!eq) {
    // fallback to index chain if symbol is an index
    if (getIndex(symbol)) return genIndexChain(symbol)
    return { underlying: symbol, spot: 0, expiry: nextThursday(), rows: [] }
  }
  const spot = eq.price
  const rng = mulberry32(strSeed(symbol, 6131))
  const step =
    spot >= 10000 ? 100 : spot >= 5000 ? 50 : spot >= 2000 ? 20 : spot >= 500 ? 10 : spot >= 100 ? 5 : 1
  const atm = Math.round(spot / step) * step
  const rows: OptionRow[] = []
  for (let i = -10; i <= 10; i++) {
    const strike = atm + i * step
    const moneyness = (strike - spot) / spot
    const ivBase = 22 + Math.abs(moneyness) * 90 + rng() * 4 // equity IVs are higher
    const ceItm = strike < spot ? spot - strike : 0
    const peItm = strike > spot ? strike - spot : 0
    const ceTimeVal = Math.max(0.5, spot * (0.012 + Math.abs(moneyness) * 0.025) * (1 - Math.abs(moneyness) * 1.0))
    const peTimeVal = ceTimeVal
    const ceLtp = Math.max(0.05, ceItm + ceTimeVal)
    const peLtp = Math.max(0.05, peItm + peTimeVal)
    const baseOI = Math.floor(eq.lot * (1 - Math.abs(i) / 13) * 800 * (0.4 + rng()))
    const ceOI = Math.max(0, baseOI)
    const peOI = Math.max(0, Math.floor(baseOI * (0.7 + rng() * 0.6)))
    rows.push({
      strike,
      ce: {
        ltp: ceLtp,
        iv: ivBase,
        oi: ceOI,
        oiChg: Math.floor((rng() - 0.4) * ceOI * 0.3),
        vol: Math.floor(ceOI * (0.05 + rng() * 0.3)),
        delta: Math.max(0.02, Math.min(0.98, 0.5 - moneyness * 4)),
        gamma: 0.0001 + rng() * 0.0008,
        theta: -(1 + rng() * 6),
        vega: 3 + rng() * 12,
        bid: ceLtp * 0.995,
        ask: ceLtp * 1.005,
      },
      pe: {
        ltp: peLtp,
        iv: ivBase,
        oi: peOI,
        oiChg: Math.floor((rng() - 0.4) * peOI * 0.3),
        vol: Math.floor(peOI * (0.05 + rng() * 0.3)),
        delta: -Math.max(0.02, Math.min(0.98, 0.5 + moneyness * 4)),
        gamma: 0.0001 + rng() * 0.0008,
        theta: -(1 + rng() * 6),
        vega: 3 + rng() * 12,
        bid: peLtp * 0.995,
        ask: peLtp * 1.005,
      },
    })
  }
  return { underlying: symbol, spot, expiry: lastThursdayThisMonth(), rows }
}

// Universal option-chain helper: indices use the index chain (weekly Thursday),
// equities use the equity chain (monthly).
export function chainFor(symbol: string): OptionExpiry {
  if (getIndex(symbol)) return genIndexChain(symbol)
  return genEquityOptionChain(symbol)
}

// ------------------------------------------------------------------
// VIX history (60d)
// ------------------------------------------------------------------

export const VIX_HISTORY: { t: number; v: number }[] = (() => {
  const out: { t: number; v: number }[] = []
  const rng = mulberry32(424242)
  let v = 14
  const day = 86400_000
  for (let i = 60; i >= 0; i--) {
    v = Math.max(8, Math.min(28, v + (rng() - 0.5) * 0.9))
    out.push({ t: Date.now() - i * day, v })
  }
  return out
})()

// ------------------------------------------------------------------
// Heatmap config: list of "metrics" the HMAP page can color by
// ------------------------------------------------------------------

export const HEATMAP_METRICS = [
  { id: "ret1d", label: "1D %CHG" },
  { id: "ret5d", label: "5D %CHG" },
  { id: "ret1m", label: "1M %CHG" },
  { id: "retYtd", label: "YTD" },
  { id: "ret1y", label: "1Y" },
] as const

// ------------------------------------------------------------------
// Default watchlist seeds (browser-side will hydrate from localStorage)
// ------------------------------------------------------------------

export const DEFAULT_WATCHLISTS: { name: string; symbols: string[] }[] = [
  { name: "MEGACAP", symbols: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "ITC", "LT"] },
  { name: "PSU", symbols: ["SBIN", "ONGC", "COALINDIA", "POWERGRID", "NTPC", "BPCL", "GAIL"] },
  { name: "HIGHBETA", symbols: ["TATAMOTORS", "ADANIENT", "VEDL", "TATASTEEL", "JSWSTEEL", "DLF", "ZOMATO"] },
]
