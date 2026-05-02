"use client"

import { useMemo } from "react"
import { hashCode } from "@/lib/mock-data"

const SYMBOLS = [
  "NIFTY",
  "BANKNIFTY",
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ITC",
  "SBIN",
  "LT",
  "ICICIBANK",
  "BAJFIN",
  "MARUTI",
]

function corr(a: string, b: string): number {
  if (a === b) return 1
  const seed = hashCode(a + b) + hashCode(b + a)
  // bias by sector similarity
  const bankPair = ["HDFCBANK", "ICICIBANK", "SBIN", "BANKNIFTY", "BAJFIN"]
  const itPair = ["TCS", "INFY"]
  let base = ((seed % 200) - 100) / 100 // -1..1
  if (bankPair.includes(a) && bankPair.includes(b)) base = 0.55 + Math.abs(seed % 30) / 100
  if (itPair.includes(a) && itPair.includes(b)) base = 0.78 + Math.abs(seed % 15) / 100
  return Math.max(-0.95, Math.min(0.99, base))
}

// Two-tone solid heat scale: deep blue (negative) through black (zero) to deep
// red (positive). No alpha — Bloomberg uses opaque, high-contrast cells.
function color(v: number): string {
  if (v >= 0) {
    const a = Math.min(1, Math.abs(v))
    // Black → dark red
    const r = Math.floor(20 + a * 200)
    const g = Math.floor(0 + a * 30)
    const b = Math.floor(0 + a * 30)
    return `rgb(${r},${g},${b})`
  }
  const a = Math.min(1, Math.abs(v))
  // Black → dark blue
  const r = Math.floor(0 + a * 20)
  const g = Math.floor(0 + a * 40)
  const b = Math.floor(20 + a * 200)
  return `rgb(${r},${g},${b})`
}

export function CorrelationMatrix() {
  const matrix = useMemo(() => SYMBOLS.map((a) => SYMBOLS.map((b) => corr(a, b))), [])

  return (
    <div className="overflow-auto h-full">
      <table className="text-[10px] font-mono border-separate border-spacing-0 bb-num">
        <thead>
          <tr>
            <th className="bg-[var(--color-panel-2)] sticky left-0 z-10 border-b border-r border-[var(--color-border-strong)]"></th>
            {SYMBOLS.map((s) => (
              <th
                key={s}
                className="bg-[var(--color-panel-2)] border-b border-[var(--color-border-strong)] px-1 text-[var(--color-amber)] font-normal text-[9px] tracking-tight"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  height: 56,
                }}
              >
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((row, i) => (
            <tr key={row}>
              <th className="bg-[var(--color-panel-2)] sticky left-0 z-10 border-r border-[var(--color-border-strong)] px-2 text-[var(--color-amber)] text-left font-normal">
                {row}
              </th>
              {SYMBOLS.map((col, j) => {
                const v = matrix[i][j]
                return (
                  <td
                    key={col}
                    className="text-center text-white"
                    style={{ background: color(v), minWidth: 30, height: 18, padding: 0 }}
                    title={`${row} / ${col} = ${v.toFixed(2)}`}
                  >
                    {v.toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
