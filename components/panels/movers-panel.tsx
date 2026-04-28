"use client"

import Link from "next/link"
import { Panel } from "@/components/terminal/panel"
import { EQUITIES } from "@/lib/mock-data"
import { fmtNum, fmtPct, fmtVol, dirColor } from "@/lib/format"
import { useMemo, useState } from "react"

type Tab = "GAINERS" | "LOSERS" | "ACTIVE" | "52H" | "52L"

export function MoversPanel() {
  const [tab, setTab] = useState<Tab>("GAINERS")

  const rows = useMemo(() => {
    const list = [...EQUITIES]
    switch (tab) {
      case "GAINERS":
        return list.sort((a, b) => b.ret1d - a.ret1d).slice(0, 12)
      case "LOSERS":
        return list.sort((a, b) => a.ret1d - b.ret1d).slice(0, 12)
      case "ACTIVE":
        return list.sort((a, b) => b.volume * b.price - a.volume * a.price).slice(0, 12)
      case "52H":
        return list.sort((a, b) => b.price / b.high52 - a.price / a.high52).slice(0, 12)
      case "52L":
        return list.sort((a, b) => a.price / a.low52 - b.price / b.low52).slice(0, 12)
    }
  }, [tab])

  return (
    <Panel
      title="MOVERS"
      code="MOST"
      actions={
        <div className="flex">
          {(["GAINERS", "LOSERS", "ACTIVE", "52H", "52L"] as Tab[]).map((t) => (
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
      <table className="w-full text-[11px]">
        <thead className="bg-[var(--color-panel-2)] sticky top-0 text-[10px] text-[var(--color-mute)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-2 py-1 font-normal">SYM</th>
            <th className="text-left px-2 font-normal">SECT</th>
            <th className="text-right px-2 font-normal">LAST</th>
            <th className="text-right px-2 font-normal">%CHG</th>
            <th className="text-right px-2 font-normal">VOL</th>
            <th className="text-right px-2 font-normal">VS 52H</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => {
            const pctOf52H = (e.price / e.high52 - 1) * 100
            return (
              <tr key={e.symbol} className="bb-row border-b border-[var(--color-border)]">
                <td className="px-2 py-[3px]">
                  <Link href={`/stock/${e.symbol}?tab=des`} className="text-[var(--color-amber-bright)] hover:underline font-bold">
                    {e.symbol}
                  </Link>
                </td>
                <td className="px-2 text-[var(--color-mute)] text-[10px]">{e.sector}</td>
                <td className="px-2 text-right text-white bb-num">{fmtNum(e.price)}</td>
                <td className={`px-2 text-right bb-num ${dirColor(e.ret1d)}`}>{fmtPct(e.ret1d)}</td>
                <td className="px-2 text-right text-[var(--color-cyan)] bb-num">{fmtVol(e.volume)}</td>
                <td className={`px-2 text-right bb-num ${dirColor(pctOf52H)}`}>{pctOf52H.toFixed(1)}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Panel>
  )
}
