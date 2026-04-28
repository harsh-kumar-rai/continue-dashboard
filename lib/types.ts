export type Sector =
  | "BANK"
  | "IT"
  | "ENERGY"
  | "AUTO"
  | "PHARMA"
  | "FMCG"
  | "METAL"
  | "REALTY"
  | "INFRA"
  | "TELECOM"
  | "MEDIA"
  | "FIN"
  | "CHEM"
  | "POWER"

export interface Equity {
  symbol: string // RELIANCE
  name: string // RELIANCE INDUSTRIES LTD
  exchange: "NSE" | "BSE"
  sector: Sector
  industry: string
  isin: string
  lot: number
  mcap: number // in crore INR
  price: number
  prevClose: number
  open: number
  high: number
  low: number
  volume: number
  avgVol20: number
  pe: number
  pb: number
  eps: number
  bookValue: number
  divYield: number
  beta: number
  high52: number
  low52: number
  rsi14: number
  // Returns
  ret1d: number
  ret5d: number
  ret1m: number
  ret3m: number
  ret6m: number
  ret1y: number
  retYtd: number
}

export interface IndexQuote {
  symbol: string
  name: string
  value: number
  prevClose: number
  open: number
  high: number
  low: number
  ret1d: number
  ret5d: number
  ret1m: number
  retYtd: number
  ret1y: number
  components?: number
}

export interface OHLCBar {
  t: number // unix sec
  o: number
  h: number
  l: number
  c: number
  v: number
}

export interface OptionRow {
  strike: number
  ce: OptionLeg
  pe: OptionLeg
}

export interface OptionLeg {
  ltp: number
  iv: number
  oi: number
  oiChg: number
  vol: number
  delta: number
  gamma: number
  theta: number
  vega: number
  bid: number
  ask: number
}

export interface OptionExpiry {
  expiry: string // YYYY-MM-DD
  underlying: string
  spot: number
  rows: OptionRow[]
}

export interface Holding {
  symbol: string
  qty: number
  avgPrice: number
  ltp: number
  sector: Sector
}

export interface MacroIndicator {
  label: string
  value: number
  unit: string
  change: number
  asOf: string
}

export interface NewsItem {
  t: number
  src: string
  headline: string
  sym?: string
  tag?: "RES" | "MGMT" | "REG" | "MACRO" | "FII" | "BLOCK" | "COR"
}

export interface CorpAction {
  symbol: string
  type: "DIV" | "SPLIT" | "BONUS" | "BUYBACK" | "RIGHTS" | "AGM" | "RES"
  detail: string
  exDate: string
}

export interface ScreenerColumn {
  key: string
  label: string
  fmt?: "num" | "pct" | "ccy" | "abs"
  width?: number
}
