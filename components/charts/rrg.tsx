"use client"

import { useMemo } from "react"
import { genRRG } from "@/lib/mock-extra"

// Sector Relative Rotation Graph (RRG): RS-Ratio (X) vs RS-Momentum (Y).
// Quadrants: LEADING (top-right), WEAKENING (bottom-right), LAGGING (bottom-left), IMPROVING (top-left).
export function RRG({ height = 360 }: { height?: number }) {
  const data = useMemo(() => genRRG(), [])
  const W = 520
  const H = height
  const padL = 36
  const padR = 12
  const padT = 12
  const padB = 28

  const xs = data.flatMap((d) => [d.rsRatio, ...d.trail.map((p) => p.rsRatio)])
  const ys = data.flatMap((d) => [d.rsMom, ...d.trail.map((p) => p.rsMom)])
  const xMin = Math.min(...xs) - 1
  const xMax = Math.max(...xs) + 1
  const yMin = Math.min(...ys) - 1
  const yMax = Math.max(...ys) + 1
  const xS = (v: number) => padL + ((v - xMin) / (xMax - xMin)) * (W - padL - padR)
  const yS = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB)
  const x100 = xS(100)
  const y100 = yS(100)

  return (
    <div className="w-full h-full p-2 overflow-hidden">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Relative rotation graph">
        {/* quadrant fills */}
        <rect x={x100} y={padT} width={W - padR - x100} height={y100 - padT} fill="rgba(0,200,83,0.06)" />
        <rect x={padL} y={padT} width={x100 - padL} height={y100 - padT} fill="rgba(255,235,59,0.05)" />
        <rect x={padL} y={y100} width={x100 - padL} height={H - padB - y100} fill="rgba(255,23,68,0.06)" />
        <rect x={x100} y={y100} width={W - padR - x100} height={H - padB - y100} fill="rgba(0,229,255,0.05)" />

        {/* axes */}
        <line x1={padL} x2={W - padR} y1={y100} y2={y100} stroke="#2a2a2a" />
        <line x1={x100} x2={x100} y1={padT} y2={H - padB} stroke="#2a2a2a" />

        {/* quadrant labels */}
        <text x={W - padR - 4} y={padT + 12} textAnchor="end" fontSize="10" fill="#00c853" letterSpacing="2">LEADING</text>
        <text x={padL + 4} y={padT + 12} textAnchor="start" fontSize="10" fill="#ffeb3b" letterSpacing="2">IMPROVING</text>
        <text x={padL + 4} y={H - padB - 4} textAnchor="start" fontSize="10" fill="#ff1744" letterSpacing="2">LAGGING</text>
        <text x={W - padR - 4} y={H - padB - 4} textAnchor="end" fontSize="10" fill="#00e5ff" letterSpacing="2">WEAKENING</text>

        {/* axis ticks */}
        {[xMin, 100, xMax].map((v) => (
          <text key={`x${v}`} x={xS(v)} y={H - padB + 12} textAnchor="middle" fontSize="9" fill="#808080">
            {v.toFixed(1)}
          </text>
        ))}
        {[yMin, 100, yMax].map((v) => (
          <text key={`y${v}`} x={padL - 4} y={yS(v) + 3} textAnchor="end" fontSize="9" fill="#808080">
            {v.toFixed(1)}
          </text>
        ))}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="#808080" letterSpacing="2">
          RS-RATIO
        </text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize="9" fill="#808080" letterSpacing="2" transform={`rotate(-90, 10, ${H / 2})`}>
          RS-MOMENTUM
        </text>

        {/* trails + heads */}
        {data.map((d) => {
          const path = d.trail.map((p, i) => `${i === 0 ? "M" : "L"}${xS(p.rsRatio)},${yS(p.rsMom)}`).join(" ")
          const headColor =
            d.rsRatio > 100 && d.rsMom > 100
              ? "#00c853"
              : d.rsRatio > 100 && d.rsMom < 100
                ? "#00e5ff"
                : d.rsRatio < 100 && d.rsMom > 100
                  ? "#ffeb3b"
                  : "#ff1744"
          return (
            <g key={d.sector}>
              <path d={path} fill="none" stroke={headColor} strokeWidth="1" strokeOpacity="0.45" />
              <circle cx={xS(d.rsRatio)} cy={yS(d.rsMom)} r="3.5" fill={headColor} />
              <text x={xS(d.rsRatio) + 6} y={yS(d.rsMom) + 3} fontSize="9" fill="#ffa500">
                {d.sector}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
