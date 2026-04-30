"use client"

import { useMemo, useState } from "react"
import { PageTitleBar } from "@/components/terminal/shell"
import { Treemap } from "@/components/charts/treemap"
import { Panel } from "@/components/terminal/panel"
import { EQUITIES, sectorAggregates } from "@/lib/mock-data"
import { HEATMAP_METRICS } from "@/lib/mock-extra"
import type { Sector } from "@/lib/types"

type MetricId = (typeof HEATMAP_METRICS)[number]["id"]
type Mode = "STOCKS" | "SECTORS"

export default function HeatmapPage() {
  const [metric, setMetric] = useState<MetricId>("ret1d")
  const [mode, setMode] = useState<Mode>("STOCKS")
  const [sector, setSector] = useState<Sector | "ALL">("ALL")

  const items = useMemo(() => {
    if (mode === "SECTORS") {
      return sectorAggregates().map((s) => ({
        id: s.sector,
        label: s.sector,
        weight: s.mcap,
        value: s.avgRet1d, // sectors only have ret1d aggregate; reuse for any metric
      }))
    }
    const list = sector === "ALL" ? EQUITIES : EQUITIES.filter((e) => e.sector === sector)
    return list.map((e) => ({
      id: e.symbol,
      label: e.symbol,
      sublabel: e.name,
      weight: e.mcap,
      value: e[metric] as number,
      href: `/stock/${e.symbol}?tab=des`,
    }))
  }, [mode, metric, sector])

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar
        title="HEATMAP"
        code="HMAP"
        subtitle="MARKET-CAP WEIGHTED // COLOR = RETURN"
        right={
          <div className="flex items-center gap-1 px-2">
            <span className="text-[10px] text-[var(--color-mute)]">VIEW</span>
            {(["STOCKS", "SECTORS"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2 py-[2px] text-[10px] font-bold tracking-wider ${
                  mode === m ? "bg-[var(--color-amber)] text-black" : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                }`}
              >
                {m}
              </button>
            ))}
            <span className="mx-2 text-[10px] text-[var(--color-mute)]">METRIC</span>
            {HEATMAP_METRICS.map((mt) => (
              <button
                key={mt.id}
                onClick={() => setMetric(mt.id)}
                disabled={mode === "SECTORS"}
                className={`px-2 py-[2px] text-[10px] font-bold tracking-wider disabled:opacity-40 ${
                  metric === mt.id ? "bg-[var(--color-amber)] text-black" : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                }`}
              >
                {mt.label}
              </button>
            ))}
            {mode === "STOCKS" && (
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as Sector | "ALL")}
                className="ml-2 bg-black border border-[var(--color-amber-dim)] text-[10px] text-[var(--color-amber)] px-2 py-[2px] outline-none uppercase"
              >
                <option value="ALL">ALL SECTORS</option>
                {Array.from(new Set(EQUITIES.map((e) => e.sector))).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      />
      <div className="flex-1 overflow-hidden p-px">
        <Panel title={mode === "SECTORS" ? "SECTOR HEATMAP" : `EQUITY HEATMAP — ${HEATMAP_METRICS.find((m) => m.id === metric)?.label}`} code="IMAP">
          <div className="w-full h-full p-px">
            <Treemap items={items} />
          </div>
        </Panel>
      </div>
    </div>
  )
}
