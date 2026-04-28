"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import type { OHLCBar } from "@/lib/types"
import { fmtNum } from "@/lib/format"

interface Props {
  bars: OHLCBar[]
  type?: "candle" | "line"
  height?: number
}

export function PriceChart({ bars, type = "candle", height = 280 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(800)
  const [hover, setHover] = useState<{ x: number; bar: OHLCBar } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.getBoundingClientRect().width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { path, candles, min, max, scaleX, scaleY, paddingX, paddingY, chartH, chartW } = useMemo(() => {
    const paddingX = 36
    const paddingY = 16
    const chartW = w - paddingX - 8
    const chartH = height - paddingY * 2
    const lows = bars.map((b) => b.l)
    const highs = bars.map((b) => b.h)
    const min = Math.min(...lows)
    const max = Math.max(...highs)
    const range = max - min || 1
    const scaleX = (i: number) => paddingX + (i / Math.max(1, bars.length - 1)) * chartW
    const scaleY = (v: number) => paddingY + (1 - (v - min) / range) * chartH
    const path = bars.map((b, i) => `${i === 0 ? "M" : "L"} ${scaleX(i).toFixed(1)} ${scaleY(b.c).toFixed(1)}`).join(" ")
    const cw = Math.max(1, chartW / bars.length - 1)
    const candles = bars.map((b, i) => ({
      x: scaleX(i),
      yH: scaleY(b.h),
      yL: scaleY(b.l),
      yO: scaleY(b.o),
      yC: scaleY(b.c),
      up: b.c >= b.o,
      cw,
      bar: b,
    }))
    return { path, candles, min, max, scaleX, scaleY, paddingX, paddingY, chartH, chartW }
  }, [bars, w, height])

  // y gridlines
  const ticks = 5
  const gridY = Array.from({ length: ticks + 1 }, (_, i) => min + (i * (max - min)) / ticks)

  return (
    <div ref={ref} className="w-full bg-black" style={{ height }}>
      <svg
        width={w}
        height={height}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
          const x = e.clientX - rect.left
          const i = Math.round(((x - paddingX) / chartW) * (bars.length - 1))
          if (i >= 0 && i < bars.length) setHover({ x, bar: bars[i] })
        }}
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines + y labels */}
        {gridY.map((v, i) => (
          <g key={i}>
            <line
              x1={paddingX}
              x2={w - 8}
              y1={scaleY(v)}
              y2={scaleY(v)}
              stroke="#1a1a1a"
              strokeDasharray="2 3"
            />
            <text x={paddingX - 4} y={scaleY(v) + 3} fontSize={9} textAnchor="end" fill="#808080" fontFamily="var(--font-mono)">
              {fmtNum(v, v > 1000 ? 0 : 2)}
            </text>
          </g>
        ))}
        {/* x labels (sparse) */}
        {bars
          .filter((_, i) => i % Math.max(1, Math.floor(bars.length / 6)) === 0)
          .map((b, i) => {
            const idx = bars.indexOf(b)
            const d = new Date(b.t * 1000)
            const lbl = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase()
            return (
              <text
                key={i}
                x={scaleX(idx)}
                y={height - 2}
                fontSize={9}
                fill="#808080"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
              >
                {lbl}
              </text>
            )
          })}

        {type === "line" ? (
          <path d={path} stroke="var(--color-amber)" strokeWidth={1.2} fill="none" />
        ) : (
          candles.map((c, i) => (
            <g key={i}>
              <line x1={c.x} x2={c.x} y1={c.yH} y2={c.yL} stroke={c.up ? "#00c853" : "#ff1744"} strokeWidth={1} />
              <rect
                x={c.x - c.cw / 2}
                y={Math.min(c.yO, c.yC)}
                width={c.cw}
                height={Math.max(1, Math.abs(c.yO - c.yC))}
                fill={c.up ? "#00c853" : "#ff1744"}
              />
            </g>
          ))
        )}
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={paddingY} y2={paddingY + chartH} stroke="#ffa500" strokeDasharray="2 2" />
          </g>
        )}
      </svg>
      {hover && (
        <div className="px-2 py-1 text-[10px] flex gap-3 border-t border-[var(--color-border)]">
          <span className="text-[var(--color-mute)]">
            {new Date(hover.bar.t * 1000).toLocaleDateString("en-IN").toUpperCase()}
          </span>
          <span>O <span className="text-white">{fmtNum(hover.bar.o)}</span></span>
          <span>H <span className="text-[var(--color-up)]">{fmtNum(hover.bar.h)}</span></span>
          <span>L <span className="text-[var(--color-down)]">{fmtNum(hover.bar.l)}</span></span>
          <span>C <span className="text-white">{fmtNum(hover.bar.c)}</span></span>
          <span>VOL <span className="text-[var(--color-cyan)]">{(hover.bar.v / 1e5).toFixed(2)}L</span></span>
        </div>
      )}
    </div>
  )
}
