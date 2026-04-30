"use client"

import { useMemo } from "react"
import { Panel } from "@/components/terminal/panel"
import { genTape } from "@/lib/mock-extra"
import { fmtNum, fmtTime } from "@/lib/format"

export function TimeSales({ symbol, n = 50, embedded = false }: { symbol: string; n?: number; embedded?: boolean }) {
  const tape = useMemo(() => genTape(symbol, n), [symbol, n])
  const Body = (
    <div className="text-[11px]">
      <table className="w-full">
        <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)] sticky top-0">
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-2 py-[2px] font-normal">TIME</th>
            <th className="text-right px-2 font-normal">PRICE</th>
            <th className="text-right px-2 font-normal">QTY</th>
            <th className="text-right px-2 font-normal">SIDE</th>
          </tr>
        </thead>
        <tbody>
          {tape.map((t, i) => (
            <tr key={i} className="bb-row border-b border-[var(--color-border)]">
              <td className="px-2 text-[var(--color-mute)] bb-num">{fmtTime(t.t)}</td>
              <td
                className={`px-2 text-right bb-num font-bold ${
                  t.side === "BUY"
                    ? "text-[var(--color-up)]"
                    : t.side === "SELL"
                      ? "text-[var(--color-down)]"
                      : "text-[var(--color-amber)]"
                }`}
              >
                {fmtNum(t.price)}
              </td>
              <td className="px-2 text-right text-white bb-num">{t.qty.toLocaleString("en-IN")}</td>
              <td
                className={`px-2 text-right text-[10px] tracking-widest font-bold ${
                  t.side === "BUY"
                    ? "text-[var(--color-up)]"
                    : t.side === "SELL"
                      ? "text-[var(--color-down)]"
                      : "text-[var(--color-mute)]"
                }`}
              >
                {t.side}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
  if (embedded) return Body
  return (
    <Panel title="TIME &amp; SALES" code="T&amp;S">
      {Body}
    </Panel>
  )
}
