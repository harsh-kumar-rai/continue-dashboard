"use client"

import { Panel, PanelGrid } from "@/components/terminal/panel"
import { STOCKS } from "@/lib/mock-data"
import { fmt, fmtPct, fmtINR } from "@/lib/format"
import { useMemo } from "react"
import Link from "next/link"

interface Holding {
  symbol: string
  qty: number
  avgPrice: number
}

const HOLDINGS: Holding[] = [
  { symbol: "RELIANCE", qty: 200, avgPrice: 1180 },
  { symbol: "TCS", qty: 80, avgPrice: 4020 },
  { symbol: "HDFCBANK", qty: 250, avgPrice: 1620 },
  { symbol: "INFY", qty: 150, avgPrice: 1820 },
  { symbol: "ITC", qty: 1200, avgPrice: 410 },
  { symbol: "ICICIBANK", qty: 300, avgPrice: 1140 },
  { symbol: "LT", qty: 50, avgPrice: 3340 },
  { symbol: "BAJFIN", qty: 30, avgPrice: 6840 },
  { symbol: "MARUTI", qty: 15, avgPrice: 11200 },
  { symbol: "SBIN", qty: 600, avgPrice: 740 },
]

export default function PortfolioPage() {
  const rows = useMemo(() => {
    return HOLDINGS.map((h) => {
      const s = STOCKS.find((x) => x.symbol === h.symbol)
      if (!s) return null
      const ltp = s.last
      const value = h.qty * ltp
      const cost = h.qty * h.avgPrice
      const pnl = value - cost
      const pnlPct = pnl / cost
      const dayPnl = h.qty * (s.last - s.prevClose)
      return { ...h, name: s.name, sector: s.sector, ltp, value, cost, pnl, pnlPct, dayPnl, change: s.changePct }
    }).filter(Boolean) as Array<Holding & {
      name: string; sector: string; ltp: number; value: number; cost: number; pnl: number; pnlPct: number; dayPnl: number; change: number
    }>
  }, [])

  const totals = useMemo(() => {
    const value = rows.reduce((a, r) => a + r.value, 0)
    const cost = rows.reduce((a, r) => a + r.cost, 0)
    const pnl = value - cost
    const dayPnl = rows.reduce((a, r) => a + r.dayPnl, 0)
    return { value, cost, pnl, pnlPct: pnl / cost, dayPnl, dayPnlPct: dayPnl / value }
  }, [rows])

  const sectorAlloc = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((r) => map.set(r.sector, (map.get(r.sector) || 0) + r.value))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const attribution = useMemo(() => {
    return [...rows]
      .map((r) => ({ sym: r.symbol, contrib: r.dayPnl, weight: r.value / totals.value }))
      .sort((a, b) => Math.abs(b.contrib) - Math.abs(a.contrib))
  }, [rows, totals])

  return (
    <div className="flex flex-col h-full">
      {/* Summary strip */}
      <div className="border-b border-border-strong bg-panel-alt flex text-[11px]">
        {[
          { l: "PORTFOLIO VALUE", v: fmtINR(totals.value), c: "amber" },
          { l: "INVESTED", v: fmtINR(totals.cost), c: "fg" },
          { l: "TOTAL P&L", v: fmtINR(totals.pnl), c: totals.pnl >= 0 ? "up" : "down" },
          { l: "TOTAL P&L %", v: fmtPct(totals.pnlPct), c: totals.pnl >= 0 ? "up" : "down" },
          { l: "DAY P&L", v: fmtINR(totals.dayPnl), c: totals.dayPnl >= 0 ? "up" : "down" },
          { l: "DAY P&L %", v: fmtPct(totals.dayPnlPct), c: totals.dayPnl >= 0 ? "up" : "down" },
          { l: "HOLDINGS", v: rows.length.toString(), c: "fg" },
        ].map((s) => (
          <div key={s.l} className="px-3 py-2 border-r border-border-strong">
            <div className="text-muted text-[10px]">{s.l}</div>
            <div className={`font-mono font-bold tabular-nums ${
              s.c === "up" ? "text-up" : s.c === "down" ? "text-down" : s.c === "amber" ? "text-amber" : ""
            }`}>{s.v}</div>
          </div>
        ))}
      </div>

      <PanelGrid cols={4} className="flex-1 min-h-0">
        <Panel title="HOLDINGS" fkey="POS" className="col-span-3 row-span-2">
          <div className="overflow-auto h-full text-[11px] font-mono">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 bg-panel-alt z-10 text-amber">
                <tr className="border-b border-border-strong">
                  <th className="text-left px-2 py-1">TICKER</th>
                  <th className="text-left px-2 py-1">NAME</th>
                  <th className="text-right px-2 py-1">QTY</th>
                  <th className="text-right px-2 py-1">AVG</th>
                  <th className="text-right px-2 py-1">LTP</th>
                  <th className="text-right px-2 py-1">VALUE</th>
                  <th className="text-right px-2 py-1">P&L</th>
                  <th className="text-right px-2 py-1">P&L%</th>
                  <th className="text-right px-2 py-1">DAY P&L</th>
                  <th className="text-right px-2 py-1">CHG%</th>
                  <th className="text-right px-2 py-1">WEIGHT</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.symbol} className={`border-b border-border/30 ${i % 2 ? "bg-panel-alt/40" : ""}`}>
                    <td className="px-2 py-0.5">
                      <Link href={`/stock/${r.symbol}`} className="text-amber hover:underline font-bold">{r.symbol}</Link>
                    </td>
                    <td className="px-2 py-0.5 text-muted truncate max-w-[180px]">{r.name}</td>
                    <td className="px-2 py-0.5 text-right tabular-nums">{r.qty}</td>
                    <td className="px-2 py-0.5 text-right tabular-nums">{fmt(r.avgPrice, 2)}</td>
                    <td className="px-2 py-0.5 text-right tabular-nums">{fmt(r.ltp, 2)}</td>
                    <td className="px-2 py-0.5 text-right tabular-nums">{fmtINR(r.value)}</td>
                    <td className={`px-2 py-0.5 text-right tabular-nums ${r.pnl >= 0 ? "text-up" : "text-down"}`}>
                      {fmtINR(r.pnl)}
                    </td>
                    <td className={`px-2 py-0.5 text-right tabular-nums ${r.pnl >= 0 ? "text-up" : "text-down"}`}>
                      {fmtPct(r.pnlPct)}
                    </td>
                    <td className={`px-2 py-0.5 text-right tabular-nums ${r.dayPnl >= 0 ? "text-up" : "text-down"}`}>
                      {fmtINR(r.dayPnl)}
                    </td>
                    <td className={`px-2 py-0.5 text-right tabular-nums ${r.change >= 0 ? "text-up" : "text-down"}`}>
                      {fmtPct(r.change)}
                    </td>
                    <td className="px-2 py-0.5 text-right tabular-nums text-amber">
                      {fmtPct(r.value / totals.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="SECTOR ALLOCATION" fkey="SEC" className="col-span-1">
          <div className="p-2 text-[11px] font-mono">
            {sectorAlloc.map(([sec, val]) => {
              const frac = val / totals.value
              return (
                <div key={sec} className="mb-1">
                  <div className="flex justify-between">
                    <span className="text-amber">{sec}</span>
                    <span className="tabular-nums">{fmtPct(frac)}</span>
                  </div>
                  <div className="h-1.5 bg-bg border border-border">
                    <div className="h-full bg-amber" style={{ width: `${frac * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel title="DAY ATTRIBUTION" fkey="ATT" className="col-span-1">
          <div className="p-2 text-[11px] font-mono">
            <table className="w-full">
              <thead className="text-amber border-b border-border-strong">
                <tr>
                  <th className="text-left py-1">TKR</th>
                  <th className="text-right py-1">CONTRIB</th>
                  <th className="text-right py-1">WGT</th>
                </tr>
              </thead>
              <tbody>
                {attribution.slice(0, 10).map((a) => (
                  <tr key={a.sym} className="border-b border-border/30">
                    <td className="py-1 text-amber font-bold">{a.sym}</td>
                    <td className={`py-1 text-right tabular-nums ${a.contrib >= 0 ? "text-up" : "text-down"}`}>
                      {fmtINR(a.contrib)}
                    </td>
                    <td className="py-1 text-right tabular-nums">{fmtPct(a.weight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="RISK METRICS" fkey="RSK" className="col-span-2">
          <div className="p-2 text-[11px] font-mono grid grid-cols-3 gap-x-4 gap-y-1">
            <div className="text-muted">PORTFOLIO BETA</div>
            <div className="text-right tabular-nums">1.08</div>
            <div className="text-muted">VOLATILITY (1Y)</div>
            <div className="text-right tabular-nums">18.4%</div>
            <div className="text-muted">SHARPE RATIO</div>
            <div className="text-right tabular-nums">1.32</div>
            <div className="text-muted">MAX DRAWDOWN</div>
            <div className="text-right tabular-nums text-down">-12.8%</div>
            <div className="text-muted">VaR 95% (1D)</div>
            <div className="text-right tabular-nums text-down">{fmtINR(-totals.value * 0.022)}</div>
            <div className="text-muted">CVaR 95%</div>
            <div className="text-right tabular-nums text-down">{fmtINR(-totals.value * 0.034)}</div>
            <div className="text-muted">CONCENTRATION (HHI)</div>
            <div className="text-right tabular-nums">0.182</div>
            <div className="text-muted">TRACKING ERROR</div>
            <div className="text-right tabular-nums">4.2%</div>
            <div className="text-muted">INFO RATIO</div>
            <div className="text-right tabular-nums">0.84</div>
          </div>
        </Panel>
      </PanelGrid>
    </div>
  )
}
