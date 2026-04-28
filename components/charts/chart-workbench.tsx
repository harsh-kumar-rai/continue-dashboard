"use client"

/**
 * BETAGEN chart workbench.
 *
 * A reusable, terminal-themed price chart powered by TradingView's
 * `lightweight-charts` (Apache-2.0). Designed to be the single, embeddable
 * "chart slot" used everywhere in the app (stock tab, /chart/[symbol] page,
 * dashboard panel, etc.).
 *
 * Features:
 *   - Timeframes (1D / 5D / 1M / 3M / 6M / YTD / 1Y / 5Y / MAX)
 *   - Chart types (candle / bar / line / area)
 *   - Overlay studies (SMA 20/50/200, EMA 20, VWAP, Bollinger 20/2)
 *   - Sub-pane studies (RSI 14, MACD 12-26-9)
 *   - Compare another symbol (rebased to 100)
 *   - Crosshair-synced OHLCV header strip
 *   - Click-to-add horizontal price line (drawing tool v1)
 *   - CSV export of the current series
 *   - Responsive, fills its parent's height
 *
 * Props:
 *   symbol         - underlying symbol (equity OR index)
 *   initial*       - optional initial state for tf/type
 *   compact        - hide toolbar (used in dashboard tile mode)
 *   showHeader     - show OHLCV header strip (default true)
 */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type SeriesType,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts"
import { genOHLC, genIntraday, EQUITIES, INDICES } from "@/lib/mock-data"
import { fmtNum } from "@/lib/format"

type Timeframe = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX"
type ChartType = "candle" | "bar" | "line" | "area"
type OverlayStudy = "SMA20" | "SMA50" | "SMA200" | "EMA20" | "VWAP" | "BB"
type SubStudy = "RSI" | "MACD"

const TIMEFRAMES: Timeframe[] = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"]
const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: "candle", label: "CNDL" },
  { id: "bar", label: "BAR" },
  { id: "line", label: "LINE" },
  { id: "area", label: "AREA" },
]
const OVERLAY_STUDIES: OverlayStudy[] = ["SMA20", "SMA50", "SMA200", "EMA20", "VWAP", "BB"]
const SUB_STUDIES: SubStudy[] = ["RSI", "MACD"]

// Terminal palette — read once at construct.
const COLORS = {
  bg: "#000000",
  grid: "#161616",
  text: "#808080",
  border: "#2a2a2a",
  amber: "#ffa500",
  amberDim: "#b37300",
  up: "#00c853",
  down: "#ff1744",
  cyan: "#00e5ff",
  magenta: "#ff4081",
  yellow: "#ffeb3b",
  blue: "#4fc3f7",
}

// ----- Indicator math (kept pure, no chart deps) -----

function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = []
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    out.push(i >= period - 1 ? sum / period : null)
  }
  return out
}

function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1)
  const out: (number | null)[] = []
  let prev: number | null = null
  let seedSum = 0
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      seedSum += values[i]
      out.push(null)
      continue
    }
    if (i === period - 1) {
      seedSum += values[i]
      prev = seedSum / period
      out.push(prev)
      continue
    }
    prev = values[i] * k + (prev as number) * (1 - k)
    out.push(prev)
  }
  return out
}

function bollinger(values: number[], period = 20, mult = 2) {
  const mean = sma(values, period)
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      upper.push(null)
      lower.push(null)
      continue
    }
    let s = 0
    const m = mean[i] as number
    for (let j = i - period + 1; j <= i; j++) s += (values[j] - m) ** 2
    const sd = Math.sqrt(s / period)
    upper.push(m + sd * mult)
    lower.push(m - sd * mult)
  }
  return { mean, upper, lower }
}

function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [null]
  let avgG = 0
  let avgL = 0
  for (let i = 1; i < values.length; i++) {
    const ch = values[i] - values[i - 1]
    const g = Math.max(0, ch)
    const l = Math.max(0, -ch)
    if (i <= period) {
      avgG += g
      avgL += l
      if (i === period) {
        avgG /= period
        avgL /= period
        out.push(avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL))
      } else {
        out.push(null)
      }
    } else {
      avgG = (avgG * (period - 1) + g) / period
      avgL = (avgL * (period - 1) + l) / period
      out.push(avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL))
    }
  }
  return out
}

function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const eFast = ema(values, fast)
  const eSlow = ema(values, slow)
  const line: (number | null)[] = values.map((_, i) =>
    eFast[i] !== null && eSlow[i] !== null ? (eFast[i] as number) - (eSlow[i] as number) : null,
  )
  // signal: EMA of macd line (skip nulls until valid)
  const valid: number[] = []
  const mapIdx: number[] = []
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== null) {
      valid.push(line[i] as number)
      mapIdx.push(i)
    }
  }
  const sig = ema(valid, signal)
  const sigOut: (number | null)[] = new Array(line.length).fill(null)
  for (let j = 0; j < sig.length; j++) sigOut[mapIdx[j]] = sig[j]
  const hist: (number | null)[] = line.map((v, i) =>
    v !== null && sigOut[i] !== null ? v - (sigOut[i] as number) : null,
  )
  return { line, signal: sigOut, hist }
}

function vwap(bars: { h: number; l: number; c: number; v: number }[]): (number | null)[] {
  // session-anchored VWAP — resets at each calendar day boundary.
  // Without a date axis we approximate as cumulative VWAP over the visible range.
  let cumPV = 0
  let cumV = 0
  return bars.map((b) => {
    const tp = (b.h + b.l + b.c) / 3
    cumPV += tp * b.v
    cumV += b.v
    return cumV === 0 ? null : cumPV / cumV
  })
}

// ----- Series data shape helpers -----

type Bar = { t: number; o: number; h: number; l: number; c: number; v: number }

function toCandleData(bars: Bar[]) {
  return bars.map((b) => ({
    time: b.t as UTCTimestamp,
    open: b.o,
    high: b.h,
    low: b.l,
    close: b.c,
  }))
}

function toBarData(bars: Bar[]) {
  return bars.map((b) => ({
    time: b.t as UTCTimestamp,
    open: b.o,
    high: b.h,
    low: b.l,
    close: b.c,
  }))
}

function toLineData(bars: Bar[], pick: (b: Bar) => number) {
  return bars.map((b) => ({ time: b.t as UTCTimestamp, value: pick(b) }))
}

function toLineWithNulls(bars: Bar[], series: (number | null)[]): LineData[] {
  // lightweight-charts ignores points where value is undefined; keep only valid.
  const out: LineData[] = []
  for (let i = 0; i < bars.length; i++) {
    const v = series[i]
    if (v === null || !isFinite(v)) continue
    out.push({ time: bars[i].t as UTCTimestamp, value: v })
  }
  return out
}

function toVolumeData(bars: Bar[]) {
  return bars.map((b) => ({
    time: b.t as UTCTimestamp,
    value: b.v,
    color: b.c >= b.o ? "rgba(0,200,83,0.45)" : "rgba(255,23,68,0.45)",
  }))
}

// ----- Time/data slicing per timeframe -----

function pickBars(symbol: string, tf: Timeframe): Bar[] {
  if (tf === "1D") return genIntraday(symbol, 5, 1)
  if (tf === "5D") return genIntraday(symbol, 15, 5)
  if (tf === "1M") return genOHLC(symbol, 22)
  if (tf === "3M") return genOHLC(symbol, 64)
  if (tf === "6M") return genOHLC(symbol, 126)
  if (tf === "YTD") {
    const all = genOHLC(symbol, 252)
    const ytdStart = new Date()
    ytdStart.setMonth(0, 1)
    ytdStart.setHours(0, 0, 0, 0)
    const cutoff = Math.floor(ytdStart.getTime() / 1000)
    return all.filter((b) => b.t >= cutoff)
  }
  if (tf === "1Y") return genOHLC(symbol, 252)
  if (tf === "5Y") return genOHLC(symbol, 252 * 5)
  return genOHLC(symbol, 252 * 7) // MAX
}

// ----- Component -----

export interface ChartWorkbenchProps {
  symbol: string
  initialTimeframe?: Timeframe
  initialType?: ChartType
  compact?: boolean
  showHeader?: boolean
  className?: string
}

export function ChartWorkbench({
  symbol,
  initialTimeframe = "1Y",
  initialType = "candle",
  compact = false,
  showHeader = true,
  className,
}: ChartWorkbenchProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null)
  const overlaySeriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map())
  const subSeriesRef = useRef<Map<string, ISeriesApi<SeriesType>[]>>(new Map())
  const compareSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null)

  const [tf, setTf] = useState<Timeframe>(initialTimeframe)
  const [type, setType] = useState<ChartType>(initialType)
  const [overlays, setOverlays] = useState<Set<OverlayStudy>>(new Set())
  const [subs, setSubs] = useState<Set<SubStudy>>(new Set())
  const [compareSym, setCompareSym] = useState<string | null>(null)
  const [drawMode, setDrawMode] = useState<"none" | "hline">("none")
  const [studyOpen, setStudyOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [hover, setHover] = useState<{ o: number; h: number; l: number; c: number; v: number; t: number } | null>(
    null,
  )
  const bars = useMemo(() => pickBars(symbol, tf), [symbol, tf])
  const last = bars[bars.length - 1]
  const first = bars[0]
  const periodChange = last && first ? (last.c - first.c) / first.c : 0

  // ---------- Build / rebuild the chart whenever inputs change ----------
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // dispose previous
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      overlaySeriesRef.current.clear()
      subSeriesRef.current.clear()
      compareSeriesRef.current = null
    }

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: COLORS.bg },
        textColor: COLORS.text,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        attributionLogo: false,
        panes: { separatorColor: COLORS.border, separatorHoverColor: COLORS.amberDim, enableResize: true },
      },
      grid: {
        vertLines: { color: COLORS.grid, style: 1 },
        horzLines: { color: COLORS.grid, style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: COLORS.amber, width: 1, style: 2, labelBackgroundColor: COLORS.amber },
        horzLine: { color: COLORS.amber, width: 1, style: 2, labelBackgroundColor: COLORS.amber },
      },
      rightPriceScale: { borderColor: COLORS.border, scaleMargins: { top: 0.05, bottom: 0.05 } },
      timeScale: {
        borderColor: COLORS.border,
        timeVisible: tf === "1D" || tf === "5D",
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 6,
      },
    })
    chartRef.current = chart

    // ---- main series ----
    let main: ISeriesApi<SeriesType>
    if (type === "candle") {
      main = chart.addSeries(CandlestickSeries, {
        upColor: COLORS.up,
        downColor: COLORS.down,
        borderUpColor: COLORS.up,
        borderDownColor: COLORS.down,
        wickUpColor: COLORS.up,
        wickDownColor: COLORS.down,
        priceLineColor: COLORS.amber,
        priceLineStyle: LineStyle.LargeDashed,
      })
      ;(main as ISeriesApi<"Candlestick">).setData(toCandleData(bars))
    } else if (type === "bar") {
      main = chart.addSeries(BarSeries, {
        upColor: COLORS.up,
        downColor: COLORS.down,
        thinBars: false,
      })
      ;(main as ISeriesApi<"Bar">).setData(toBarData(bars))
    } else if (type === "line") {
      main = chart.addSeries(LineSeries, {
        color: COLORS.amber,
        lineWidth: 1,
        priceLineColor: COLORS.amber,
        priceLineStyle: LineStyle.LargeDashed,
      })
      ;(main as ISeriesApi<"Line">).setData(toLineData(bars, (b) => b.c))
    } else {
      main = chart.addSeries(AreaSeries, {
        topColor: "rgba(255,165,0,0.30)",
        bottomColor: "rgba(255,165,0,0.02)",
        lineColor: COLORS.amber,
        lineWidth: 1,
      })
      ;(main as ISeriesApi<"Area">).setData(toLineData(bars, (b) => b.c))
    }
    mainSeriesRef.current = main

    // ---- volume in pane 1 (uses its own right price scale) ----
    const vol = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1,
    )
    vol.setData(toVolumeData(bars))
    chart.panes()[1]?.priceScale("right").applyOptions({
      scaleMargins: { top: 0.1, bottom: 0 },
    })

    // ---- overlay studies (pane 0) ----
    const closes = bars.map((b) => b.c)
    const overlayDefs: { id: OverlayStudy; data: LineData[]; color: string; width?: number }[] = []
    if (overlays.has("SMA20"))
      overlayDefs.push({ id: "SMA20", data: toLineWithNulls(bars, sma(closes, 20)), color: COLORS.cyan })
    if (overlays.has("SMA50"))
      overlayDefs.push({ id: "SMA50", data: toLineWithNulls(bars, sma(closes, 50)), color: COLORS.yellow })
    if (overlays.has("SMA200"))
      overlayDefs.push({ id: "SMA200", data: toLineWithNulls(bars, sma(closes, 200)), color: COLORS.magenta })
    if (overlays.has("EMA20"))
      overlayDefs.push({ id: "EMA20", data: toLineWithNulls(bars, ema(closes, 20)), color: COLORS.blue })
    if (overlays.has("VWAP"))
      overlayDefs.push({ id: "VWAP", data: toLineWithNulls(bars, vwap(bars)), color: "#ffffff" })
    if (overlays.has("BB")) {
      const bb = bollinger(closes, 20, 2)
      overlayDefs.push({ id: "BB-U", data: toLineWithNulls(bars, bb.upper), color: COLORS.amberDim })
      overlayDefs.push({ id: "BB-M", data: toLineWithNulls(bars, bb.mean), color: COLORS.amberDim, width: 1 })
      overlayDefs.push({ id: "BB-L", data: toLineWithNulls(bars, bb.lower), color: COLORS.amberDim })
    }
    for (const d of overlayDefs) {
      const s = chart.addSeries(LineSeries, {
        color: d.color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      s.setData(d.data)
      overlaySeriesRef.current.set(d.id, s)
    }

    // ---- compare series ----
    if (compareSym) {
      const cmp = pickBars(compareSym, tf)
      const cmpFirst = cmp[0]?.c ?? 1
      const baseFirst = bars[0]?.c ?? 1
      // rebase compare to match the underlying's first close
      const cmpData: LineData[] = cmp.map((b) => ({
        time: b.t as UTCTimestamp,
        value: (b.c / cmpFirst) * baseFirst,
      }))
      const cs = chart.addSeries(LineSeries, {
        color: COLORS.cyan,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        title: compareSym,
      })
      cs.setData(cmpData)
      compareSeriesRef.current = cs
    }

    // ---- sub-pane studies ----
    let nextPane = 2
    if (subs.has("RSI")) {
      const r = rsi(closes, 14)
      const rs = chart.addSeries(
        LineSeries,
        { color: COLORS.cyan, lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: "RSI 14" },
        nextPane,
      )
      rs.setData(toLineWithNulls(bars, r))
      // 30/70 reference lines via priceLines
      rs.createPriceLine({
        price: 70,
        color: COLORS.down,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "70",
      })
      rs.createPriceLine({
        price: 30,
        color: COLORS.up,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "30",
      })
      subSeriesRef.current.set("RSI", [rs])
      nextPane++
    }
    if (subs.has("MACD")) {
      const m = macd(closes)
      const macLine = chart.addSeries(
        LineSeries,
        { color: COLORS.amber, lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: "MACD" },
        nextPane,
      )
      macLine.setData(toLineWithNulls(bars, m.line))
      const sigLine = chart.addSeries(
        LineSeries,
        { color: COLORS.cyan, lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: "SIGNAL" },
        nextPane,
      )
      sigLine.setData(toLineWithNulls(bars, m.signal))
      const hist = chart.addSeries(
        HistogramSeries,
        { priceLineVisible: false, lastValueVisible: false, base: 0 },
        nextPane,
      )
      const histData = bars
        .map((b, i) => {
          const v = m.hist[i]
          if (v === null || !isFinite(v)) return null
          return {
            time: b.t as UTCTimestamp,
            value: v,
            color: v >= 0 ? "rgba(0,200,83,0.5)" : "rgba(255,23,68,0.5)",
          }
        })
        .filter(Boolean) as { time: UTCTimestamp; value: number; color: string }[]
      hist.setData(histData)
      subSeriesRef.current.set("MACD", [macLine, sigLine, hist])
      nextPane++
    }

    // ---- crosshair sync to header strip ----
    const handler = (param: { time?: Time; seriesData: Map<ISeriesApi<SeriesType>, unknown> }) => {
      if (!param.time || !mainSeriesRef.current) {
        setHover(null)
        return
      }
      const m = mainSeriesRef.current
      const d = param.seriesData.get(m) as
        | { open: number; high: number; low: number; close: number; value?: number }
        | undefined
      if (!d) {
        setHover(null)
        return
      }
      const idx = bars.findIndex((b) => (b.t as number) === (param.time as number))
      const v = idx >= 0 ? bars[idx].v : 0
      const o = "open" in d ? d.open : (d.value as number)
      const h = "high" in d ? d.high : (d.value as number)
      const l = "low" in d ? d.low : (d.value as number)
      const c = "close" in d ? d.close : (d.value as number)
      setHover({ o, h, l, c, v, t: param.time as number })
    }
    chart.subscribeCrosshairMove(handler)

    // ---- horizontal-line drawing ----
    const onClick = (param: { point?: { x: number; y: number }; time?: Time }) => {
      if (!param.point || drawMode !== "hline" || !mainSeriesRef.current) return
      const price = mainSeriesRef.current.coordinateToPrice(param.point.y)
      if (price === null || price === undefined) return
      mainSeriesRef.current.createPriceLine({
        price: Number(price),
        color: COLORS.yellow,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: fmtNum(Number(price)),
      })
      setDrawMode("none")
    }
    chart.subscribeClick(onClick)

    // fit
    chart.timeScale().fitContent()

    return () => {
      chart.unsubscribeCrosshairMove(handler)
      chart.unsubscribeClick(onClick)
      chart.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      overlaySeriesRef.current.clear()
      subSeriesRef.current.clear()
      compareSeriesRef.current = null
    }
    // bars is derived from symbol+tf so don't add it to deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, tf, type, overlays, subs, compareSym])

  // close popovers on outside click
  useEffect(() => {
    const onDoc = () => {
      setStudyOpen(false)
      setCompareOpen(false)
    }
    document.addEventListener("click", onDoc)
    return () => document.removeEventListener("click", onDoc)
  }, [])

  // CSV export of the current series
  const exportCsv = () => {
    const head = "time,open,high,low,close,volume\n"
    const rows = bars
      .map((b) => `${new Date(b.t * 1000).toISOString()},${b.o},${b.h},${b.l},${b.c},${b.v}`)
      .join("\n")
    const blob = new Blob([head + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${symbol}_${tf}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const meta = useMemo(() => {
    const eq = EQUITIES.find((e) => e.symbol === symbol)
    const idx = INDICES.find((i) => i.symbol === symbol)
    return { name: eq?.name ?? idx?.name ?? symbol }
  }, [symbol])

  const display = hover ?? (last ? { o: last.o, h: last.h, l: last.l, c: last.c, v: last.v, t: last.t } : null)
  const dirColor = (n: number) => (n > 0 ? "text-[var(--color-up)]" : n < 0 ? "text-[var(--color-down)]" : "text-[var(--color-mute)]")

  const compareUniverse = useMemo(() => {
    return [...INDICES.map((i) => i.symbol), ...EQUITIES.map((e) => e.symbol)].filter((s) => s !== symbol)
  }, [symbol])

  return (
    <div className={`flex flex-col h-full min-h-0 bg-black ${className ?? ""}`}>
      {/* Header strip */}
      {showHeader && (
        <div className="flex items-center gap-3 border-b border-[var(--color-border-strong)] bg-[var(--color-panel)] px-2 h-[22px] text-[10px] whitespace-nowrap overflow-x-auto">
          <span className="text-[var(--color-amber)] font-bold tracking-wider">{symbol}</span>
          <span className="text-[var(--color-mute)] truncate">{meta.name}</span>
          {display && (
            <>
              <span>O <span className="text-white tabular-nums">{fmtNum(display.o)}</span></span>
              <span>H <span className="text-[var(--color-up)] tabular-nums">{fmtNum(display.h)}</span></span>
              <span>L <span className="text-[var(--color-down)] tabular-nums">{fmtNum(display.l)}</span></span>
              <span>C <span className="text-white tabular-nums">{fmtNum(display.c)}</span></span>
              <span>VOL <span className="text-[var(--color-cyan)] tabular-nums">{(display.v / 1e5).toFixed(2)}L</span></span>
              <span className={`tabular-nums ${dirColor(periodChange)}`}>
                {tf} {periodChange >= 0 ? "+" : ""}{(periodChange * 100).toFixed(2)}%
              </span>
              <span className="text-[var(--color-mute)] ml-auto">
                {new Date(display.t * 1000).toLocaleString("en-IN", { hour12: false }).toUpperCase()}
              </span>
            </>
          )}
        </div>
      )}

      {/* Toolbar */}
      {!compact && (
        <div className="flex items-center gap-1 border-b border-[var(--color-border-strong)] bg-[var(--color-panel)] px-1 h-[24px] text-[10px] flex-wrap">
          {/* Timeframes */}
          <div className="flex border border-[var(--color-border)]">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`px-2 h-[20px] border-r border-[var(--color-border)] last:border-r-0 ${
                  tf === t
                    ? "bg-[var(--color-amber)] text-black font-bold"
                    : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-px h-[18px] bg-[var(--color-border-strong)] mx-1" />

          {/* Chart type */}
          <div className="flex border border-[var(--color-border)]">
            {CHART_TYPES.map((c) => (
              <button
                key={c.id}
                onClick={() => setType(c.id)}
                className={`px-2 h-[20px] border-r border-[var(--color-border)] last:border-r-0 ${
                  type === c.id
                    ? "bg-[var(--color-amber)] text-black font-bold"
                    : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="w-px h-[18px] bg-[var(--color-border-strong)] mx-1" />

          {/* Studies */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setStudyOpen((s) => !s)
                setCompareOpen(false)
              }}
              className="px-2 h-[20px] border border-[var(--color-border)] text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
            >
              STUDY ({overlays.size + subs.size}) ▾
            </button>
            {studyOpen && (
              <div
                className="absolute left-0 top-[22px] z-50 w-[180px] bg-[var(--color-panel-2)] border border-[var(--color-amber)] shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[var(--color-mute)] border-b border-[var(--color-border)]">OVERLAYS</div>
                {OVERLAY_STUDIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setOverlays((prev) => {
                        const n = new Set(prev)
                        if (n.has(s)) n.delete(s)
                        else n.add(s)
                        return n
                      })
                    }}
                    className={`w-full text-left px-2 h-[20px] flex items-center justify-between ${
                      overlays.has(s)
                        ? "bg-[var(--color-amber-dim)]/40 text-[var(--color-amber-bright)]"
                        : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/20"
                    }`}
                  >
                    <span>{s}</span>
                    <span>{overlays.has(s) ? "✓" : ""}</span>
                  </button>
                ))}
                <div className="px-2 py-1 text-[var(--color-mute)] border-y border-[var(--color-border)]">SUB-PANES</div>
                {SUB_STUDIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSubs((prev) => {
                        const n = new Set(prev)
                        if (n.has(s)) n.delete(s)
                        else n.add(s)
                        return n
                      })
                    }}
                    className={`w-full text-left px-2 h-[20px] flex items-center justify-between ${
                      subs.has(s)
                        ? "bg-[var(--color-amber-dim)]/40 text-[var(--color-amber-bright)]"
                        : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/20"
                    }`}
                  >
                    <span>{s}</span>
                    <span>{subs.has(s) ? "✓" : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compare */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCompareOpen((s) => !s)
                setStudyOpen(false)
              }}
              className="px-2 h-[20px] border border-[var(--color-border)] text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
            >
              {compareSym ? `VS ${compareSym}` : "COMPARE ▾"}
            </button>
            {compareOpen && (
              <div
                className="absolute left-0 top-[22px] z-50 w-[180px] max-h-[280px] overflow-y-auto bg-[var(--color-panel-2)] border border-[var(--color-amber)] shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {compareSym && (
                  <button
                    onClick={() => {
                      setCompareSym(null)
                      setCompareOpen(false)
                    }}
                    className="w-full text-left px-2 h-[20px] text-[var(--color-down)] hover:bg-[var(--color-amber-dim)]/20 border-b border-[var(--color-border)]"
                  >
                    ✕ REMOVE COMPARE
                  </button>
                )}
                {compareUniverse.slice(0, 60).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setCompareSym(s)
                      setCompareOpen(false)
                    }}
                    className="w-full text-left px-2 h-[20px] text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drawing */}
          <button
            onClick={() => setDrawMode((m) => (m === "hline" ? "none" : "hline"))}
            className={`px-2 h-[20px] border border-[var(--color-border)] ${
              drawMode === "hline"
                ? "bg-[var(--color-amber)] text-black font-bold"
                : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
            }`}
            title="Click chart to add horizontal price line"
          >
            HLINE
          </button>

          {/* Spacer + utilities */}
          <div className="flex-1" />
          <button
            onClick={exportCsv}
            className="px-2 h-[20px] border border-[var(--color-border)] text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
            title="Export current series as CSV"
          >
            CSV
          </button>
          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            className="px-2 h-[20px] border border-[var(--color-border)] text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
            title="Reset zoom"
          >
            FIT
          </button>
        </div>
      )}

      {/* Chart canvas — autoSize fills this container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0"
        style={{ cursor: drawMode === "hline" ? "crosshair" : "default" }}
      />
    </div>
  )
}


