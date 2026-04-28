"use client"

import { useMemo } from "react"
import { genOptionChain } from "@/lib/mock-data"
import { fmtNum, fmtVol } from "@/lib/format"

export function OIHeatmap({ underlying }: { underlying: string }) {
  const chain = useMemo(() => genOptionChain(underlying), [underlying])
  const spot = chain.spot
  const maxOI = Math.max(...chain.rows.flatMap((r) => [r.ce.oi, r.pe.oi]))

  const heat = (oi: number, kind: "C" | "P") => {
    const a = oi / maxOI
    if (kind === "C") return `rgba(255, 23, 68, ${a * 0.5})`
    return `rgba(0, 200, 83, ${a * 0.5})`
  }

  return (
    <div className="overflow-auto h-full text-[11px]">
      <table className="w-full border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-[var(--color-panel-2)]">
          <tr className="text-[10px] text-[var(--color-mute)]">
            <th colSpan={5} className="text-center py-1 text-[var(--color-up)] border-b border-[var(--color-border)]">
              CALLS
            </th>
            <th className="text-center py-1 text-[var(--color-amber)] border-b border-[var(--color-amber-dim)] bg-black">
              STRIKE
            </th>
            <th colSpan={5} className="text-center py-1 text-[var(--color-down)] border-b border-[var(--color-border)]">
              PUTS
            </th>
          </tr>
          <tr className="text-[9px] text-[var(--color-mute)]">
            {["OI", "OI Δ", "VOL", "IV", "LTP"].map((h) => (
              <th key={`c${h}`} className="text-right px-1 font-normal py-0.5 border-b border-[var(--color-border)]">
                {h}
              </th>
            ))}
            <th className="text-center py-0.5 border-b border-[var(--color-amber-dim)]">PRICE</th>
            {["LTP", "IV", "VOL", "OI Δ", "OI"].map((h) => (
              <th key={`p${h}`} className="text-right px-1 font-normal py-0.5 border-b border-[var(--color-border)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chain.rows.map((r) => {
            const isATM = Math.abs(r.strike - spot) < (chain.rows[1].strike - chain.rows[0].strike) / 2
            const ceItm = r.strike < spot
            const peItm = r.strike > spot
            return (
              <tr key={r.strike} className={`bb-row ${isATM ? "bg-[var(--color-amber-dim)]/20" : ""}`}>
                <td className="px-1 text-right bb-num" style={{ background: heat(r.ce.oi, "C") }}>
                  {fmtVol(r.ce.oi)}
                </td>
                <td className={`px-1 text-right bb-num ${r.ce.oiChg >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                  {r.ce.oiChg >= 0 ? "+" : ""}
                  {(r.ce.oiChg / 1000).toFixed(0)}K
                </td>
                <td className="px-1 text-right text-[var(--color-cyan)] bb-num">{fmtVol(r.ce.vol)}</td>
                <td className="px-1 text-right text-[var(--color-mute)] bb-num">{r.ce.iv.toFixed(1)}</td>
                <td className={`px-1 text-right bb-num ${ceItm ? "text-white" : "text-[var(--color-mute)]"}`}>
                  {fmtNum(r.ce.ltp)}
                </td>
                <td className="px-1 text-center font-bold text-[var(--color-amber)] bg-black border-x border-[var(--color-amber-dim)]">
                  {r.strike}
                </td>
                <td className={`px-1 text-right bb-num ${peItm ? "text-white" : "text-[var(--color-mute)]"}`}>
                  {fmtNum(r.pe.ltp)}
                </td>
                <td className="px-1 text-right text-[var(--color-mute)] bb-num">{r.pe.iv.toFixed(1)}</td>
                <td className="px-1 text-right text-[var(--color-cyan)] bb-num">{fmtVol(r.pe.vol)}</td>
                <td className={`px-1 text-right bb-num ${r.pe.oiChg >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                  {r.pe.oiChg >= 0 ? "+" : ""}
                  {(r.pe.oiChg / 1000).toFixed(0)}K
                </td>
                <td className="px-1 text-right bb-num" style={{ background: heat(r.pe.oi, "P") }}>
                  {fmtVol(r.pe.oi)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
