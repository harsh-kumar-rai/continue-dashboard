// Bloomberg-style mnemonic command grammar
// Examples:
//   RELIANCE IN EQUITY DES <GO>        -> stock detail (description)
//   RELIANCE IN EQUITY GIP <GO>        -> stock chart
//   RELIANCE IN EQUITY FA <GO>         -> stock fundamentals
//   RELIANCE IN EQUITY OMON <GO>       -> options monitor
//   NIFTY INDEX DES <GO>               -> index detail
//   NIFTY INDEX OMON <GO>              -> index option chain
//   TOP <GO>                            -> top movers / dashboard
//   WEI <GO>                            -> world equity indices
//   MOST <GO>                           -> most active
//   PORT <GO>                           -> portfolio
//   SCRN <GO>                           -> screener
//   ECO <GO>                            -> macro
//   QUANT <GO>                          -> quant lab
//   STRAT <GO>                          -> strategy builder
//   HELP <GO>                           -> help
//   HOME / DEFAULT <GO>                 -> dashboard

import { EQUITIES, INDICES } from "./mock-data"

export type Route =
  | { kind: "page"; path: string }
  | { kind: "stock"; symbol: string; tab: string }
  | { kind: "index"; symbol: string; tab: string }
  | { kind: "chart"; symbol: string }
  | { kind: "unknown"; raw: string }

export interface Suggestion {
  command: string
  description: string
  category: "PAGE" | "STOCK" | "INDEX" | "FUNCTION"
}

const PAGE_MNEMONICS: Record<string, { path: string; desc: string }> = {
  TOP: { path: "/", desc: "DASHBOARD / TOP STORIES" },
  HOME: { path: "/", desc: "DASHBOARD" },
  DASH: { path: "/", desc: "DASHBOARD" },
  WEI: { path: "/markets", desc: "WORLD EQUITY INDICES / MARKETS" },
  MKTS: { path: "/markets", desc: "MARKETS" },
  MOST: { path: "/markets", desc: "MOST ACTIVE" },
  SCRN: { path: "/screener", desc: "EQUITY SCREENER" },
  EQS: { path: "/screener", desc: "EQUITY SEARCH / SCREENER" },
  PORT: { path: "/portfolio", desc: "PORTFOLIO MANAGER" },
  ECO: { path: "/economic-calendar", desc: "ECONOMIC CALENDAR" },
  MACRO: { path: "/macro", desc: "MACRO INDICATORS" },
  QUANT: { path: "/quant", desc: "QUANT LAB" },
  STRAT: { path: "/strategy", desc: "STRATEGY BUILDER (OPTIONS)" },
  DERIV: { path: "/derivatives", desc: "DERIVATIVES MONITOR" },
  HELP: { path: "/help", desc: "HELP" },
  N: { path: "/news", desc: "NEWS READER" },
  NEWS: { path: "/news", desc: "NEWS READER" },
  ALRT: { path: "/alerts", desc: "ALERT BUILDER" },
  ALERT: { path: "/alerts", desc: "ALERT BUILDER" },
  FII: { path: "/fii-dii", desc: "FII / DII ACTIVITY" },
  DII: { path: "/fii-dii", desc: "FII / DII ACTIVITY" },
  HMAP: { path: "/heatmap", desc: "MARKET HEATMAP (TREEMAP)" },
  HEAT: { path: "/heatmap", desc: "MARKET HEATMAP" },
  W: { path: "/watchlist", desc: "WATCHLISTS" },
  WATCH: { path: "/watchlist", desc: "WATCHLISTS" },
}

const STOCK_TABS: Record<string, string> = {
  DES: "des",
  GIP: "chart",
  GP: "chart",
  FA: "fundamentals",
  EE: "earnings",
  CN: "news",
  OMON: "options",
  HCPI: "history",
  HOLD: "holders",
  RV: "valuation",
  ANR: "analyst",
}

const INDEX_TABS: Record<string, string> = {
  DES: "des",
  GIP: "chart",
  MEMB: "members",
  OMON: "options",
}

export function parseCommand(raw: string): Route {
  const cleaned = raw.replace(/\s*<GO>\s*$/i, "").trim().toUpperCase()
  if (!cleaned) return { kind: "unknown", raw }

  const tokens = cleaned.split(/\s+/)

  // Single page mnemonic
  if (tokens.length === 1 && PAGE_MNEMONICS[tokens[0]]) {
    return { kind: "page", path: PAGE_MNEMONICS[tokens[0]].path }
  }

  // SYMBOL [IN] EQUITY|INDEX FUNC
  // Or SYMBOL FUNC
  const sym = tokens[0]
  let cls: "EQUITY" | "INDEX" | undefined
  let funcIdx = 1

  if (tokens[1] === "IN") {
    funcIdx = 2
  }
  if (tokens[funcIdx] === "EQUITY" || tokens[funcIdx] === "EQ") {
    cls = "EQUITY"
    funcIdx++
  } else if (tokens[funcIdx] === "INDEX" || tokens[funcIdx] === "IDX") {
    cls = "INDEX"
    funcIdx++
  }
  const func = tokens[funcIdx] ?? "DES"

  // Resolve sym
  const eq = EQUITIES.find((e) => e.symbol === sym)
  const idx = INDICES.find((i) => i.symbol === sym)

  // CHART <GO> always opens the full-page chart workbench (works for both equities and indices).
  if (func === "CHART" && (eq || idx)) {
    return { kind: "chart", symbol: sym }
  }

  if (cls === "INDEX" || (!cls && idx && !eq)) {
    if (idx) {
      const tab = INDEX_TABS[func] ?? "des"
      return { kind: "index", symbol: sym, tab }
    }
  }
  if (cls === "EQUITY" || (!cls && eq)) {
    if (eq) {
      const tab = STOCK_TABS[func] ?? "des"
      return { kind: "stock", symbol: sym, tab }
    }
  }

  return { kind: "unknown", raw }
}

export function suggest(input: string): Suggestion[] {
  const q = input.trim().toUpperCase()
  if (!q) return []
  const out: Suggestion[] = []

  // page commands
  for (const [k, v] of Object.entries(PAGE_MNEMONICS)) {
    if (k.startsWith(q) || v.desc.startsWith(q)) {
      out.push({ command: k, description: v.desc, category: "PAGE" })
    }
  }
  // indices
  for (const i of INDICES) {
    if (i.symbol.startsWith(q) || i.name.includes(q)) {
      out.push({ command: `${i.symbol} INDEX DES`, description: `${i.name} — DESCRIPTION`, category: "INDEX" })
      out.push({ command: `${i.symbol} INDEX CHART`, description: `${i.name} — FULL CHART`, category: "INDEX" })
    }
  }
  // equities
  for (const e of EQUITIES) {
    if (e.symbol.startsWith(q) || e.name.includes(q)) {
      out.push({ command: `${e.symbol} IN EQUITY DES`, description: `${e.name} — DESCRIPTION`, category: "STOCK" })
      out.push({ command: `${e.symbol} IN EQUITY CHART`, description: `${e.name} — FULL CHART`, category: "STOCK" })
      out.push({ command: `${e.symbol} IN EQUITY OMON`, description: `${e.name} — OPTIONS`, category: "STOCK" })
    }
  }

  return out.slice(0, 14)
}

export function routeToPath(route: Route): string {
  switch (route.kind) {
    case "page":
      return route.path
    case "stock":
      return `/stock/${route.symbol}?tab=${route.tab}`
    case "index":
      return `/index/${route.symbol}?tab=${route.tab}`
    case "chart":
      return `/chart/${route.symbol}`
    default:
      return "/"
  }
}

export interface FunctionKey {
  key: string
  label: string
  path: string
}

// Default function-key bar (used on most pages).
export const FUNCTION_KEYS: FunctionKey[] = [
  { key: "F1", label: "HELP", path: "/help" },
  { key: "F2", label: "MKTS", path: "/markets" },
  { key: "F3", label: "EQTY", path: "/screener" },
  { key: "F4", label: "DERIV", path: "/derivatives" },
  { key: "F5", label: "STRAT", path: "/strategy" },
  { key: "F6", label: "QUANT", path: "/quant" },
  { key: "F7", label: "PORT", path: "/portfolio" },
  { key: "F8", label: "MACRO", path: "/macro" },
  { key: "F9", label: "NEWS", path: "/news" },
  { key: "F10", label: "ALERT", path: "/alerts" },
  { key: "F11", label: "HMAP", path: "/heatmap" },
  { key: "F12", label: "WATCH", path: "/watchlist" },
]

// Context-aware F-keys for the stock detail page. Tabs swap via ?tab= query.
function stockKeys(symbol: string): FunctionKey[] {
  const base = `/stock/${encodeURIComponent(symbol)}`
  return [
    { key: "F1", label: "DES", path: `${base}?tab=des` },
    { key: "F2", label: "GIP", path: `/chart/${encodeURIComponent(symbol)}` },
    { key: "F3", label: "FA", path: `${base}?tab=fundamentals` },
    { key: "F4", label: "OMON", path: `${base}?tab=options` },
    { key: "F5", label: "ANR", path: `${base}?tab=analyst` },
    { key: "F6", label: "RV", path: `${base}?tab=valuation` },
    { key: "F7", label: "EE", path: `${base}?tab=earnings` },
    { key: "F8", label: "HOLD", path: `${base}?tab=holders` },
    { key: "F9", label: "CN", path: `${base}?tab=news` },
    { key: "F10", label: "ALERT", path: "/alerts" },
    { key: "F11", label: "HMAP", path: "/heatmap" },
    { key: "F12", label: "WATCH", path: "/watchlist" },
  ]
}

const PAGE_KEYS: Record<string, FunctionKey[]> = {
  "/derivatives": [
    { key: "F1", label: "HELP", path: "/help" },
    { key: "F2", label: "OMON", path: "/derivatives" },
    { key: "F3", label: "STRAT", path: "/strategy" },
    { key: "F4", label: "FII", path: "/fii-dii" },
    { key: "F5", label: "MKTS", path: "/markets" },
    { key: "F6", label: "QUANT", path: "/quant" },
    { key: "F7", label: "PORT", path: "/portfolio" },
    { key: "F8", label: "MACRO", path: "/macro" },
    { key: "F9", label: "NEWS", path: "/news" },
    { key: "F10", label: "ALERT", path: "/alerts" },
    { key: "F11", label: "HMAP", path: "/heatmap" },
    { key: "F12", label: "WATCH", path: "/watchlist" },
  ],
  "/portfolio": [
    { key: "F1", label: "HELP", path: "/help" },
    { key: "F2", label: "MKTS", path: "/markets" },
    { key: "F3", label: "EQTY", path: "/screener" },
    { key: "F4", label: "DERIV", path: "/derivatives" },
    { key: "F5", label: "STRAT", path: "/strategy" },
    { key: "F6", label: "QUANT", path: "/quant" },
    { key: "F7", label: "WATCH", path: "/watchlist" },
    { key: "F8", label: "MACRO", path: "/macro" },
    { key: "F9", label: "NEWS", path: "/news" },
    { key: "F10", label: "ALERT", path: "/alerts" },
    { key: "F11", label: "HMAP", path: "/heatmap" },
    { key: "F12", label: "FII", path: "/fii-dii" },
  ],
}

/**
 * Resolve the F-key set for the active page. Falls back to FUNCTION_KEYS.
 * For the stock detail page, returns symbol-aware keys.
 */
export function functionKeysFor(pathname: string): FunctionKey[] {
  if (pathname.startsWith("/stock/")) {
    const sym = decodeURIComponent(pathname.split("/")[2] ?? "")
    if (sym) return stockKeys(sym)
  }
  return PAGE_KEYS[pathname] ?? FUNCTION_KEYS
}
