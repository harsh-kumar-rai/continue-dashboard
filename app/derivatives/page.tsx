"use client"

import { useMemo, useState } from "react"
import { Panel, KV, PanelSection } from "@/components/terminal/panel"
import { PageTitleBar } from "@/components/terminal/shell"
import { OIHeatmap } from "@/components/charts/oi-heatmap"
import { OIDistribution } from "@/components/charts/oi-distribution"
import { genOptionChain, INDICES } from "@/lib/mock-data"
import { fmtNum, fmtVol, dirColor } from "@/lib/format"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"

const UNDERLYINGS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"] as const

export default function DerivativesPage() {
  const [under, setUnder] = useState<string>("NIFTY")
  const chain = useMemo(() => genOptionChain(under), [under])
  const idx = INDICES.find((i) => i.symbol === under)!

  // Aggregate metrics
  const totCallOI = chain.rows.reduce((s, r) => s + r.ce.oi, 0)
  const totPutOI = chain.rows.reduce((s, r) => s + r.pe.oi, 0)
  const callOIChg = chain.rows.reduce((s, r) => s + r.ce.oiChg, 0)
  const putOIChg = chain.rows.reduce((s, r) => s + r.pe.oiChg, 0)
  const pcr = totPutOI / Math.max(1, totCallOI)
  // Max pain: strike with min total payout (gross OI weighted)
  const maxPain = useMemo(() => {
    let best = chain.rows[0].strike
    let bestVal = Infinity
    for (const candidate of chain.rows) {
      let pain = 0
      for (const r of chain.rows) {
        if (r.strike < candidate.strike) pain += (candidate.strike - r.strike) * r.ce.oi
        if (r.strike > candidate.strike) pain += (r.strike - candidate.strike) * r.pe.oi
      }
      if (pain < bestVal) {
        bestVal = pain
        best = candidate.strike
      }
    }
    return best
  }, [chain])

  // ATM IV
  const atmRow = chain.rows.find((r) => Math.abs(r.strike - chain.spot) < 60)!
  const atmIV = (atmRow.ce.iv + atmRow.pe.iv) / 2

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar
        title="DERIVATIVES"
        code="OMON"
        subtitle="OPTIONS MONITOR // INDEX & STOCK F&O"
        right={
          <div className="flex items-center pr-2 gap-1">
            {UNDERLYINGS.map((u) => (
              <button
                key={u}
                onClick={() => setUnder(u)}
                className={`px-2 py-[2px] text-[10px] font-bold tracking-wider ${
                  under === u
                    ? "bg-[var(--color-amber)] text-black"
                    : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <RPanel defaultSize={20} minSize={15}>
            <Panel title="UNDERLYING" code="DES">
              <PanelSection label="SPOT">
                <KV k="LAST" v={fmtNum(chain.spot)} color="text-white" />
                <KV k="CHG %" v={(idx.ret1d * 100).toFixed(2) + "%"} color={dirColor(idx.ret1d)} />
                <KV k="EXPIRY" v={chain.expiry} color="text-[var(--color-amber-bright)]" />
                <KV k="DAYS TO EXP" v={String(Math.max(0, Math.ceil((new Date(chain.expiry).getTime() - Date.now()) / 86400000)))} />
              </PanelSection>
              <PanelSection label="OI ANALYTICS">
                <KV k="TOTAL CE OI" v={fmtVol(totCallOI)} color="text-[var(--color-down)]" />
                <KV k="TOTAL PE OI" v={fmtVol(totPutOI)} color="text-[var(--color-up)]" />
                <KV k="PCR (OI)" v={pcr.toFixed(3)} color={pcr > 1 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"} />
                <KV
                  k="CE OI Δ"
                  v={`${callOIChg >= 0 ? "+" : ""}${fmtVol(Math.abs(callOIChg))}`}
                  color={dirColor(-callOIChg)}
                />
                <KV
                  k="PE OI Δ"
                  v={`${putOIChg >= 0 ? "+" : ""}${fmtVol(Math.abs(putOIChg))}`}
                  color={dirColor(putOIChg)}
                />
                <KV k="MAX PAIN" v={String(maxPain)} color="text-[var(--color-amber)]" />
              </PanelSection>
              <PanelSection label="VOLATILITY">
                <KV k="ATM IV" v={`${atmIV.toFixed(2)}%`} color="text-[var(--color-amber-bright)]" />
                <KV k="IV RANK" v="42" />
                <KV k="IV PCT" v="38" />
                <KV k="INDIA VIX" v={fmtNum(INDICES.find((i) => i.symbol === "INDIAVIX")?.value ?? 0)} />
              </PanelSection>
              <PanelSection label="GREEKS — ATM">
                <KV k="DELTA C" v={atmRow.ce.delta.toFixed(3)} color="text-[var(--color-up)]" />
                <KV k="DELTA P" v={atmRow.pe.delta.toFixed(3)} color="text-[var(--color-down)]" />
                <KV k="GAMMA" v={atmRow.ce.gamma.toFixed(5)} />
                <KV k="THETA" v={atmRow.ce.theta.toFixed(2)} color="text-[var(--color-down)]" />
                <KV k="VEGA" v={atmRow.ce.vega.toFixed(2)} />
              </PanelSection>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={55}>
            <Panel
              title={`OPTION CHAIN — ${under} ${chain.expiry}`}
              code="OMON"
              actions={
                <div className="text-[10px] text-[var(--color-mute)] pr-2">
                  SPOT <span className="text-white font-bold">{fmtNum(chain.spot)}</span>
                </div>
              }
            >
              <OIHeatmap underlying={under} />
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={25} minSize={18}>
            <PanelGroup direction="vertical">
              <RPanel defaultSize={60}>
                <Panel title="OI DISTRIBUTION" code="OI">
                  <OIDistribution underlying={under} />
                </Panel>
              </RPanel>
              <PanelResizeHandle className="h-px" />
              <RPanel defaultSize={40}>
                <Panel title="FII / DII F&O — EOD" code="FII">
                  <table className="w-full text-[11px]">
                    <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)]">
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="text-left px-2 py-1 font-normal">SEG</th>
                        <th className="text-right px-2 font-normal">FII NET</th>
                        <th className="text-right px-2 font-normal">DII NET</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["INDEX FUT", -2841, 1240],
                        ["INDEX OPT", 12480, -3210],
                        ["STOCK FUT", 1840, 920],
                        ["STOCK OPT", -480, 320],
                      ].map(([seg, fii, dii]) => (
                        <tr key={seg as string} className="bb-row border-b border-[var(--color-border)]">
                          <td className="px-2 py-[3px] text-[var(--color-amber-bright)]">{seg}</td>
                          <td className={`px-2 text-right bb-num ${dirColor(fii as number)}`}>
                            {(fii as number) > 0 ? "+" : ""}
                            {(fii as number).toLocaleString("en-IN")}
                          </td>
                          <td className={`px-2 text-right bb-num ${dirColor(dii as number)}`}>
                            {(dii as number) > 0 ? "+" : ""}
                            {(dii as number).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-2 py-1 text-[9px] text-[var(--color-mute)]">CR ₹ — NET BUY/SELL</div>
                </Panel>
              </RPanel>
            </PanelGroup>
          </RPanel>
        </PanelGroup>
      </div>
    </div>
  )
}
