"use client"

import { useMemo } from "react"
import { hashCode } from "@/lib/mock-data"

const SYMBOLS = ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC", "SBIN", "LT", "ICICIBANK", "BAJFIN", "MARUTI"]

function corr(a: string, b: string): number {
  if (a === b) return 1
  const seed = hashCode(a + b) + hashCode(b + a)
  // bias by sector similarity
  const bankPair = ["HDFCBANK", "ICICIBANK", "SBIN", "BANKNIFTY", "BAJFIN"]
  const itPair = ["TCS", "INFY"]
  let base = ((seed % 200) - 100) / 100 // -1..1
  if (bankPair.includes(a) && bankPair.includes(b)) base = 0.55 + (Math.abs(seed % 30)) / 100
  if (itPair.includes(a) && itPair.includes(b)) base = 0.78 + (Math.abs(seed % 15)) / 100
  return Math.max(-0.95, Math.min(0.99, base))
}

function color(v: number): string {
  if (v >= 0) {
    const a = Math.min(1, v)
    return `rgba(0, 200, 80, ${a * 0.85})`
  }
  const a = Math.min(1, -v)
  return `rgba(255, 76, 76, ${a * 0.85})`
}

export function CorrelationMatrix() {
  const matrix = useMemo(
    () => SYMBOLS.map((a) => SYMBOLS.map((b) => corr(a, b))),
    [],
  )

  return (
    <div className="p-2 overflow-auto h-full">
      <table className="text-[10px] font-mono border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="bg-panel-alt sticky left-0 z-10 border-b border-r border-border-strong p-1"></th>
            {SYMBOLS.map((s) => (
              <th key={s} className="bg-panel-alt border-b border-border-strong px-1 py-1 text-amber" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((row, i) => (
            <tr key={row}>
              <th className="bg-panel-alt sticky left-0 z-10 border-r border-border-strong px-2 py-1 text-amber text-left">
                {row}
              </th>
              {SYMBOLS.map((col, j) => {
                const v = matrix[i][j]
                return (
                  <td
                    key={col}
                    className="border-r border-b border-border text-center"
                    style={{ background: color(v), minWidth: 36, height: 22 }}
                    title={`${row} / ${col} = ${v.toFixed(2)}`}
                  >
                    <span className={Math.abs(v) > 0.5 ? "text-bg font-bold" : "text-fg"}>
                      {v.toFixed(2)}
                    </span>
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
