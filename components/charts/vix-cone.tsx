"use client"

import { VIX_CONE } from "@/lib/mock-extra"

// Simple SVG vol-cone showing the realized-vol percentile band per window with the
// current implied vol point overlaid. No external chart deps.
export function VixCone({ height = 200 }: { height?: number }) {
  const points = VIX_CONE
  const allMax = Math.max(...points.map((p) => p.realizedMax)) * 1.05
  const allMin = Math.min(...points.map((p) => p.realizedMin)) * 0.9
  const W = 360
  const H = height
  const padL = 28
  const padR = 8
  const padT = 12
  const padB = 22
  const xw = (W - padL - padR) / (points.length - 1)
  const y = (v: number) => padT + (1 - (v - allMin) / (allMax - allMin)) * (H - padT - padB)
  const x = (i: number) => padL + i * xw

  const minPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.realizedMin)}`).join(" ")
  const maxPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.realizedMax)}`).join(" ")
  const p25Path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.realizedP25)}`).join(" ")
  const p75Path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.realizedP75)}`).join(" ")
  const medPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.realizedMedian)}`).join(" ")
  const ivPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.iv)}`).join(" ")

  const fillBand = (top: string, bottom: string) =>
    `${top} L ${points
      .slice()
      .reverse()
      .map((_, i) => {
        const idx = points.length - 1 - i
        const p = points[idx]
        return `${x(idx)},${y(parseFloat((p as unknown as Record<string, number>)[bottom] as unknown as string))}`
      })
      .join(" L ")} Z`

  // build inner band (p25..p75) and outer band (min..max)
  const outer = [
    ...points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.realizedMax)}`),
    ...points
      .slice()
      .reverse()
      .map((p, i) => `L${x(points.length - 1 - i)},${y(p.realizedMin)}`),
    "Z",
  ].join(" ")
  const inner = [
    ...points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.realizedP75)}`),
    ...points
      .slice()
      .reverse()
      .map((p, i) => `L${x(points.length - 1 - i)},${y(p.realizedP25)}`),
    "Z",
  ].join(" ")
  void fillBand // unused convenience helper

  // gridlines at every 4 vol units
  const ticks: number[] = []
  for (let v = Math.floor(allMin / 4) * 4; v <= allMax; v += 4) ticks.push(v)

  return (
    <div className="w-full h-full p-2">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="VIX cone">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#1a1a1a" strokeWidth="1" />
            <text x={padL - 4} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#808080">
              {t}
            </text>
          </g>
        ))}
        <path d={outer} fill="rgba(255,165,0,0.08)" stroke="none" />
        <path d={inner} fill="rgba(255,165,0,0.18)" stroke="none" />
        <path d={maxPath} fill="none" stroke="#b37300" strokeDasharray="3 3" strokeWidth="1" />
        <path d={minPath} fill="none" stroke="#b37300" strokeDasharray="3 3" strokeWidth="1" />
        <path d={p75Path} fill="none" stroke="#ffa500" strokeWidth="1" />
        <path d={p25Path} fill="none" stroke="#ffa500" strokeWidth="1" />
        <path d={medPath} fill="none" stroke="#ffeb3b" strokeWidth="1.5" />
        <path d={ivPath} fill="none" stroke="#00e5ff" strokeWidth="1.5" />
        {points.map((p, i) => (
          <g key={p.window}>
            <circle cx={x(i)} cy={y(p.iv)} r="2.5" fill="#00e5ff" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#808080">
              {p.window}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex items-center gap-3 px-2 text-[9px] text-[var(--color-mute)]">
        <span><span className="inline-block w-3 h-[2px] bg-[var(--color-cyan)] mr-1" />IMPLIED</span>
        <span><span className="inline-block w-3 h-[2px] bg-[var(--color-yellow)] mr-1" />REALIZED MEDIAN</span>
        <span><span className="inline-block w-3 h-[2px] bg-[var(--color-amber)] mr-1" />P25 / P75</span>
        <span><span className="inline-block w-3 h-[2px] bg-[var(--color-amber-dim)] mr-1" />MIN / MAX</span>
      </div>
    </div>
  )
}
