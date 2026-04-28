"use client"

import { MACRO } from "@/lib/mock-data"
import { fmtNum, dirColor, arrow } from "@/lib/format"

const KEYS = ["USD/INR", "10Y G-SEC", "BRENT CRUDE", "GOLD MCX", "FII NET (CASH)", "DII NET (CASH)", "INDIA VIX" as never]

export function StatusBar() {
  return (
    <div className="bb-chrome flex items-stretch border-t border-[var(--color-amber)] bg-[var(--color-panel)] h-[20px] text-[10px] overflow-hidden">
      <div className="flex items-center px-2 bg-[var(--color-amber)] text-black font-bold">STATUS</div>
      <div className="flex-1 flex items-center gap-3 px-2 overflow-x-auto whitespace-nowrap">
        {MACRO.filter((m) => KEYS.includes(m.label as never)).map((m) => (
          <div key={m.label} className="flex items-center gap-1">
            <span className="text-[var(--color-mute)]">{m.label}</span>
            <span className="text-[var(--color-white)]">
              {fmtNum(m.value, m.value > 1000 ? 1 : 2)}
              {m.unit && m.unit !== "%" ? ` ${m.unit}` : m.unit}
            </span>
            <span className={dirColor(m.change)}>
              {arrow(m.change)} {Math.abs(m.change).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center px-2 border-l border-[var(--color-border)] text-[var(--color-mute)]">
        MKT <span className="text-[var(--color-up)] mx-1">●</span> OPEN
      </div>
      <div className="flex items-center px-2 border-l border-[var(--color-border)] text-[var(--color-mute)]">
        DATA: SIMULATED
      </div>
      <div className="flex items-center px-2 border-l border-[var(--color-border)] text-[var(--color-mute)]">
        v1.0.0
      </div>
    </div>
  )
}
