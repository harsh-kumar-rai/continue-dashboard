"use client"

import { useMemo } from "react"
import { Panel } from "@/components/terminal/panel"
import { genDepth } from "@/lib/mock-extra"
import { fmtNum } from "@/lib/format"

export function DepthLadder({ symbol, levels = 10, embedded = false }: { symbol: string; levels?: number; embedded?: boolean }) {
  const book = useMemo(() => genDepth(symbol, levels), [symbol, levels])
  const maxQty = Math.max(...book.bids.map((b) => b.qty), ...book.asks.map((a) => a.qty), 1)
  const totalBidQty = book.bids.reduce((s, b) => s + b.qty, 0)
  const totalAskQty = book.asks.reduce((s, a) => s + a.qty, 0)
  const imbalance = (totalBidQty - totalAskQty) / Math.max(1, totalBidQty + totalAskQty)

  const Body = (
    <div className="text-[11px]">
      <table className="w-full">
        <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-2 py-[2px] font-normal">ORD</th>
            <th className="text-right px-2 font-normal">BID QTY</th>
            <th className="text-right px-2 font-normal">BID</th>
            <th className="text-right px-2 font-normal">ASK</th>
            <th className="text-right px-2 font-normal">ASK QTY</th>
            <th className="text-right px-2 font-normal">ORD</th>
          </tr>
        </thead>
        <tbody>
          {book.bids.map((b, i) => {
            const a = book.asks[i]
            const bidW = (b.qty / maxQty) * 100
            const askW = (a.qty / maxQty) * 100
            return (
              <tr key={i} className="bb-row border-b border-[var(--color-border)]">
                <td className="px-2 text-[var(--color-mute)] bb-num">{b.orders}</td>
                <td className="px-2 text-right text-[var(--color-up)] bb-num relative">
                  <div
                    aria-hidden="true"
                    className="absolute right-0 top-0 h-full bg-[var(--color-up)]/15"
                    style={{ width: `${bidW}%` }}
                  />
                  <span className="relative">{b.qty.toLocaleString("en-IN")}</span>
                </td>
                <td className="px-2 text-right text-[var(--color-up)] bb-num font-bold">{fmtNum(b.price)}</td>
                <td className="px-2 text-right text-[var(--color-down)] bb-num font-bold">{fmtNum(a.price)}</td>
                <td className="px-2 text-right text-[var(--color-down)] bb-num relative">
                  <div
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-full bg-[var(--color-down)]/15"
                    style={{ width: `${askW}%` }}
                  />
                  <span className="relative">{a.qty.toLocaleString("en-IN")}</span>
                </td>
                <td className="px-2 text-right text-[var(--color-mute)] bb-num">{a.orders}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="border-t border-[var(--color-border)] bg-black px-2 py-1 flex items-center justify-between text-[10px]">
        <span className="text-[var(--color-mute)]">
          BID Σ <span className="text-[var(--color-up)] font-bold">{totalBidQty.toLocaleString("en-IN")}</span>
        </span>
        <span className="text-[var(--color-mute)]">
          IMB{" "}
          <span className={imbalance > 0 ? "text-[var(--color-up)]" : imbalance < 0 ? "text-[var(--color-down)]" : "text-[var(--color-mute)]"}>
            {(imbalance * 100).toFixed(1)}%
          </span>
        </span>
        <span className="text-[var(--color-mute)]">
          ASK Σ <span className="text-[var(--color-down)] font-bold">{totalAskQty.toLocaleString("en-IN")}</span>
        </span>
      </div>
    </div>
  )

  if (embedded) return Body
  return (
    <Panel title="DEPTH" code="DEPTH">
      {Body}
    </Panel>
  )
}
