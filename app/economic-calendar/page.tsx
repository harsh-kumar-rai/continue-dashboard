"use client"

import { useMemo, useState } from "react"
import { PageTitleBar } from "@/components/terminal/shell"
import { Panel, PanelSection } from "@/components/terminal/panel"
import { ECON_EVENTS, IPOS } from "@/lib/mock-extra"
import { CORP_ACTIONS } from "@/lib/mock-data"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"

const REGIONS = ["ALL", "IN", "US", "EU", "JP", "CN", "UK"] as const
const IMPS = [0, 1, 2, 3] as const

function stars(n: 1 | 2 | 3): string {
  return "★".repeat(n) + "☆".repeat(3 - n)
}

export default function EconomicCalendar() {
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("ALL")
  const [minImp, setMinImp] = useState<(typeof IMPS)[number]>(0)

  const filtered = useMemo(() => {
    return ECON_EVENTS.filter((e) => (region === "ALL" || e.region === region) && e.importance >= minImp)
  }, [region, minImp])

  // Group by date
  const grouped = useMemo(() => {
    const m = new Map<string, typeof ECON_EVENTS>()
    for (const e of filtered) {
      const arr = m.get(e.date) ?? []
      arr.push(e)
      m.set(e.date, arr)
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
  }, [filtered])

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar
        title="ECON CALENDAR"
        code="ECO"
        subtitle="MACRO RELEASES // CENTRAL BANKS // DATA"
        right={
          <div className="flex items-center gap-1 px-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-2 py-[2px] text-[10px] font-bold tracking-wider ${
                  region === r ? "bg-[var(--color-amber)] text-black" : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                }`}
              >
                {r}
              </button>
            ))}
            <span className="mx-2 text-[var(--color-mute)] text-[10px]">IMP</span>
            {IMPS.map((i) => (
              <button
                key={i}
                onClick={() => setMinImp(i)}
                className={`px-2 py-[2px] text-[10px] font-bold tracking-wider ${
                  minImp === i ? "bg-[var(--color-amber)] text-black" : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                }`}
              >
                {i === 0 ? "ALL" : "★".repeat(i)}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <RPanel defaultSize={62}>
            <Panel title="MACRO EVENTS" code="ECO">
              <table className="w-full text-[11px]">
                <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)] sticky top-0">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-2 py-1 font-normal">DATE</th>
                    <th className="text-left px-2 font-normal">TIME</th>
                    <th className="text-left px-2 font-normal">REG</th>
                    <th className="text-left px-2 font-normal">IMP</th>
                    <th className="text-left px-2 font-normal">EVENT</th>
                    <th className="text-right px-2 font-normal">PRIOR</th>
                    <th className="text-right px-2 font-normal">FCST</th>
                    <th className="text-right px-2 font-normal">ACTUAL</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.flatMap(([date, evs]) => [
                    <tr key={`hdr-${date}`}>
                      <td colSpan={8} className="px-2 py-[3px] bg-black text-[10px] tracking-widest text-[var(--color-amber-bright)] border-b border-[var(--color-amber-dim)] sticky top-[22px]">
                        {date} — {evs.length} EVENT{evs.length === 1 ? "" : "S"}
                      </td>
                    </tr>,
                    ...evs.map((e, i) => (
                      <tr key={`${date}-${i}`} className="bb-row border-b border-[var(--color-border)]">
                        <td className="px-2 py-[3px] text-[var(--color-mute)] text-[10px]">{e.date}</td>
                        <td className="px-2 text-[var(--color-amber)] bb-num">{e.time}</td>
                        <td className="px-2 text-[var(--color-cyan)] font-bold">{e.region}</td>
                        <td className="px-2 text-[var(--color-yellow)] font-bold">{stars(e.importance)}</td>
                        <td className="px-2 text-white">{e.event}</td>
                        <td className="px-2 text-right text-[var(--color-mute)] bb-num">{e.prior ?? "—"}</td>
                        <td className="px-2 text-right text-[var(--color-amber-bright)] bb-num">{e.forecast ?? "—"}</td>
                        <td className="px-2 text-right text-white bb-num font-bold">{e.actual ?? "—"}</td>
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={38}>
            <PanelGroup direction="vertical">
              <RPanel defaultSize={50}>
                <Panel title="IPO CALENDAR" code="IPO">
                  <table className="w-full text-[11px]">
                    <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)] sticky top-0">
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="text-left px-2 py-1 font-normal">SYM</th>
                        <th className="text-left px-2 font-normal">NAME</th>
                        <th className="text-left px-2 font-normal">OPEN</th>
                        <th className="text-left px-2 font-normal">CLOSE</th>
                        <th className="text-right px-2 font-normal">BAND</th>
                        <th className="text-right px-2 font-normal">SIZE</th>
                        <th className="text-right px-2 font-normal">GMP</th>
                        <th className="text-left px-2 font-normal">STAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {IPOS.map((ipo) => (
                        <tr key={ipo.symbol} className="bb-row border-b border-[var(--color-border)]">
                          <td className="px-2 text-[var(--color-amber-bright)] font-bold">{ipo.symbol}</td>
                          <td className="px-2 text-white truncate max-w-[180px]">{ipo.name}</td>
                          <td className="px-2 text-[var(--color-mute)] text-[10px]">{ipo.open}</td>
                          <td className="px-2 text-[var(--color-mute)] text-[10px]">{ipo.close}</td>
                          <td className="px-2 text-right text-[var(--color-cyan)] bb-num">{ipo.priceBand}</td>
                          <td className="px-2 text-right text-white bb-num">{ipo.size}</td>
                          <td className="px-2 text-right text-[var(--color-up)] bb-num">+{ipo.gmp}</td>
                          <td className="px-2">
                            <span className={`px-1 text-[9px] font-bold ${
                              ipo.status === "OPEN" ? "bg-[var(--color-up)] text-black" :
                              ipo.status === "UPCOMING" ? "bg-[var(--color-amber)] text-black" :
                              "bg-[var(--color-mute)] text-black"
                            }`}>{ipo.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              </RPanel>
              <PanelResizeHandle className="h-px" />
              <RPanel defaultSize={50}>
                <Panel title="CORPORATE ACTIONS" code="CACS">
                  <PanelSection label="UPCOMING EX-DATES">
                    <table className="w-full text-[11px]">
                      <thead className="text-[10px] text-[var(--color-mute)]">
                        <tr className="border-b border-[var(--color-border)]">
                          <th className="text-left px-2 py-[2px] font-normal">EX-DATE</th>
                          <th className="text-left px-2 font-normal">SYM</th>
                          <th className="text-left px-2 font-normal">TYPE</th>
                          <th className="text-left px-2 font-normal">DETAIL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CORP_ACTIONS.map((c, i) => (
                          <tr key={i} className="bb-row border-b border-[var(--color-border)]">
                            <td className="px-2 text-[var(--color-amber-bright)] font-bold">{c.exDate}</td>
                            <td className="px-2 text-[var(--color-cyan)] font-bold">{c.symbol}</td>
                            <td className="px-2 text-[var(--color-yellow)]">{c.type}</td>
                            <td className="px-2 text-white">{c.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </PanelSection>
                </Panel>
              </RPanel>
            </PanelGroup>
          </RPanel>
        </PanelGroup>
      </div>
    </div>
  )
}
