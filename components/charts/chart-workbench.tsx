"use client"

/**
 * BETAGEN chart workbench — Bloomberg-G–styled price chart.
 *
 * Layout mirrors Bloomberg's GP / G screens (see Bloomberg images):
 *   - RED IDENTIFIER STRIP : security identifier, numbered action menus
 *                            (94 Suggested Charts | 96 Actions | 97 Edit)
 *                            and the chart-type label on the right.
 *   - DATE-RANGE ROW       : date pickers in red borders, Last Px source
 *                            dropdown, Local CCY dropdown, Mov Avgs and
 *                            Key Events checkboxes.
 *   - PERIOD ROW           : 1D 3D 1M 6M YTD 1Y 5Y Max | interval | Track
 *                            Annotate News Zoom | Compare | Edit Chart.
 *   - LEGEND OVERLAY       : top-left block listing each plotted security
 *                            with its R1 / R2 / L1 axis tag and last value,
 *                            plus High / Average / Low for the primary.
 *   - NAVY CHART CANVAS    : main pane + volume sub-pane underneath.
 *   - SUGGESTED FUNCTIONS  : red footer strip with GIP / OMON shortcuts.
 *
 * Powered by TradingView's `lightweight-charts` (Apache-2.0).
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

type Timeframe = "1D" | "3D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX"
type ChartType = "candle" | "bar" | "line" | "area"
type Axis = "R1" | "R2" | "L1"
type CompareSlot = { sym: string; axis: Axis; color: string }

const TIMEFRAMES: Timeframe[] = ["1D", "3D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"]
const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: "line", label: "Line Chart" },
  { id: "candle", label: "Candle Chart" },
  { id: "bar", label: "Bar Chart" },
  { id: "area", label: "Mountain Chart" },
]

// Bloomberg-G chart palette. Backgrounds are dark navy, primary trace is
// white (matches Bloomberg image 1/2 default), volume bars are steel-blue
// (monochrome — Bloomberg never colors volume by direction on charts).
const COLORS = {
  bg: "#07172e",
  grid: "#102641",
  text: "#a8c0db",
  border: "#1c3a63",
  white: "#ffffff",
  amber: "#ffa028",
  amberBright: "#ffbf00",
  amberDim: "#8a5a14",
  up: "#20d069",
  down: "#ff2e3c",
  cyan: "#00d3e6",
  magenta: "#d946a0",
  yellow: "#ffd400",
  blue: "#4fa8ff",
  vol: "#3a6fa8",
}

// Compare-slot color rotation matches Bloomberg image 1: NXT in green, UKX in magenta.
const COMPARE_COLORS = [COLORS.up, COLORS.magenta, COLORS.cyan, COLORS.yellow, COLORS.blue]

// ----- Indicator math -----

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

// ----- Series helpers -----

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
  return toCandleData(bars)
}
function toLineData(bars: Bar[], pick: (b: Bar) => number) {
  return bars.map((b) => ({ time: b.t as UTCTimestamp, value: pick(b) }))
}
function toLineWithNulls(bars: Bar[], series: (number | null)[]): LineData[] {
  const out: LineData[] = []
  for (let i = 0; i < bars.length; i++) {
    const v = series[i]
    if (v === null || !isFinite(v)) continue
    out.push({ time: bars[i].t as UTCTimestamp, value: v })
  }
  return out
}
function toVolumeData(bars: Bar[]) {
  return bars.map((b) => ({ time: b.t as UTCTimestamp, value: b.v, color: COLORS.vol }))
}

// ----- Time/data slicing per timeframe -----

function pickBars(symbol: string, tf: Timeframe): Bar[] {
  if (tf === "1D") return genIntraday(symbol, 5, 1)
  if (tf === "3D") return genIntraday(symbol, 15, 3)
  if (tf === "1M") return genOHLC(symbol, 22)
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
  return genOHLC(symbol, 252 * 7)
}

function fmtDate(ts?: number) {
  if (!ts) return ""
  const d = new Date(ts * 1000)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
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
  initialType = "line",
  compact = false,
  showHeader = true,
  className,
}: ChartWorkbenchProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null)
  const ovRefs = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map())
  const cmpRefs = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map())

  const [tf, setTf] = useState<Timeframe>(initialTimeframe)
  const [type, setType] = useState<ChartType>(initialType)
  const [movAvgs, setMovAvgs] = useState(false)
  const [keyEvents, setKeyEvents] = useState(false)
  const [track, setTrack] = useState(true)
  const [annotate, setAnnotate] = useState(false)
  const [compares, setCompares] = useState<CompareSlot[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [pxSrc, setPxSrc] = useState<"Last Px" | "Bid" | "Ask" | "Mid">("Last Px")
  const [ccy, setCcy] = useState<"Local CCY" | "USD" | "INR">("Local CCY")
  const [hover, setHover] = useState<{ o: number; h: number; l: number; c: number; v: number; t: number } | null>(null)

  const bars = useMemo(() => pickBars(symbol, tf), [symbol, tf])
  const last = bars[bars.length - 1]
  const first = bars[0]

  // Stats for the legend block
  const stats = useMemo(() => {
    if (!bars.length) return null
    let high = -Infinity
    let highT = 0
    let low = Infinity
    let lowT = 0
    let sum = 0
    for (const b of bars) {
      if (b.h > high) {
        high = b.h
        highT = b.t
      }
      if (b.l < low) {
        low = b.l
        lowT = b.t
      }
      sum += b.c
    }
    return { high, highT, low, lowT, avg: sum / bars.length }
  }, [bars])

  // ---- build chart on inputs change ----
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      ovRefs.current.clear()
      cmpRefs.current.clear()
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
        mode: track ? CrosshairMode.Normal : CrosshairMode.Hidden,
        vertLine: { color: COLORS.amber, width: 1, style: 2, labelBackgroundColor: COLORS.amber },
        horzLine: { color: COLORS.amber, width: 1, style: 2, labelBackgroundColor: COLORS.amber },
      },
      rightPriceScale: { borderColor: COLORS.border, scaleMargins: { top: 0.08, bottom: 0.08 } },
      leftPriceScale: { borderColor: COLORS.border, visible: false, scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: {
        borderColor: COLORS.border,
        timeVisible: tf === "1D" || tf === "3D",
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 6,
      },
    })
    chartRef.current = chart

    // ---- main series — primary always on R1 (right scale) ----
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
      main = chart.addSeries(BarSeries, { upColor: COLORS.up, downColor: COLORS.down, thinBars: false })
      ;(main as ISeriesApi<"Bar">).setData(toBarData(bars))
    } else if (type === "line") {
      main = chart.addSeries(LineSeries, {
        color: COLORS.white,
        lineWidth: 1,
        priceLineColor: COLORS.amber,
        priceLineStyle: LineStyle.LargeDashed,
        lastValueVisible: true,
      })
      ;(main as ISeriesApi<"Line">).setData(toLineData(bars, (b) => b.c))
    } else {
      main = chart.addSeries(AreaSeries, {
        topColor: "rgba(255,255,255,0.18)",
        bottomColor: "rgba(255,255,255,0.01)",
        lineColor: COLORS.white,
        lineWidth: 1,
      })
      ;(main as ISeriesApi<"Area">).setData(toLineData(bars, (b) => b.c))
    }
    mainSeriesRef.current = main

    // Key Events markers
    if (keyEvents) {
      const markIdxs = [
        Math.floor(bars.length * 0.18),
        Math.floor(bars.length * 0.42),
        Math.floor(bars.length * 0.66),
        Math.floor(bars.length * 0.88),
      ]
      const labels = ["EARN", "DIV", "GUID", "BLK"]
      const markers = markIdxs
        .filter((i) => i >= 0 && i < bars.length)
        .map((i, k) => ({
          time: bars[i].t as UTCTimestamp,
          position: "aboveBar" as const,
          color: COLORS.amberBright,
          shape: "circle" as const,
          text: labels[k],
        }))
      try {
        // setMarkers only exists on classic series; ignore in v5
        ;(main as unknown as { setMarkers?: (m: typeof markers) => void }).setMarkers?.(markers)
      } catch {
        /* noop */
      }
    }

    // ---- Mov Avgs overlays (SMA20 + SMA50) ----
    if (movAvgs) {
      const closes = bars.map((b) => b.c)
      const s20 = chart.addSeries(LineSeries, {
        color: COLORS.cyan,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      s20.setData(toLineWithNulls(bars, sma(closes, 20)))
      ovRefs.current.set("SMA20", s20)
      const s50 = chart.addSeries(LineSeries, {
        color: COLORS.amberBright,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      s50.setData(toLineWithNulls(bars, sma(closes, 50)))
      ovRefs.current.set("SMA50", s50)
    }

    // ---- volume sub-pane (pane index 1) ----
    const vol = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: true, color: COLORS.vol },
      1,
    )
    vol.setData(toVolumeData(bars))
    chart.panes()[1]?.priceScale("right").applyOptions({ scaleMargins: { top: 0.1, bottom: 0 } })

    // ---- Compare series — each on its own price scale (R2 right2 / L1 left) ----
    for (const c of compares) {
      const cmpBars = pickBars(c.sym, tf)
      const data = cmpBars.map((b) => ({ time: b.t as UTCTimestamp, value: b.c }))
      const priceScaleId = c.axis === "L1" ? "left" : c.axis === "R2" ? "right2" : "right"
      const cs = chart.addSeries(LineSeries, {
        color: c.color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        priceScaleId,
        title: c.sym,
      })
      cs.setData(data)
      cmpRefs.current.set(c.sym, cs)
      // Make sure left + custom-right scales are visible when compares attach to them.
      if (c.axis === "L1") {
        chart.priceScale("left").applyOptions({ visible: true, borderColor: COLORS.border })
      }
      if (c.axis === "R2") {
        chart.priceScale("right2").applyOptions({ visible: true, borderColor: COLORS.border })
      }
    }

    // ---- crosshair sync to header strip ----
    const handler = (param: { time?: Time; seriesData: Map<ISeriesApi<SeriesType>, unknown> }) => {
      if (!param.time || !mainSeriesRef.current) {
        setHover(null)
        return
      }
      const m = mainSeriesRef.current
      const raw = param.seriesData.get(m) as
        | Partial<{ open: number; high: number; low: number; close: number; value: number }>
        | undefined
      if (!raw) {
        setHover(null)
        return
      }
      const idx = bars.findIndex((b) => (b.t as number) === (param.time as number))
      const v = idx >= 0 ? bars[idx].v : 0
      const fallback = raw.value ?? raw.close ?? 0
      const o = raw.open ?? fallback
      const h = raw.high ?? fallback
      const l = raw.low ?? fallback
      const c = raw.close ?? fallback
      setHover({ o, h, l, c, v, t: param.time as number })
    }
    chart.subscribeCrosshairMove(handler)

    // ---- annotate (h-line drawing) ----
    const onClick = (param: { point?: { x: number; y: number }; time?: Time }) => {
      if (!param.point || !annotate || !mainSeriesRef.current) return
      const price = mainSeriesRef.current.coordinateToPrice(param.point.y)
      if (price === null || price === undefined) return
      mainSeriesRef.current.createPriceLine({
        price: Number(price),
        color: COLORS.amberBright,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: fmtNum(Number(price)),
      })
      setAnnotate(false)
    }
    chart.subscribeClick(onClick)

    chart.timeScale().fitContent()

    return () => {
      chart.unsubscribeCrosshairMove(handler)
      chart.unsubscribeClick(onClick)
      chart.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      ovRefs.current.clear()
      cmpRefs.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, tf, type, movAvgs, keyEvents, track, JSON.stringify(compares)])

  // close popovers on outside click
  useEffect(() => {
    const onDoc = () => {
      setCompareOpen(false)
      setEditOpen(false)
    }
    document.addEventListener("click", onDoc)
    return () => document.removeEventListener("click", onDoc)
  }, [])

  const meta = useMemo(() => {
    const eq = EQUITIES.find((e) => e.symbol === symbol)
    const idx = INDICES.find((i) => i.symbol === symbol)
    return {
      name: eq?.name ?? idx?.name ?? symbol,
      kind: eq ? "Equity" : idx ? "Index" : "",
    }
  }, [symbol])

  const compareUniverse = useMemo(() => {
    return [...INDICES.map((i) => i.symbol), ...EQUITIES.map((e) => e.symbol)].filter(
      (s) => s !== symbol && !compares.some((c) => c.sym === s),
    )
  }, [symbol, compares])

  // pick next axis slot — R2 then L1, max 2 compares
  const nextSlot = (): Axis | null => {
    const used = new Set(compares.map((c) => c.axis))
    if (!used.has("R2")) return "R2"
    if (!used.has("L1")) return "L1"
    return null
  }

  const addCompare = (sym: string) => {
    const axis = nextSlot()
    if (!axis) return
    const color = COMPARE_COLORS[compares.length % COMPARE_COLORS.length]
    setCompares((prev) => [...prev, { sym, axis, color }])
    setCompareOpen(false)
  }
  const removeCompare = (sym: string) => {
    setCompares((prev) => prev.filter((c) => c.sym !== sym))
  }

  const compareLast = (sym: string): number => {
    const cb = pickBars(sym, tf)
    return cb[cb.length - 1]?.c ?? 0
  }

  const display = hover ?? (last ? { o: last.o, h: last.h, l: last.l, c: last.c, v: last.v, t: last.t } : null)
  const periodChange = last && first ? (last.c - first.c) / first.c : 0
  const dir = (n: number) =>
    n > 0 ? "text-[var(--color-up)]" : n < 0 ? "text-[var(--color-down)]" : "text-[var(--color-mute)]"

  const typeLabel = CHART_TYPES.find((c) => c.id === type)?.label ?? "Line Chart"

  return (
    <div className={`flex flex-col h-full min-h-0 bg-[var(--color-panel)] ${className ?? ""}`}>
      {/* Red identifier strip — security + numbered action menus */}
      {showHeader && (
        <div className="bb-strip text-[11px]">
          <div className="bb-strip-id">
            {symbol} {meta.kind}
          </div>
          <button className="bb-strip-action" type="button">
            <span className="bb-strip-num">94</span>
            <span>Suggested Charts</span>
          </button>
          <button className="bb-strip-action" type="button">
            <span className="bb-strip-num">96</span>
            <span>Actions</span>
          </button>
          <button
            className="bb-strip-action"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setEditOpen((s) => !s)
            }}
          >
            <span className="bb-strip-num">97</span>
            <span>Edit</span>
          </button>
          <div className="bb-strip-tail">{typeLabel}</div>
        </div>
      )}

      {/* Live OHLCV header strip — black sub-header w/ amber security & ticker stats */}
      {showHeader && display && (
        <div className="flex items-center gap-3 bg-black border-b border-[var(--color-border)] px-2 h-[20px] text-[10px] whitespace-nowrap overflow-x-auto">
          <span className="text-[var(--color-amber)] font-bold tracking-wider">{symbol}</span>
          <span className={`font-bold tabular-nums ${dir(periodChange)}`}>
            {periodChange >= 0 ? "↑" : "↓"} {fmtNum(display.c)}
          </span>
          <span className={`tabular-nums ${dir(periodChange)}`}>
            {periodChange >= 0 ? "+" : ""}
            {(periodChange * 100).toFixed(2)}%
          </span>
          <span className="text-[var(--color-mute)]">
            At {new Date(display.t * 1000).toLocaleTimeString("en-IN", { hour12: false })}
          </span>
          <span>
            <span className="text-[var(--color-mute)]">Vol </span>
            <span className="text-white tabular-nums">{(display.v / 1e5).toFixed(2)}L</span>
          </span>
          <span>
            <span className="text-[var(--color-mute)]">O </span>
            <span className="text-white tabular-nums">{fmtNum(display.o)}</span>
          </span>
          <span>
            <span className="text-[var(--color-mute)]">H </span>
            <span className="text-[var(--color-up)] tabular-nums">{fmtNum(display.h)}</span>
          </span>
          <span>
            <span className="text-[var(--color-mute)]">L </span>
            <span className="text-[var(--color-down)] tabular-nums">{fmtNum(display.l)}</span>
          </span>
          <span className="text-[var(--color-mute)] ml-auto truncate">{meta.name}</span>
        </div>
      )}

      {/* Date-range row */}
      {!compact && (
        <div className="flex items-center gap-2 bg-[var(--color-panel-deep)] border-b border-[var(--color-border)] px-2 h-[24px] text-[10px]">
          <input className="bb-date" defaultValue={fmtDate(first?.t)} readOnly />
          <span className="text-[var(--color-amber-bright)]">-</span>
          <input className="bb-date" defaultValue={fmtDate(last?.t)} readOnly />
          <select
            className="bb-date cursor-pointer"
            value={pxSrc}
            onChange={(e) => setPxSrc(e.target.value as typeof pxSrc)}
          >
            <option>Last Px</option>
            <option>Bid</option>
            <option>Ask</option>
            <option>Mid</option>
          </select>
          <select
            className="bb-date cursor-pointer"
            value={ccy}
            onChange={(e) => setCcy(e.target.value as typeof ccy)}
          >
            <option>Local CCY</option>
            <option>USD</option>
            <option>INR</option>
          </select>
          <label className="flex items-center gap-1 cursor-pointer text-[var(--color-amber-bright)]">
            <input
              type="checkbox"
              checked={movAvgs}
              onChange={(e) => setMovAvgs(e.target.checked)}
              className="accent-[var(--color-amber)]"
            />
            <span>Mov Avgs</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-[var(--color-amber-bright)]">
            <input
              type="checkbox"
              checked={keyEvents}
              onChange={(e) => setKeyEvents(e.target.checked)}
              className="accent-[var(--color-amber)]"
            />
            <span>Key Events</span>
          </label>
          <div className="ml-auto" />
        </div>
      )}

      {/* Period row */}
      {!compact && (
        <div className="flex items-center gap-1 bg-[var(--color-panel)] border-b border-[var(--color-border)] px-1 h-[24px] text-[10px] flex-wrap">
          <div className="flex">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`px-2 h-[20px] border-r border-[var(--color-border)] last:border-r-0 ${
                  tf === t
                    ? "bg-[var(--color-amber)] text-black font-bold"
                    : "text-[var(--color-amber-bright)] hover:bg-[var(--color-amber-dim)]/30"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="text-[var(--color-amber-bright)] mx-2">
            {tf === "1D" ? "5 Min" : tf === "3D" ? "15 Min" : "Daily"}
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ChartType)}
            className="bb-date cursor-pointer"
          >
            {CHART_TYPES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <span className="w-px h-[14px] bg-[var(--color-border-strong)] mx-1" />

          <button
            onClick={() => setTrack((v) => !v)}
            className={`px-2 h-[20px] ${
              track
                ? "text-[var(--color-amber-bright)]"
                : "text-[var(--color-mute)] hover:text-[var(--color-amber-bright)]"
            }`}
            title="Toggle crosshair"
          >
            ✎ Track
          </button>
          <button
            onClick={() => setAnnotate((v) => !v)}
            className={`px-2 h-[20px] ${
              annotate
                ? "bg-[var(--color-amber)] text-black font-bold"
                : "text-[var(--color-amber-bright)] hover:bg-[var(--color-amber-dim)]/30"
            }`}
            title="Click chart to add a horizontal price line"
          >
            ✎ Annotate
          </button>
          <button className="px-2 h-[20px] text-[var(--color-amber-bright)] hover:bg-[var(--color-amber-dim)]/30">
            ◷ News
          </button>
          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            className="px-2 h-[20px] text-[var(--color-amber-bright)] hover:bg-[var(--color-amber-dim)]/30"
          >
            ⛶ Zoom
          </button>

          <div className="ml-auto flex items-center gap-1">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCompareOpen((s) => !s)
                  setEditOpen(false)
                }}
                disabled={!nextSlot()}
                className="px-2 h-[20px] text-[var(--color-amber-bright)] hover:bg-[var(--color-amber-dim)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Compare {nextSlot() && `(${nextSlot()})`}
              </button>
              {compareOpen && (
                <div
                  className="absolute right-0 top-[20px] z-50 w-[180px] max-h-[280px] overflow-y-auto bg-[var(--color-panel-2)] border border-[var(--color-amber)] shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1 text-[var(--color-amber-bright)] border-b border-[var(--color-border)] text-[9px]">
                    ADD TO {nextSlot()}
                  </div>
                  {compareUniverse.slice(0, 80).map((s) => (
                    <button
                      key={s}
                      onClick={() => addCompare(s)}
                      className="w-full text-left px-2 h-[20px] text-[var(--color-amber-bright)] hover:bg-[var(--color-amber-dim)]/20"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="px-2 h-[20px] text-[var(--color-amber-bright)] hover:bg-[var(--color-amber-dim)]/30">
              ✎ Edit Chart
            </button>
          </div>
        </div>
      )}

      {/* Chart canvas + overlays */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ cursor: annotate ? "crosshair" : "default" }}
        />

        {/* Top-left legend block — primary + compares with axis tags + stats */}
        {showHeader && (
          <div className="absolute top-1 left-1 z-10 bg-[var(--color-panel-deep)]/85 border border-[var(--color-border)] px-2 py-1 text-[10px] backdrop-blur-[1px] pointer-events-auto">
            {/* primary row */}
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-[10px] h-[10px] border border-white/40"
                style={{ background: COLORS.white }}
              />
              <span className="text-white font-bold tracking-wider">{symbol}</span>
              <span className="text-[var(--color-amber-bright)]">(R1)</span>
              <span className="text-white tabular-nums ml-auto">{display ? fmtNum(display.c) : "—"}</span>
            </div>
            {/* compare rows */}
            {compares.map((c) => (
              <div key={c.sym} className="flex items-center gap-2">
                <span
                  className="inline-block w-[10px] h-[10px] border border-white/40"
                  style={{ background: c.color }}
                />
                <span className="font-bold tracking-wider" style={{ color: c.color }}>
                  {c.sym}
                </span>
                <span className="text-[var(--color-amber-bright)]">({c.axis})</span>
                <button
                  onClick={() => removeCompare(c.sym)}
                  className="text-[var(--color-mute)] hover:text-[var(--color-down)] px-1"
                  title="Remove"
                >
                  ×
                </button>
                <span className="tabular-nums ml-auto" style={{ color: c.color }}>
                  {fmtNum(compareLast(c.sym))}
                </span>
              </div>
            ))}
            {/* primary stats — Bloomberg shows High / Average / Low with date stamps */}
            {stats && (
              <div className="mt-1 pt-1 border-t border-[var(--color-border)] text-[9px] space-y-[1px]">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-mute)]">High on {fmtDate(stats.highT)}</span>
                  <span className="text-[var(--color-up)] tabular-nums ml-auto">{fmtNum(stats.high)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-mute)]">Average</span>
                  <span className="text-[var(--color-amber-bright)] tabular-nums ml-auto">{fmtNum(stats.avg)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-mute)]">Low on {fmtDate(stats.lowT)}</span>
                  <span className="text-[var(--color-down)] tabular-nums ml-auto">{fmtNum(stats.low)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggested Functions footer — red strip with two/three contextual mnemonics */}
      {!compact && (
        <div className="bb-strip text-[10px]">
          <div className="bb-strip-id">Suggested Functions</div>
          <div className="bb-strip-action">
            <span className="bb-strip-num">GIP</span>
            <span>Chart intraday price movements</span>
          </div>
          <div className="bb-strip-action">
            <span className="bb-strip-num">OMON</span>
            <span>Monitor live prices for options</span>
          </div>
          <div className="bb-strip-action">
            <span className="bb-strip-num">GP</span>
            <span>Multi-asset price chart</span>
          </div>
        </div>
      )}
    </div>
  )
}
