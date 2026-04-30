"use client"

import Link from "next/link"
import { Panel } from "@/components/terminal/panel"
import { BLOCK_DEALS, BULK_DEALS } from "@/lib/mock-extra"
import { fmtNum } from "@/lib/format"
import { useState } from "react"

export function BlockDeals({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<"BLOCK" | "BULK">("BLOCK")
  const rows = tab === "BLOCK" ? BLOCK_DEALS : BULK_DEALS
  const Body = (
    <div className="text-[11px]">
      <table className="w-full">
        <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)] sticky top-0">
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-2 py-[2px] font-normal">DATE</th>
            <th className="text-left px-2 font-normal">SYM</th>
            <th className="text-left px-2 font-normal">CLIENT</th>
            <th className="text-left px-2 font-normal">SIDE</th>
            <th className="text-right px-2 font-normal">QTY</th>
            <th className="text-right px-2 font-normal">PRICE</th>
            <th className="text-right px-2 font-normal">VAL (CR)</th>
            <th className="text-left px-2 font-normal">EXCH</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => {
            const val = (d.qty * d.price) / 1e7
            return (
              <tr key={i} className="bb-row border-b border-[var(--color-border)]">
                <td className="px-2 text-[var(--color-mute)]">{d.date}</td>
                <td className="px-2">
                  <Link href={`/stock/${d.symbol}?tab=des`} className="text-[var(--color-amber-bright)] hover:underline font-bold">
                    {d.symbol}
                  </Link>
                </td>
                <td className="px-2 text-white truncate max-w-[200px]">{d.client}</td>
                <td className={`px-2 font-bold ${d.side === "BUY" ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                  {d.side}
                </td>
                <td className="px-2 text-right text-white bb-num">{d.qty.toLocaleString("en-IN")}</td>
                <td className="px-2 text-right text-[var(--color-cyan)] bb-num">{fmtNum(d.price)}</td>
                <td className="px-2 text-right text-[var(--color-amber-bright)] bb-num">{val.toFixed(2)}</td>
                <td className="px-2 text-[var(--color-mute)]">{d.exch}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
  if (embedded) return Body
  return (
    <Panel
      title="BLOCK / BULK DEALS"
      code="BLCK"
      actions={
        <div className="flex">
          {(["BLOCK", "BULK"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2 text-[10px] tracking-widest font-bold ${
                tab === t ? "bg-[var(--color-amber)] text-black" : "text-[var(--color-mute)] hover:text-[var(--color-amber)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      }
    >
      {Body}
    </Panel>
  )
}
