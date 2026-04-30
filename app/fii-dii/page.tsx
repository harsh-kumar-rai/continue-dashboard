"use client"

import { useMemo, useState } from "react"
import { PageTitleBar } from "@/components/terminal/shell"
import { Panel, KV, PanelSection } from "@/components/terminal/panel"
import { FLOW_HISTORY } from "@/lib/mock-extra"
import { fmtNum } from "@/lib/format"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"

type Range = "5D" | "1M" | "3M"

export default function FiiDiiPage() {
  const [range, setRange] = useState<Range>("1M")
  const days = range === "5D" ? 5 : range === "1M" ? 22 : 66

  const series = useMemo(() => FLOW_HISTORY.slice(0, days).slice().reverse(), [days])

  const totals = useMemo(() => {
    const fiiCash = series.reduce((s, d) => s + d.fiiCash, 0)
    const diiCash = series.reduce((s, d) => s + d.diiCash, 0)
    const fiiIdxFut = series.reduce((s, d) => s + d.fiiIdxFut, 0)
    const fiiIdxOpt = series.reduce((s, d) => s + d.fiiIdxOpt, 0)
    const fiiStkFut = series.reduce((s, d) => s + d.fiiStkFut, 0)
    const fiiStkOpt = series.reduce((s, d) => s + d.fiiStkOpt, 0)
    return { fiiCash, diiCash, fiiIdxFut, fiiIdxOpt, fiiStkFut, fiiStkOpt }
  }, [series])

  const cashMaxAbs = Math.max(...series.flatMap((s) => [Math.abs(s.fiiCash), Math.abs(s.diiCash)]), 1)

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar
        title="FII / DII ACTIVITY"
        code="FII"
        subtitle="CASH + F&O FLOWS"
        right={
          <div className="flex items-center gap-1 px-2">
            {(["5D", "1M", "3M"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-[2px] text-[10px] font-bold tracking-wider ${
                  range === r ? "bg-[var(--color-amber)] text-black" : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <RPanel defaultSize={24}>
            <Panel title={`CUMULATIVE — ${range}`} code="SUM">
              <PanelSection label="CASH (INR CR)">
                <KV k="FII NET" v={fmtNum(totals.fiiCash, 0)} color={totals.fiiCash >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"} />
                <KV k="DII NET" v={fmtNum(totals.diiCash, 0)} color={totals.diiCash >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"} />
                <KV k="NET (FII+DII)" v={fmtNum(totals.fiiCash + totals.diiCash, 0)} color={(totals.fiiCash + totals.diiCash) >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"} />
              </PanelSection>
              <PanelSection label="FII F&O (INR CR)">
                <KV k="INDEX FUT" v={fmtNum(totals.fiiIdxFut, 0)} color={totals.fiiIdxFut >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"} />
                <KV k="INDEX OPT" v={fmtNum(totals.fiiIdxOpt, 0)} color={totals.fiiIdxOpt >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"} />
                <KV k="STOCK FUT" v={fmtNum(totals.fiiStkFut, 0)} color={totals.fiiStkFut >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"} />
                <KV k="STOCK OPT" v={fmtNum(totals.fiiStkOpt, 0)} color={totals.fiiStkOpt >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"} />
              </PanelSection>
              <PanelSection label="STREAK">
                <KV k="FII NET DAYS +" v={String(series.filter((d) => d.fiiCash > 0).length)} />
                <KV k="DII NET DAYS +" v={String(series.filter((d) => d.diiCash > 0).length)} />
              </PanelSection>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={48}>
            <Panel title="DAILY CASH FLOW (FII vs DII)" code="CASH">
              <div className="p-2">
                <svg viewBox={`0 0 ${series.length * 16 + 50} 240`} className="w-full" role="img" aria-label="FII DII bar chart">
                  {/* zero line */}
                  <line x1={40} x2={series.length * 16 + 40} y1={120} y2={120} stroke="#2a2a2a" />
                  {/* axis label */}
                  <text x={4} y={20} fontSize="9" fill="#808080">+CR</text>
                  <text x={4} y={228} fontSize="9" fill="#808080">-CR</text>
                  {series.map((d, i) => {
                    const x = 40 + i * 16
                    const fiiH = (d.fiiCash / cashMaxAbs) * 100
                    const diiH = (d.diiCash / cashMaxAbs) * 100
                    return (
                      <g key={d.date}>
                        <rect
                          x={x + 2}
                          y={fiiH >= 0 ? 120 - fiiH : 120}
                          width={6}
                          height={Math.abs(fiiH)}
                          fill={fiiH >= 0 ? "#00c853" : "#ff1744"}
                        />
                        <rect
                          x={x + 9}
                          y={diiH >= 0 ? 120 - diiH : 120}
                          width={6}
                          height={Math.abs(diiH)}
                          fill={diiH >= 0 ? "#00e5ff" : "#ff4081"}
                        />
                      </g>
                    )
                  })}
                </svg>
                <div className="flex items-center gap-3 px-2 text-[10px] text-[var(--color-mute)]">
                  <span><span className="inline-block w-3 h-2 bg-[var(--color-up)] mr-1" />FII +</span>
                  <span><span className="inline-block w-3 h-2 bg-[var(--color-down)] mr-1" />FII −</span>
                  <span><span className="inline-block w-3 h-2 bg-[var(--color-cyan)] mr-1" />DII +</span>
                  <span><span className="inline-block w-3 h-2 bg-[var(--color-magenta)] mr-1" />DII −</span>
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] max-h-[260px] overflow-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)] sticky top-0">
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left px-2 py-1 font-normal">DATE</th>
                      <th className="text-right px-2 font-normal">FII CASH</th>
                      <th className="text-right px-2 font-normal">DII CASH</th>
                      <th className="text-right px-2 font-normal">NET</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.slice().reverse().map((d) => (
                      <tr key={d.date} className="bb-row border-b border-[var(--color-border)]">
                        <td className="px-2 text-[var(--color-mute)] text-[10px]">{d.date}</td>
                        <td className={`px-2 text-right bb-num ${d.fiiCash >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>{fmtNum(d.fiiCash, 0)}</td>
                        <td className={`px-2 text-right bb-num ${d.diiCash >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>{fmtNum(d.diiCash, 0)}</td>
                        <td className={`px-2 text-right bb-num font-bold ${(d.fiiCash + d.diiCash) >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>{fmtNum(d.fiiCash + d.diiCash, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={28}>
            <Panel title="FII F&O DAILY" code="F&O">
              <table className="w-full text-[11px]">
                <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)] sticky top-0">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-2 py-1 font-normal">DATE</th>
                    <th className="text-right px-2 font-normal">IDX FUT</th>
                    <th className="text-right px-2 font-normal">IDX OPT</th>
                    <th className="text-right px-2 font-normal">STK FUT</th>
                    <th className="text-right px-2 font-normal">STK OPT</th>
                  </tr>
                </thead>
                <tbody>
                  {series.slice().reverse().map((d) => (
                    <tr key={d.date} className="bb-row border-b border-[var(--color-border)]">
                      <td className="px-2 text-[var(--color-mute)] text-[10px]">{d.date}</td>
                      <td className={`px-2 text-right bb-num ${d.fiiIdxFut >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>{fmtNum(d.fiiIdxFut, 0)}</td>
                      <td className={`px-2 text-right bb-num ${d.fiiIdxOpt >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>{fmtNum(d.fiiIdxOpt, 0)}</td>
                      <td className={`px-2 text-right bb-num ${d.fiiStkFut >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>{fmtNum(d.fiiStkFut, 0)}</td>
                      <td className={`px-2 text-right bb-num ${d.fiiStkOpt >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>{fmtNum(d.fiiStkOpt, 0)}</td>
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
