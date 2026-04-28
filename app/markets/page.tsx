"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { PageTitleBar } from "@/components/terminal/shell"
import { Panel } from "@/components/terminal/panel"
import { Treemap } from "@/components/charts/treemap"
import { IndicesPanel } from "@/components/panels/indices-panel"
import { EQUITIES, sectorAggregates } from "@/lib/mock-data"
import { fmtNum, fmtPct, fmtVol, dirColor } from "@/lib/format"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"
import type { Sector } from "@/lib/types"

type SortKey = "symbol" | "price" | "ret1d" | "ret5d" | "ret1m" | "ret1y" | "volume" | "mcap" | "pe"

export default function MarketsPage() {
  const [sector, setSector] = useState<Sector | "ALL">("ALL")
  const [sortKey, setSortKey] = useState<SortKey>("mcap")
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  const filtered = useMemo(() => {
    const list = sector === "ALL" ? EQUITIES : EQUITIES.filter((e) => e.sector === sector)
    return [...list].sort((a, b) => ((a[sortKey] as number) - (b[sortKey] as number)) * sortDir)
  }, [sector, sortKey, sortDir])

  const sectors = sectorAggregates().sort((a, b) => b.mcap - a.mcap)

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1))
    else {
      setSortKey(k)
      setSortDir(-1)
    }
  }

  const treeItems = useMemo(
    () =>
      filtered.map((e) => ({
        id: e.symbol,
        label: e.symbol,
        sublabel: e.name,
        weight: e.mcap,
        value: e.ret1d,
        href: `/stock/${e.symbol}?tab=des`,
      })),
    [filtered],
  )

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar title="MARKETS" code="MKTS" subtitle="EQUITIES // SECTORS // INDICES" />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <RPanel defaultSize={28} minSize={15}>
            <IndicesPanel />
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={45}>
            <PanelGroup direction="vertical">
              <RPanel defaultSize={35}>
                <Panel title="SECTOR HEAT" code="SECT">
                  <div className="w-full h-full p-px">
                    <Treemap
                      items={sectors.map((s) => ({
                        id: s.sector,
                        label: s.sector,
                        weight: s.mcap,
                        value: s.avgRet1d,
                      }))}
                    />
                  </div>
                </Panel>
              </RPanel>
              <PanelResizeHandle className="h-px" />
              <RPanel defaultSize={65}>
                <Panel title="EQUITY HEAT" code="IMAP">
                  <div className="w-full h-full p-px">
                    <Treemap items={treeItems} />
                  </div>
                </Panel>
              </RPanel>
            </PanelGroup>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={27} minSize={20}>
            <Panel
              title="EQUITIES"
              code="EQS"
              actions={
                <div className="flex items-center gap-1">
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value as Sector | "ALL")}
                    className="bg-black border border-[var(--color-amber-dim)] text-[10px] text-[var(--color-amber)] px-1 py-0 outline-none"
                  >
                    <option value="ALL">ALL SECTORS</option>
                    {Array.from(new Set(EQUITIES.map((e) => e.sector))).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              }
            >
              <table className="w-full text-[11px]">
                <thead className="bg-[var(--color-panel-2)] sticky top-0 text-[10px] text-[var(--color-mute)]">
                  <tr className="border-b border-[var(--color-border)]">
                    {(
                      [
                        ["symbol", "SYM"],
                        ["price", "LAST"],
                        ["ret1d", "%CHG"],
                        ["volume", "VOL"],
                        ["mcap", "MCAP"],
                      ] as Array<[SortKey, string]>
                    ).map(([k, l]) => (
                      <th
                        key={k}
                        onClick={() => toggleSort(k)}
                        className={`px-2 py-1 cursor-pointer text-right font-normal ${k === "symbol" ? "text-left" : ""} hover:text-[var(--color-amber)]`}
                      >
                        {l}
                        {sortKey === k && (sortDir === 1 ? " ▲" : " ▼")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.symbol} className="bb-row border-b border-[var(--color-border)]">
                      <td className="px-2 py-[3px]">
                        <Link
                          href={`/stock/${e.symbol}?tab=des`}
                          className="text-[var(--color-amber-bright)] hover:underline font-bold"
                        >
                          {e.symbol}
                        </Link>
                      </td>
                      <td className="px-2 text-right text-white bb-num">{fmtNum(e.price)}</td>
                      <td className={`px-2 text-right bb-num ${dirColor(e.ret1d)}`}>{fmtPct(e.ret1d)}</td>
                      <td className="px-2 text-right text-[var(--color-cyan)] bb-num">{fmtVol(e.volume)}</td>
                      <td className="px-2 text-right text-[var(--color-amber-bright)] bb-num">
                        {(e.mcap / 1000).toFixed(1)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </RPanel>
        </PanelGroup>
      </div>
    </div>
  )
}
