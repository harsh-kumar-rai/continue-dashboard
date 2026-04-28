"use client"

import { useMemo } from "react"
import { genOptionChain } from "@/lib/mock-data"

export function OIDistribution({ underlying }: { underlying: string }) {
  const chain = useMemo(() => genOptionChain(underlying), [underlying])
  const max = Math.max(...chain.rows.flatMap((r) => [r.ce.oi, r.pe.oi]))

  return (
    <div className="p-2 h-full overflow-auto bg-black">
      <div className="text-[10px] flex justify-between px-2 pb-2 text-[var(--color-mute)]">
        <span className="text-[var(--color-down)]">CE OI →</span>
        <span className="text-[var(--color-amber)]">STRIKE</span>
        <span className="text-[var(--color-up)]">← PE OI</span>
      </div>
      {chain.rows.map((r) => {
        const cPct = (r.ce.oi / max) * 100
        const pPct = (r.pe.oi / max) * 100
        const atm = Math.abs(r.strike - chain.spot) < 50
        return (
          <div
            key={r.strike}
            className={`flex items-center gap-1 h-3 mb-px text-[10px] bb-num ${atm ? "bg-[var(--color-amber-dim)]/20" : ""}`}
          >
            <div className="flex-1 flex justify-end">
              <div className="bg-[var(--color-down)]/70 h-full" style={{ width: `${cPct}%` }} />
            </div>
            <div className="w-14 text-center text-[var(--color-amber)]">{r.strike}</div>
            <div className="flex-1">
              <div className="bg-[var(--color-up)]/70 h-full" style={{ width: `${pPct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
