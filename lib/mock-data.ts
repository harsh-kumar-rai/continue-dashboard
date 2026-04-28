import type {
  Equity,
  IndexQuote,
  OHLCBar,
  OptionExpiry,
  Holding,
  MacroIndicator,
  NewsItem,
  CorpAction,
  Sector,
} from "./types"

// Deterministic seeded RNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(20260429)

function rand(min: number, max: number) {
  return min + rng() * (max - min)
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1))
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}
function ret(): number {
  // skewed normal-ish
  return (rng() - 0.48) * 0.06
}

// NIFTY 50 + a bit more — symbol, name, sector, industry, base price
const SEEDS: Array<[string, string, Sector, string, number, number]> = [
  ["RELIANCE", "RELIANCE INDUSTRIES LTD", "ENERGY", "OIL & GAS - REFINING", 2890, 250],
  ["TCS", "TATA CONSULTANCY SVCS", "IT", "IT SERVICES", 4120, 175],
  ["HDFCBANK", "HDFC BANK LTD", "BANK", "PVT BANK", 1685, 550],
  ["INFY", "INFOSYS LTD", "IT", "IT SERVICES", 1880, 400],
  ["ICICIBANK", "ICICI BANK LTD", "BANK", "PVT BANK", 1265, 700],
  ["BHARTIARTL", "BHARTI AIRTEL LTD", "TELECOM", "TELECOM", 1565, 475],
  ["ITC", "ITC LTD", "FMCG", "DIVERSIFIED FMCG", 432, 1600],
  ["LT", "LARSEN & TOUBRO", "INFRA", "CONSTRUCTION", 3580, 150],
  ["KOTAKBANK", "KOTAK MAHINDRA BANK", "BANK", "PVT BANK", 1745, 400],
  ["AXISBANK", "AXIS BANK LTD", "BANK", "PVT BANK", 1180, 625],
  ["SBIN", "STATE BANK OF INDIA", "BANK", "PSU BANK", 818, 750],
  ["HINDUNILVR", "HINDUSTAN UNILEVER", "FMCG", "PERSONAL CARE", 2380, 300],
  ["BAJFINANCE", "BAJAJ FINANCE LTD", "FIN", "NBFC", 6845, 125],
  ["ASIANPAINT", "ASIAN PAINTS LTD", "FMCG", "PAINTS", 2895, 200],
  ["MARUTI", "MARUTI SUZUKI INDIA", "AUTO", "PV - AUTO", 12480, 50],
  ["SUNPHARMA", "SUN PHARMACEUTICAL", "PHARMA", "PHARMA", 1690, 350],
  ["TITAN", "TITAN COMPANY LTD", "FMCG", "JEWELLERY", 3420, 175],
  ["WIPRO", "WIPRO LTD", "IT", "IT SERVICES", 565, 1500],
  ["HCLTECH", "HCL TECHNOLOGIES", "IT", "IT SERVICES", 1745, 350],
  ["TATAMOTORS", "TATA MOTORS LTD", "AUTO", "CV - AUTO", 920, 1425],
  ["ULTRACEMCO", "ULTRATECH CEMENT", "INFRA", "CEMENT", 11240, 50],
  ["NESTLEIND", "NESTLE INDIA LTD", "FMCG", "FOOD PROC", 2470, 150],
  ["JSWSTEEL", "JSW STEEL LTD", "METAL", "STEEL", 945, 1350],
  ["POWERGRID", "POWER GRID CORP", "POWER", "POWER T&D", 285, 4500],
  ["NTPC", "NTPC LTD", "POWER", "POWER GEN", 348, 3000],
  ["TATASTEEL", "TATA STEEL LTD", "METAL", "STEEL", 148, 5500],
  ["ADANIPORTS", "ADANI PORTS & SEZ", "INFRA", "PORTS", 1392, 750],
  ["BAJAJFINSV", "BAJAJ FINSERV LTD", "FIN", "FINANCIAL SVCS", 1620, 500],
  ["TECHM", "TECH MAHINDRA LTD", "IT", "IT SERVICES", 1640, 600],
  ["ONGC", "OIL & NATURAL GAS CO", "ENERGY", "OIL EXPLORATION", 252, 4350],
  ["INDUSINDBK", "INDUSIND BANK LTD", "BANK", "PVT BANK", 1024, 700],
  ["GRASIM", "GRASIM INDUSTRIES", "INFRA", "DIVERSIFIED", 2640, 250],
  ["HINDALCO", "HINDALCO INDUSTRIES", "METAL", "ALUMINIUM", 685, 1200],
  ["DRREDDY", "DR REDDYS LAB", "PHARMA", "PHARMA", 1340, 625],
  ["CIPLA", "CIPLA LTD", "PHARMA", "PHARMA", 1495, 650],
  ["COALINDIA", "COAL INDIA LTD", "ENERGY", "MINING - COAL", 415, 2100],
  ["BPCL", "BHARAT PETROLEUM", "ENERGY", "OIL MARKETING", 318, 1800],
  ["EICHERMOT", "EICHER MOTORS LTD", "AUTO", "CV - AUTO", 4880, 175],
  ["DIVISLAB", "DIVIS LABORATORIES", "PHARMA", "PHARMA", 5420, 200],
  ["BRITANNIA", "BRITANNIA INDUSTRIES", "FMCG", "FOOD PROC", 4845, 175],
  ["HEROMOTOCO", "HERO MOTOCORP LTD", "AUTO", "TWO WHEELERS", 4380, 300],
  ["TATACONSUM", "TATA CONSUMER PROD", "FMCG", "FOOD PROC", 935, 825],
  ["BAJAJ-AUTO", "BAJAJ AUTO LTD", "AUTO", "TWO WHEELERS", 8920, 100],
  ["APOLLOHOSP", "APOLLO HOSPITALS", "PHARMA", "HEALTHCARE", 6240, 125],
  ["SHRIRAMFIN", "SHRIRAM FINANCE", "FIN", "NBFC", 2810, 600],
  ["LTIM", "LTIMINDTREE LTD", "IT", "IT SERVICES", 5680, 150],
  ["ADANIENT", "ADANI ENTERPRISES", "INFRA", "DIVERSIFIED", 2380, 300],
  ["SBILIFE", "SBI LIFE INSURANCE", "FIN", "INSURANCE", 1545, 750],
  ["HDFCLIFE", "HDFC LIFE INSURANCE", "FIN", "INSURANCE", 712, 1100],
  ["M&M", "MAHINDRA & MAHINDRA", "AUTO", "PV - AUTO", 2890, 350],
  // a few mid-caps
  ["ZOMATO", "ZOMATO LTD", "MEDIA", "INTERNET", 248, 4500],
  ["DMART", "AVENUE SUPERMARTS", "FMCG", "RETAIL", 4520, 80],
  ["IRCTC", "IRCTC LTD", "MEDIA", "TRAVEL", 822, 875],
  ["TRENT", "TRENT LTD", "FMCG", "RETAIL", 6480, 175],
  ["LICI", "LIFE INSURANCE CORP", "FIN", "INSURANCE", 985, 850],
  ["PIDILITIND", "PIDILITE INDUSTRIES", "CHEM", "CHEMICALS", 3120, 250],
  ["GODREJCP", "GODREJ CONSUMER", "FMCG", "PERSONAL CARE", 1240, 1000],
  ["DABUR", "DABUR INDIA LTD", "FMCG", "PERSONAL CARE", 528, 1250],
  ["AMBUJACEM", "AMBUJA CEMENTS LTD", "INFRA", "CEMENT", 615, 1200],
  ["SHREECEM", "SHREE CEMENT LTD", "INFRA", "CEMENT", 27840, 25],
  ["BANDHANBNK", "BANDHAN BANK LTD", "BANK", "PVT BANK", 178, 4000],
  ["VEDL", "VEDANTA LTD", "METAL", "DIVERSIFIED METAL", 458, 2500],
  ["DLF", "DLF LTD", "REALTY", "REAL ESTATE", 815, 825],
  ["GAIL", "GAIL INDIA LTD", "ENERGY", "GAS DIST", 198, 4500],
  ["ZEEL", "ZEE ENTERTAINMENT", "MEDIA", "BROADCAST", 142, 6500],
]

export const EQUITIES: Equity[] = SEEDS.map(([symbol, name, sector, industry, basePrice, lot]) => {
  const r1 = ret()
  const prevClose = basePrice * (1 - r1 * 0.4)
  const open = prevClose * (1 + ret() * 0.2)
  const high = Math.max(open, basePrice) * (1 + Math.abs(ret()) * 0.3)
  const low = Math.min(open, basePrice) * (1 - Math.abs(ret()) * 0.3)
  const volume = Math.floor(rand(2_00_000, 2_00_00_000))
  const mcap = Math.floor((basePrice * rand(20, 800)) / 1)
  return {
    symbol,
    name,
    exchange: "NSE",
    sector,
    industry,
    isin: `INE${randInt(100, 999)}A0${randInt(1000, 9999)}`,
    lot,
    mcap,
    price: basePrice,
    prevClose,
    open,
    high,
    low,
    volume,
    avgVol20: Math.floor(volume * rand(0.7, 1.3)),
    pe: Math.max(5, rand(8, 75)),
    pb: Math.max(0.5, rand(0.8, 18)),
    eps: basePrice / Math.max(8, rand(10, 45)),
    bookValue: basePrice / Math.max(0.8, rand(1, 8)),
    divYield: rand(0, 4.2),
    beta: rand(0.4, 1.8),
    high52: basePrice * rand(1.05, 1.6),
    low52: basePrice * rand(0.55, 0.95),
    rsi14: rand(20, 80),
    ret1d: r1,
    ret5d: ret() * 1.6,
    ret1m: ret() * 3,
    ret3m: ret() * 5,
    ret6m: ret() * 7,
    ret1y: ret() * 12,
    retYtd: ret() * 5,
  }
})

export const INDICES: IndexQuote[] = [
  { symbol: "NIFTY", name: "NIFTY 50", value: 24842.55, prevClose: 24795.2, open: 24810, high: 24891.7, low: 24768.4, ret1d: 0.0019, ret5d: 0.0124, ret1m: 0.0214, retYtd: 0.114, ret1y: 0.182, components: 50 },
  { symbol: "BANKNIFTY", name: "NIFTY BANK", value: 53148.7, prevClose: 52896.3, open: 52950, high: 53210.1, low: 52840.6, ret1d: 0.0048, ret5d: 0.0089, ret1m: 0.0312, retYtd: 0.143, ret1y: 0.221, components: 12 },
  { symbol: "FINNIFTY", name: "NIFTY FIN SVC", value: 24018.4, prevClose: 23912.85, open: 23930, high: 24080.3, low: 23898.2, ret1d: 0.0044, ret5d: 0.0072, ret1m: 0.0288, retYtd: 0.131, ret1y: 0.214, components: 20 },
  { symbol: "MIDCPNIFTY", name: "NIFTY MIDCAP", value: 13220.55, prevClose: 13165.3, open: 13180, high: 13245.7, low: 13140.1, ret1d: 0.0042, ret5d: 0.0156, ret1m: 0.0421, retYtd: 0.182, ret1y: 0.314, components: 50 },
  { symbol: "SENSEX", name: "BSE SENSEX", value: 81212.3, prevClose: 81052.1, open: 81100, high: 81342.5, low: 80980.7, ret1d: 0.002, ret5d: 0.0128, ret1m: 0.0218, retYtd: 0.118, ret1y: 0.179, components: 30 },
  { symbol: "INDIAVIX", name: "INDIA VIX", value: 13.42, prevClose: 13.78, open: 13.7, low: 13.21, high: 13.92, ret1d: -0.0261, ret5d: -0.043, ret1m: -0.115, retYtd: -0.148, ret1y: -0.221 },
  { symbol: "NIFTYIT", name: "NIFTY IT", value: 42180.5, prevClose: 41985.2, open: 42010, high: 42250.4, low: 41940, ret1d: 0.0047, ret5d: 0.0211, ret1m: 0.0312, retYtd: 0.082, ret1y: 0.142, components: 10 },
  { symbol: "NIFTYAUTO", name: "NIFTY AUTO", value: 25840.7, prevClose: 25712.4, open: 25735, high: 25890.2, low: 25688.1, ret1d: 0.005, ret5d: 0.0094, ret1m: 0.0241, retYtd: 0.198, ret1y: 0.342, components: 15 },
  { symbol: "NIFTYPHARMA", name: "NIFTY PHARMA", value: 22148.3, prevClose: 22210.5, open: 22195, high: 22220.1, low: 22085.4, ret1d: -0.0028, ret5d: -0.0042, ret1m: 0.0118, retYtd: 0.094, ret1y: 0.245, components: 20 },
  { symbol: "NIFTYFMCG", name: "NIFTY FMCG", value: 58420.8, prevClose: 58515.2, open: 58490, high: 58560.4, low: 58360.1, ret1d: -0.0016, ret5d: 0.0028, ret1m: 0.0085, retYtd: 0.045, ret1y: 0.118, components: 15 },
  { symbol: "NIFTYMETAL", name: "NIFTY METAL", value: 9485.4, prevClose: 9402.1, open: 9418, high: 9512.7, low: 9398.5, ret1d: 0.0089, ret5d: 0.0212, ret1m: 0.0428, retYtd: 0.214, ret1y: 0.382, components: 15 },
  { symbol: "NIFTYREALTY", name: "NIFTY REALTY", value: 1018.4, prevClose: 1012.5, open: 1014, high: 1024.1, low: 1009.8, ret1d: 0.0058, ret5d: 0.018, ret1m: 0.0325, retYtd: 0.152, ret1y: 0.412, components: 10 },
]

// Generate OHLCV history for 1Y daily (252 bars)
export function genOHLC(symbol: string, days = 252): OHLCBar[] {
  const eq = EQUITIES.find((e) => e.symbol === symbol)
  const idx = INDICES.find((i) => i.symbol === symbol)
  const startPrice = eq?.price ?? idx?.value ?? 1000
  const localRng = mulberry32(symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 7919)
  const bars: OHLCBar[] = []
  let price = startPrice / (1 + (localRng() - 0.5) * 0.4) // start ~ a year back
  const now = Math.floor(Date.now() / 1000)
  const day = 86400
  for (let i = days; i >= 0; i--) {
    const t = now - i * day
    const drift = 0.00045
    const vol = 0.014
    const r = drift + (localRng() - 0.5) * vol * 2
    const o = price
    const c = o * (1 + r)
    const h = Math.max(o, c) * (1 + localRng() * vol * 0.4)
    const l = Math.min(o, c) * (1 - localRng() * vol * 0.4)
    const v = Math.floor((eq?.avgVol20 ?? 5_00_000) * (0.6 + localRng() * 0.8))
    bars.push({ t, o, h, l, c, v })
    price = c
  }
  return bars
}

// Option chain generator
export function genOptionChain(underlying: string): OptionExpiry {
  const u = INDICES.find((i) => i.symbol === underlying) ?? INDICES[0]
  const spot = u.value
  const localRng = mulberry32(underlying.charCodeAt(0) * 13)
  const stepFor = (sym: string) => {
    if (sym === "NIFTY") return 50
    if (sym === "BANKNIFTY") return 100
    if (sym === "FINNIFTY") return 50
    if (sym === "MIDCPNIFTY") return 25
    return 50
  }
  const step = stepFor(underlying)
  const atm = Math.round(spot / step) * step
  const rows = []
  for (let i = -15; i <= 15; i++) {
    const strike = atm + i * step
    const moneyness = (strike - spot) / spot
    const ivBase = 13 + Math.abs(moneyness) * 80 + localRng() * 2
    const ceItm = strike < spot ? spot - strike : 0
    const peItm = strike > spot ? strike - spot : 0
    const ceTimeVal = Math.max(2, (spot * (0.005 + Math.abs(moneyness) * 0.02)) * (1 - Math.abs(moneyness) * 1.2))
    const peTimeVal = ceTimeVal
    const ceLtp = Math.max(0.5, ceItm + ceTimeVal)
    const peLtp = Math.max(0.5, peItm + peTimeVal)
    const ceOI = Math.floor((1 - Math.abs(i) / 18) * 12_00_000 * (0.4 + localRng()))
    const peOI = Math.floor((1 - Math.abs(i) / 18) * 12_00_000 * (0.4 + localRng()))
    rows.push({
      strike,
      ce: {
        ltp: ceLtp,
        iv: ivBase,
        oi: ceOI,
        oiChg: Math.floor((localRng() - 0.4) * ceOI * 0.4),
        vol: Math.floor(ceOI * (0.1 + localRng() * 0.5)),
        delta: Math.max(0.02, Math.min(0.98, 0.5 - moneyness * 4)),
        gamma: 0.0001 + localRng() * 0.0008,
        theta: -(2 + localRng() * 8),
        vega: 4 + localRng() * 14,
        bid: ceLtp * 0.998,
        ask: ceLtp * 1.002,
      },
      pe: {
        ltp: peLtp,
        iv: ivBase,
        oi: peOI,
        oiChg: Math.floor((localRng() - 0.4) * peOI * 0.4),
        vol: Math.floor(peOI * (0.1 + localRng() * 0.5)),
        delta: -Math.max(0.02, Math.min(0.98, 0.5 + moneyness * 4)),
        gamma: 0.0001 + localRng() * 0.0008,
        theta: -(2 + localRng() * 8),
        vega: 4 + localRng() * 14,
        bid: peLtp * 0.998,
        ask: peLtp * 1.002,
      },
    })
  }
  return {
    underlying,
    spot,
    expiry: nextThursday(),
    rows,
  }
}

function nextThursday(): string {
  const d = new Date()
  const day = d.getDay()
  const add = (4 - day + 7) % 7 || 7
  d.setDate(d.getDate() + add)
  return d.toISOString().slice(0, 10)
}

// Portfolio sample
export const HOLDINGS: Holding[] = [
  { symbol: "RELIANCE", qty: 250, avgPrice: 2640, ltp: 2890, sector: "ENERGY" },
  { symbol: "TCS", qty: 80, avgPrice: 3850, ltp: 4120, sector: "IT" },
  { symbol: "HDFCBANK", qty: 600, avgPrice: 1490, ltp: 1685, sector: "BANK" },
  { symbol: "INFY", qty: 200, avgPrice: 1620, ltp: 1880, sector: "IT" },
  { symbol: "ICICIBANK", qty: 450, avgPrice: 1080, ltp: 1265, sector: "BANK" },
  { symbol: "LT", qty: 60, avgPrice: 3200, ltp: 3580, sector: "INFRA" },
  { symbol: "MARUTI", qty: 25, avgPrice: 11200, ltp: 12480, sector: "AUTO" },
  { symbol: "TITAN", qty: 100, avgPrice: 3050, ltp: 3420, sector: "FMCG" },
  { symbol: "SUNPHARMA", qty: 200, avgPrice: 1480, ltp: 1690, sector: "PHARMA" },
  { symbol: "TATAMOTORS", qty: 350, avgPrice: 1080, ltp: 920, sector: "AUTO" },
  { symbol: "HINDALCO", qty: 400, avgPrice: 580, ltp: 685, sector: "METAL" },
  { symbol: "BAJFINANCE", qty: 30, avgPrice: 7200, ltp: 6845, sector: "FIN" },
]

export const MACRO: MacroIndicator[] = [
  { label: "RBI REPO", value: 6.5, unit: "%", change: 0, asOf: "07-FEB-26" },
  { label: "CPI INFLATION", value: 4.85, unit: "%", change: -0.12, asOf: "MAR-26" },
  { label: "WPI INFLATION", value: 2.41, unit: "%", change: 0.08, asOf: "MAR-26" },
  { label: "IIP YoY", value: 5.2, unit: "%", change: 0.4, asOf: "FEB-26" },
  { label: "GDP YoY", value: 7.1, unit: "%", change: 0.2, asOf: "Q3FY26" },
  { label: "CAD / GDP", value: -1.2, unit: "%", change: -0.1, asOf: "Q3FY26" },
  { label: "FISCAL DEFICIT", value: 5.1, unit: "% GDP", change: -0.2, asOf: "FY26E" },
  { label: "FOREX RESERVES", value: 678.4, unit: "USD BN", change: 2.1, asOf: "25-APR-26" },
  { label: "10Y G-SEC", value: 6.78, unit: "%", change: -0.02, asOf: "TODAY" },
  { label: "1Y T-BILL", value: 6.62, unit: "%", change: -0.01, asOf: "TODAY" },
  { label: "BRENT CRUDE", value: 84.2, unit: "USD/BBL", change: 0.6, asOf: "TODAY" },
  { label: "GOLD MCX", value: 71840, unit: "INR/10G", change: 320, asOf: "TODAY" },
  { label: "SILVER MCX", value: 89240, unit: "INR/KG", change: -180, asOf: "TODAY" },
  { label: "USD/INR", value: 83.42, unit: "", change: 0.04, asOf: "TODAY" },
  { label: "EUR/INR", value: 90.18, unit: "", change: -0.21, asOf: "TODAY" },
  { label: "GBP/INR", value: 105.62, unit: "", change: 0.18, asOf: "TODAY" },
  { label: "JPY/INR", value: 0.548, unit: "", change: -0.002, asOf: "TODAY" },
  { label: "FII NET (CASH)", value: -1248.4, unit: "INR CR", change: 0, asOf: "TODAY" },
  { label: "DII NET (CASH)", value: 2148.6, unit: "INR CR", change: 0, asOf: "TODAY" },
  { label: "FII F&O LONG/SHORT", value: 0.42, unit: "RATIO", change: -0.03, asOf: "TODAY" },
]

export const NEWS: NewsItem[] = [
  { t: Date.now() - 60_000, src: "REUT", headline: "RBI HOLDS REPO AT 6.50%, MAINTAINS WITHDRAWAL OF ACCOMMODATION STANCE", tag: "MACRO" },
  { t: Date.now() - 180_000, src: "BBG", headline: "RELIANCE Q4 PAT BEATS EST AT INR 21,142 CR; JIO ARPU UP 2.4%", sym: "RELIANCE", tag: "RES" },
  { t: Date.now() - 240_000, src: "MINT", headline: "FII OUTFLOWS PERSIST FOR 5TH SESSION; DII ABSORB INR 2,148 CR", tag: "FII" },
  { t: Date.now() - 360_000, src: "ET", headline: "TCS WINS USD 1.8 BN MULTI-YEAR DEAL FROM EUROPEAN BANK", sym: "TCS", tag: "MGMT" },
  { t: Date.now() - 480_000, src: "BBG", headline: "SEBI TIGHTENS DERIVATIVES NORMS, RAISES LOT SIZES FOR INDEX OPTIONS", tag: "REG" },
  { t: Date.now() - 600_000, src: "REUT", headline: "INDIA 10Y YIELD AT 6.78%, LOWEST IN 14 MONTHS ON CPI PRINT", tag: "MACRO" },
  { t: Date.now() - 720_000, src: "BSE", headline: "HDFC BANK BLOCK DEAL: 1.2 CR SHARES @ INR 1,682.5", sym: "HDFCBANK", tag: "BLOCK" },
  { t: Date.now() - 900_000, src: "NSE", headline: "ICICI BANK Q4 NIM AT 4.41% VS 4.39% YoY; SLIPPAGES MODERATE", sym: "ICICIBANK", tag: "RES" },
  { t: Date.now() - 1_080_000, src: "BBG", headline: "TATA MOTORS JLR Q4 EBIT MARGIN AT 9.2%, GUIDES FY27 MARGIN >10%", sym: "TATAMOTORS", tag: "RES" },
  { t: Date.now() - 1_260_000, src: "MINT", headline: "ADANI ENT BOARD APPROVES INR 16,600 CR QIP AT FLOOR PRICE 2,348", sym: "ADANIENT", tag: "COR" },
  { t: Date.now() - 1_440_000, src: "REUT", headline: "BRENT TOPS USD 84/BBL ON OPEC+ EXTENDED CUTS THROUGH H2", tag: "MACRO" },
  { t: Date.now() - 1_620_000, src: "ET", headline: "MARUTI APRIL TOTAL SALES UP 6.4% YoY AT 187,432 UNITS", sym: "MARUTI", tag: "MGMT" },
  { t: Date.now() - 1_800_000, src: "BBG", headline: "INFOSYS GUIDES FY27 REVENUE GROWTH 4-7% IN CC; MARGIN BAND 21-23%", sym: "INFY", tag: "RES" },
  { t: Date.now() - 1_980_000, src: "REUT", headline: "USD/INR HOLDS NEAR 83.42 AS RBI INTERVENES NEAR 83.50 LEVELS", tag: "MACRO" },
  { t: Date.now() - 2_160_000, src: "MINT", headline: "SUN PHARMA FDA INSPECTION AT HALOL CONCLUDES WITH ZERO 483", sym: "SUNPHARMA", tag: "REG" },
]

export const CORP_ACTIONS: CorpAction[] = [
  { symbol: "RELIANCE", type: "DIV", detail: "FINAL DIVIDEND INR 10.00", exDate: "06-MAY-26" },
  { symbol: "INFY", type: "DIV", detail: "FINAL DIVIDEND INR 22.00", exDate: "30-MAY-26" },
  { symbol: "TCS", type: "BUYBACK", detail: "BUYBACK @ INR 4500, INR 17K CR", exDate: "12-MAY-26" },
  { symbol: "ITC", type: "DIV", detail: "FINAL DIVIDEND INR 7.50", exDate: "28-MAY-26" },
  { symbol: "TITAN", type: "AGM", detail: "AGM RECORD DATE", exDate: "02-JUN-26" },
  { symbol: "HDFCBANK", type: "RES", detail: "Q4 RESULTS", exDate: "04-MAY-26" },
  { symbol: "BAJFINANCE", type: "RES", detail: "Q4 RESULTS", exDate: "29-APR-26" },
  { symbol: "ASIANPAINT", type: "RES", detail: "Q4 RESULTS", exDate: "08-MAY-26" },
  { symbol: "WIPRO", type: "BONUS", detail: "BONUS 1:1", exDate: "20-MAY-26" },
  { symbol: "POWERGRID", type: "DIV", detail: "INTERIM DIVIDEND INR 4.50", exDate: "16-MAY-26" },
  { symbol: "DLF", type: "RIGHTS", detail: "RIGHTS ISSUE 1:5 @ INR 700", exDate: "25-MAY-26" },
]

// Helper: lookup
export function getEquity(symbol: string): Equity | undefined {
  return EQUITIES.find((e) => e.symbol.toUpperCase() === symbol.toUpperCase())
}

export function getIndex(symbol: string): IndexQuote | undefined {
  return INDICES.find((i) => i.symbol.toUpperCase() === symbol.toUpperCase())
}

// ---- Aliases used by some pages ----
// Deterministic string hash (used by visual mocks, e.g. correlation matrix)
export function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// Alias for genOHLC under a longer name used by some pages
export const generateOHLC = genOHLC

// STOCKS: a flat view of EQUITIES with field aliases used by screener / quant / portfolio.
// `last`, `changePct`, `marketCap`, `rsi`, `high52w`, `low52w` map to the canonical
// fields below. `changePct` stays a *fraction* so it composes with fmtPct().
export const STOCKS = EQUITIES.map((e) => ({
  ...e,
  last: e.price,
  changePct: e.ret1d,
  marketCap: e.mcap, // in crore INR
  rsi: e.rsi14,
  high52w: e.high52,
  low52w: e.low52,
}))

// Extend MACRO records with a few aliased keys used by the macro page.
// We mutate-in-place so existing consumers (macro-snapshot) keep working.
for (const m of MACRO as Array<MacroIndicator & { indicator?: string; prev?: number; period?: string }>) {
  m.indicator = m.label
  m.prev = m.value - m.change
  m.period = m.asOf
}

// Sector aggregates
export function sectorAggregates() {
  const map = new Map<Sector, { mcap: number; ret1d: number; n: number; vol: number }>()
  for (const e of EQUITIES) {
    const cur = map.get(e.sector) ?? { mcap: 0, ret1d: 0, n: 0, vol: 0 }
    cur.mcap += e.mcap
    cur.ret1d += e.ret1d
    cur.n += 1
    cur.vol += e.volume * e.price
    map.set(e.sector, cur)
  }
  return [...map.entries()].map(([sector, v]) => ({
    sector,
    mcap: v.mcap,
    avgRet1d: v.ret1d / v.n,
    n: v.n,
    turnover: v.vol,
  }))
}
