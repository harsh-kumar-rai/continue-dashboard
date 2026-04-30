"use client"

import { use, useMemo, useState } from "react"
import { notFound } from "next/navigation"
import { PageTitleBar } from "@/components/terminal/shell"
import { Panel, KV, PanelSection } from "@/components/terminal/panel"
import { EQUITIES, INDICES } from "@/lib/mock-data"
import { chainFor, VIX_HISTORY } from "@/lib/mock-extra"
import { fmtNum, fmtVol, dirColor, fmtPct } from "@/lib/format"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"
import { OIDistribution } from "@/components/charts/oi-distribution"

export default function OptionsMonitor({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = use(params)
  const symbol = decodeURIComponent(raw).toUpperCase()
  const eq = EQUITIES.find((e) => e.symbol === symbol)
  const idx = INDICES.find((i) => i.symbol === symbol)
  if (!eq && !idx) return notFound()

  const chain = useMemo(() => chainFor(symbol), [symbol])
  const spot = chain.spot
  const [maxStrikes, setMaxStrikes] = useState(15)

  // Compute analytics
  const totCallOI = chain.rows.reduce((s, r) => s + r.ce.oi, 0)
  const totPutOI = chain.rows.reduce((s, r) => s + r.pe.oi, 0)
  const callOIChg = chain.rows.reduce((s, r) => s + r.ce.oiChg, 0)
  const putOIChg = chain.rows.reduce((s, r) => s + r.pe.oiChg, 0)
  const pcr = totPutOI / Math.max(1, totCallOI)
  const maxPain = useMemo(() => {
    if (!chain.rows.length) return 0
    let best = chain.rows[0].strike
    let bestVal = Infinity
    for (const c of chain.rows) {
      let pain = 0
      for (const r of chain.rows) {
        if (r.strike < c.strike) pain += (c.strike - r.strike) * r.ce.oi
        if (r.strike > c.strike) pain += (r.strike - c.strike) * r.pe.oi
      }
      if (pain < bestVal) { bestVal = pain; best = c.strike }
    }
    return best
  }, [chain])

  const atmRow = chain.rows.find((r) => Math.abs(r.strike - spot) < (chain.rows[1]?.strike - chain.rows[0]?.strike) / 2) ?? chain.rows[Math.floor(chain.rows.length / 2)]
  const atmIV = atmRow ? (atmRow.ce.iv + atmRow.pe.iv) / 2 : 0

  const visibleRows = chain.rows.slice(
    Math.max(0, Math.floor(chain.rows.length / 2) - maxStrikes),
    Math.min(chain.rows.length, Math.floor(chain.rows.length / 2) + maxStrikes + 1),
  )

  const maxOIVis = Math.max(...visibleRows.flatMap((r) => [r.ce.oi, r.pe.oi]), 1)

  // IV smile
  const smile = chain.rows.map((r) => ({ strike: r.strike, iv: (r.ce.iv + r.pe.iv) / 2 }))
  const ivMin = Math.min(...smile.map((s) => s.iv))
  const ivMax = Math.max(...smile.map((s) => s.iv))
  const smileW = 360
  const smileH = 130
  const sx = (i: number) => 30 + (i / Math.max(1, smile.length - 1)) * (smileW - 36)
  const sy = (v: number) => 8 + (1 - (v - ivMin) / Math.max(0.01, ivMax - ivMin)) * (smileH - 24)

  const last = idx?.value ?? eq?.price ?? 0
  const prev = idx?.prevClose ?? eq?.prevClose ?? last
  const chg = last - prev
  const chgPct = prev ? chg / prev : 0

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar
        title={`${symbol} OPTIONS`}
        code="OMON"
        subtitle={`${eq?.name ?? idx?.name} // EXP ${chain.expiry}`}
        right={
          <div className="flex items-center gap-3 px-3 text-[10px]">
            <span className="text-white tabular-nums">{fmtNum(last)}</span>
            <span className={`tabular-nums ${dirColor(chg)}`}>
              {chg >= 0 ? "+" : ""}{fmtNum(chg)} ({fmtPct(chgPct)})
            </span>
            <button
              onClick={() => setMaxStrikes((s) => (s === 15 ? 30 : 15))}
              className="px-2 h-[18px] border border-[var(--color-border)] hover:bg-[var(--color-amber-dim)]/30"
            >
              {maxStrikes === 15 ? "WIDE" : "FOCUS"}
            </button>
          </div>
        }
      />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <RPanel defaultSize={20}>
            <Panel title="ANALYTICS" code="DES">
              <PanelSection label="UNDERLYING">
                <KV k="SPOT" v={fmtNum(spot)} color="text-white" />
                <KV k="EXPIRY" v={chain.expiry} color="text-[var(--color-amber-bright)]" />
                <KV
                  k="DAYS TO EXP"
                  v={String(Math.max(0, Math.ceil((new Date(chain.expiry).getTime() - Date.now()) / 86400000)))}
                />
                <KV k="LOT" v={String(eq?.lot ?? "—")} />
              </PanelSection>
              <PanelSection label="OI">
                <KV k="TOT CE OI" v={fmtVol(totCallOI)} color="text-[var(--color-down)]" />
                <KV k="TOT PE OI" v={fmtVol(totPutOI)} color="text-[var(--color-up)]" />
                <KV k="PCR (OI)" v={pcr.toFixed(3)} color={pcr > 1 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"} />
                <KV k="CE OI Δ" v={`${callOIChg >= 0 ? "+" : ""}${fmtVol(Math.abs(callOIChg))}`} color={dirColor(-callOIChg)} />
                <KV k="PE OI Δ" v={`${putOIChg >= 0 ? "+" : ""}${fmtVol(Math.abs(putOIChg))}`} color={dirColor(putOIChg)} />
                <KV k="MAX PAIN" v={String(maxPain)} color="text-[var(--color-amber)]" />
              </PanelSection>
              <PanelSection label="VOLATILITY">
                <KV k="ATM IV" v={`${atmIV.toFixed(2)}%`} color="text-[var(--color-amber-bright)]" />
                <KV k="IV RANK (52W)" v="42" />
                <KV k="IV PCT (52W)" v="38" />
                <KV k="VIX SPOT" v={fmtNum(VIX_HISTORY[VIX_HISTORY.length - 1].v)} />
              </PanelSection>
              <PanelSection label="ATM GREEKS">
                <KV k="DELTA C" v={atmRow?.ce.delta.toFixed(3) ?? "—"} color="text-[var(--color-up)]" />
                <KV k="DELTA P" v={atmRow?.pe.delta.toFixed(3) ?? "—"} color="text-[var(--color-down)]" />
                <KV k="GAMMA" v={atmRow?.ce.gamma.toFixed(5) ?? "—"} />
                <KV k="THETA C" v={atmRow?.ce.theta.toFixed(2) ?? "—"} color="text-[var(--color-down)]" />
                <KV k="VEGA" v={atmRow?.ce.vega.toFixed(2) ?? "—"} />
              </PanelSection>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={56}>
            <Panel title="OPTION CHAIN" code="OMON">
              <div className="overflow-auto h-full text-[11px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-[var(--color-panel-2)]">
                    <tr className="text-[10px] text-[var(--color-mute)]">
                      <th colSpan={6} className="text-center py-1 text-[var(--color-up)] border-b border-[var(--color-border)]">
                        CALLS
                      </th>
                      <th className="text-center py-1 text-[var(--color-amber)] border-b border-[var(--color-amber-dim)] bg-black">
                        STRIKE
                      </th>
                      <th colSpan={6} className="text-center py-1 text-[var(--color-down)] border-b border-[var(--color-border)]">
                        PUTS
                      </th>
                    </tr>
                    <tr className="text-[9px] text-[var(--color-mute)]">
                      {["OI", "OI Δ", "VOL", "IV", "DELTA", "LTP"].map((h) => (
                        <th key={`c${h}`} className="text-right px-1 font-normal py-0.5 border-b border-[var(--color-border)]">
                          {h}
                        </th>
                      ))}
                      <th className="text-center py-0.5 border-b border-[var(--color-amber-dim)]">PRICE</th>
                      {["LTP", "DELTA", "IV", "VOL", "OI Δ", "OI"].map((h) => (
                        <th key={`p${h}`} className="text-right px-1 font-normal py-0.5 border-b border-[var(--color-border)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((r) => {
                      const isATM = Math.abs(r.strike - spot) < (chain.rows[1]?.strike - chain.rows[0]?.strike) / 2
                      const ceItm = r.strike < spot
                      const peItm = r.strike > spot
                      const ceHeat = `rgba(255, 23, 68, ${(r.ce.oi / maxOIVis) * 0.5})`
                      const peHeat = `rgba(0, 200, 83, ${(r.pe.oi / maxOIVis) * 0.5})`
                      return (
                        <tr key={r.strike} className={`bb-row ${isATM ? "bg-[var(--color-amber-dim)]/20" : ""}`}>
                          <td className="px-1 text-right bb-num" style={{ background: ceHeat }}>{fmtVol(r.ce.oi)}</td>
                          <td className={`px-1 text-right bb-num ${r.ce.oiChg >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                            {r.ce.oiChg >= 0 ? "+" : ""}{(r.ce.oiChg / 1000).toFixed(0)}K
                          </td>
                          <td className="px-1 text-right text-[var(--color-cyan)] bb-num">{fmtVol(r.ce.vol)}</td>
                          <td className="px-1 text-right text-[var(--color-mute)] bb-num">{r.ce.iv.toFixed(1)}</td>
                          <td className="px-1 text-right text-[var(--color-mute)] bb-num">{r.ce.delta.toFixed(2)}</td>
                          <td className={`px-1 text-right bb-num ${ceItm ? "text-white" : "text-[var(--color-mute)]"}`}>{fmtNum(r.ce.ltp)}</td>
                          <td className="px-1 text-center font-bold text-[var(--color-amber)] bg-black border-x border-[var(--color-amber-dim)]">{r.strike}</td>
                          <td className={`px-1 text-right bb-num ${peItm ? "text-white" : "text-[var(--color-mute)]"}`}>{fmtNum(r.pe.ltp)}</td>
                          <td className="px-1 text-right text-[var(--color-mute)] bb-num">{r.pe.delta.toFixed(2)}</td>
                          <td className="px-1 text-right text-[var(--color-mute)] bb-num">{r.pe.iv.toFixed(1)}</td>
                          <td className="px-1 text-right text-[var(--color-cyan)] bb-num">{fmtVol(r.pe.vol)}</td>
                          <td className={`px-1 text-right bb-num ${r.pe.oiChg >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                            {r.pe.oiChg >= 0 ? "+" : ""}{(r.pe.oiChg / 1000).toFixed(0)}K
                          </td>
                          <td className="px-1 text-right bb-num" style={{ background: peHeat }}>{fmtVol(r.pe.oi)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={24}>
            <PanelGroup direction="vertical">
              <RPanel defaultSize={45}>
                <Panel title="IV SMILE" code="IV">
                  <div className="p-2">
                    <svg viewBox={`0 0 ${smileW} ${smileH}`} width="100%" role="img" aria-label="IV smile">
                      <line x1={30} x2={smileW - 6} y1={smileH - 16} y2={smileH - 16} stroke="#2a2a2a" />
                      {smile.map((p, i) => (
                        <circle key={p.strike} cx={sx(i)} cy={sy(p.iv)} r={2} fill="#ffeb3b" />
                      ))}
                      <path
                        d={smile.map((p, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(p.iv)}`).join(" ")}
                        fill="none"
                        stroke="#ffa500"
                        strokeWidth="1"
                      />
                      <text x={6} y={14} fontSize="9" fill="#808080">IV%</text>
                      <text x={6} y={smileH - 4} fontSize="9" fill="#808080">STRIKES</text>
                    </svg>
                  </div>
                </Panel>
              </RPanel>
              <PanelResizeHandle className="h-px" />
              <RPanel defaultSize={55}>
                <Panel title="OI BUILD-UP" code="OI">
                  <OIDistribution underlying={symbol} />
                </Panel>
              </RPanel>
            </PanelGroup>
          </RPanel>
        </PanelGroup>
      </div>
    </div>
  )
}
