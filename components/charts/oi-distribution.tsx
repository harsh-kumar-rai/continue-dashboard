"use client"

import { useMemo } from "react"
import { genOptionChain } from "@/lib/mock-data"
import { fmtVol } from "@/lib/format"

// Pure-tabular OI distribution: numeric values, no inline horizontal bars.
// Real Bloomberg option monitors render OI as raw numbers — charting is invoked
// via a discrete OIM/SKEW command, never embedded in the grid.
export function OIDistribution({ underlying }: { underlying: string }) {
  const chain = useMemo(() => genOptionChain(underlying), [underlying])
  const max = Math.max(...chain.rows.flatMap((r) => [r.ce.oi, r.pe.oi]))

  return (
    <div className="h-full overflow-auto bg-black">
      <table className="w-full text-[10px] bb-num">
        <thead className="sticky top-0 bg-[var(--color-panel-2)] text-[var(--color-mute)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-right px-2 py-1 font-normal text-[var(--color-down)]">CE OI</th>
            <th className="text-right px-2 py-1 font-normal text-[var(--color-down)]">CE %</th>
            <th className="text-center px-2 py-1 font-normal text-[var(--color-amber)]">STRIKE</th>
            <th className="text-right px-2 py-1 font-normal text-[var(--color-up)]">PE %</th>
            <th className="text-right px-2 py-1 font-normal text-[var(--color-up)]">PE OI</th>
          </tr>
        </thead>
        <tbody>
          {chain.rows.map((r) => {
            const atm = Math.abs(r.strike - chain.spot) < 50
            const cPct = (r.ce.oi / max) * 100
            const pPct = (r.pe.oi / max) * 100
            return (
              <tr
                key={r.strike}
                className={`bb-row border-b border-[var(--color-border)] ${
                  atm ? "bg-[var(--color-amber-dim)]/20" : ""
                }`}
              >
                <td className="px-2 text-right text-[var(--color-down)]">{fmtVol(r.ce.oi)}</td>
                <td className="px-2 text-right text-[var(--color-mute)]">{cPct.toFixed(0)}</td>
                <td
                  className={`px-2 text-center font-bold ${
                    atm ? "text-[var(--color-amber-bright)]" : "text-[var(--color-amber)]"
                  }`}
                >
                  {r.strike}
                </td>
                <td className="px-2 text-right text-[var(--color-mute)]">{pPct.toFixed(0)}</td>
                <td className="px-2 text-right text-[var(--color-up)]">{fmtVol(r.pe.oi)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
