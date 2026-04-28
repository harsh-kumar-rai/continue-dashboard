"use client"

import Link from "next/link"
import { Panel } from "@/components/terminal/panel"
import { Sparkline } from "@/components/charts/sparkline"
import { INDICES, genOHLC } from "@/lib/mock-data"
import { fmtNum, fmtPct, dirColor, arrow } from "@/lib/format"
import { useMemo } from "react"

export function IndicesPanel() {
  const rows = useMemo(
    () =>
      INDICES.map((i) => ({
        ...i,
        spark: genOHLC(i.symbol, 60).map((b) => b.c),
      })),
    [],
  )
  return (
    <Panel title="INDICES" code="WEI">
      <table className="w-full text-[11px]">
        <thead className="bg-[var(--color-panel-2)] sticky top-0 text-[10px] text-[var(--color-mute)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-2 py-1 font-normal">SYMBOL</th>
            <th className="text-right px-2 font-normal">LAST</th>
            <th className="text-right px-2 font-normal">CHG</th>
            <th className="text-right px-2 font-normal">%CHG</th>
            <th className="text-right px-2 font-normal">5D</th>
            <th className="text-right px-2 font-normal">1M</th>
            <th className="text-right px-2 font-normal">YTD</th>
            <th className="text-right px-2 font-normal">1Y</th>
            <th className="text-right px-2 font-normal">60D</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => {
            const chg = i.value - i.prevClose
            return (
              <tr key={i.symbol} className="bb-row border-b border-[var(--color-border)]">
                <td className="px-2 py-[3px]">
                  <Link href={`/index/${i.symbol}?tab=chart`} className="text-[var(--color-amber-bright)] hover:underline font-bold">
                    {i.symbol}
                  </Link>
                  <div className="text-[9px] text-[var(--color-mute)]">{i.name}</div>
                </td>
                <td className="px-2 text-right text-white bb-num">{fmtNum(i.value)}</td>
                <td className={`px-2 text-right bb-num ${dirColor(chg)}`}>
                  {arrow(chg)} {fmtNum(Math.abs(chg))}
                </td>
                <td className={`px-2 text-right bb-num ${dirColor(i.ret1d)}`}>{fmtPct(i.ret1d)}</td>
                <td className={`px-2 text-right bb-num ${dirColor(i.ret5d)}`}>{fmtPct(i.ret5d)}</td>
                <td className={`px-2 text-right bb-num ${dirColor(i.ret1m)}`}>{fmtPct(i.ret1m)}</td>
                <td className={`px-2 text-right bb-num ${dirColor(i.retYtd)}`}>{fmtPct(i.retYtd)}</td>
                <td className={`px-2 text-right bb-num ${dirColor(i.ret1y)}`}>{fmtPct(i.ret1y)}</td>
                <td className="px-2 text-right">
                  <Sparkline data={i.spark} width={70} height={14} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Panel>
  )
}
