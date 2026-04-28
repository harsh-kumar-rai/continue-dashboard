"use client"

import { Panel, PanelGrid } from "@/components/terminal/panel"
import { YieldCurve } from "@/components/charts/yield-curve"
import { Sparkline } from "@/components/charts/sparkline"
import { generateOHLC, MACRO } from "@/lib/mock-data"
import { fmt, fmtPct } from "@/lib/format"

const FX = [
  { sym: "USD/INR", value: 84.21, chg: 0.18, chgPct: 0.21 },
  { sym: "EUR/INR", value: 91.42, chg: -0.12, chgPct: -0.13 },
  { sym: "GBP/INR", value: 106.84, chg: 0.34, chgPct: 0.32 },
  { sym: "JPY/INR", value: 0.5421, chg: -0.0018, chgPct: -0.33 },
  { sym: "DXY", value: 105.42, chg: 0.31, chgPct: 0.30 },
  { sym: "EUR/USD", value: 1.0842, chg: -0.0024, chgPct: -0.22 },
]

const COMMODITIES = [
  { sym: "GOLD MCX", value: 75240, chg: 184, chgPct: 0.25, unit: "₹/10g" },
  { sym: "SILVER MCX", value: 92140, chg: -340, chgPct: -0.37, unit: "₹/kg" },
  { sym: "CRUDE MCX", value: 6240, chg: -42, chgPct: -0.67, unit: "₹/bbl" },
  { sym: "BRENT", value: 73.42, chg: -0.51, chgPct: -0.69, unit: "$/bbl" },
  { sym: "WTI", value: 69.18, chg: -0.48, chgPct: -0.69, unit: "$/bbl" },
  { sym: "COPPER", value: 814.5, chg: 4.2, chgPct: 0.52, unit: "₹/kg" },
  { sym: "NATGAS MCX", value: 248.4, chg: 2.1, chgPct: 0.85, unit: "₹/MMBtu" },
  { sym: "ALUMINUM", value: 234.8, chg: -1.4, chgPct: -0.59, unit: "₹/kg" },
]

const GLOBAL = [
  { sym: "S&P 500", value: 5982.4, chg: 12.4, chgPct: 0.21 },
  { sym: "NASDAQ", value: 19248.6, chg: 48.2, chgPct: 0.25 },
  { sym: "DOW", value: 44120.4, chg: -84.2, chgPct: -0.19 },
  { sym: "DAX", value: 19420.8, chg: 24.1, chgPct: 0.12 },
  { sym: "FTSE 100", value: 8240.2, chg: -12.4, chgPct: -0.15 },
  { sym: "NIKKEI", value: 38940.6, chg: 142.4, chgPct: 0.37 },
  { sym: "HSI", value: 19840.2, chg: -84.6, chgPct: -0.42 },
  { sym: "SHANGHAI", value: 3340.4, chg: 8.4, chgPct: 0.25 },
]

const RATES = [
  { sym: "REPO RATE", value: 6.50, prev: 6.50, change: "UNCH" },
  { sym: "REVERSE REPO", value: 3.35, prev: 3.35, change: "UNCH" },
  { sym: "CRR", value: 4.50, prev: 4.50, change: "UNCH" },
  { sym: "SLR", value: 18.00, prev: 18.00, change: "UNCH" },
  { sym: "MSF", value: 6.75, prev: 6.75, change: "UNCH" },
  { sym: "BANK RATE", value: 6.75, prev: 6.75, change: "UNCH" },
]

export default function MacroPage() {
  return (
    <PanelGrid cols={4} className="h-full">
      <Panel title="INDIA G-SEC YIELD CURVE" fkey="YC" className="col-span-2 row-span-2">
        <YieldCurve />
      </Panel>

      <Panel title="MACRO INDICATORS — INDIA" fkey="ECO" className="col-span-2 row-span-2">
        <div className="p-2 text-[11px] font-mono">
          <table className="w-full">
            <thead className="text-amber border-b border-border-strong">
              <tr>
                <th className="text-left py-1">INDICATOR</th>
                <th className="text-right py-1">VALUE</th>
                <th className="text-right py-1">PREV</th>
                <th className="text-right py-1">CHG</th>
                <th className="text-left py-1 pl-3">PERIOD</th>
              </tr>
            </thead>
            <tbody>
              {MACRO.map((m) => {
                const chg = m.value - m.prev
                return (
                  <tr key={m.indicator} className="border-b border-border/30">
                    <td className="py-1 text-amber">{m.indicator}</td>
                    <td className="py-1 text-right font-bold tabular-nums">
                      {m.value.toFixed(2)}{m.unit}
                    </td>
                    <td className="py-1 text-right text-muted tabular-nums">
                      {m.prev.toFixed(2)}{m.unit}
                    </td>
                    <td className={`py-1 text-right tabular-nums ${chg > 0 ? "text-up" : chg < 0 ? "text-down" : "text-muted"}`}>
                      {chg > 0 ? "+" : ""}{chg.toFixed(2)}
                    </td>
                    <td className="py-1 pl-3 text-muted">{m.period}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="FX RATES" fkey="FX" className="col-span-2">
        <div className="p-2 text-[11px] font-mono">
          <table className="w-full">
            <thead className="text-amber border-b border-border-strong">
              <tr>
                <th className="text-left py-1">PAIR</th>
                <th className="text-right py-1">RATE</th>
                <th className="text-right py-1">CHG</th>
                <th className="text-right py-1">CHG%</th>
                <th className="px-2 py-1">5D</th>
              </tr>
            </thead>
            <tbody>
              {FX.map((f) => {
                const ohlc = generateOHLC(f.sym.replace("/", ""), 12)
                const closes = ohlc.map((o) => o.c)
                return (
                  <tr key={f.sym} className="border-b border-border/30">
                    <td className="py-1 text-amber font-bold">{f.sym}</td>
                    <td className="py-1 text-right tabular-nums">{fmt(f.value, f.value < 10 ? 4 : 2)}</td>
                    <td className={`py-1 text-right tabular-nums ${f.chg >= 0 ? "text-up" : "text-down"}`}>
                      {f.chg >= 0 ? "+" : ""}{f.chg.toFixed(f.value < 10 ? 4 : 2)}
                    </td>
                    <td className={`py-1 text-right tabular-nums ${f.chgPct >= 0 ? "text-up" : "text-down"}`}>
                      {fmtPct(f.chgPct)}
                    </td>
                    <td className="px-2 py-1">
                      <Sparkline data={closes} positive={f.chg >= 0} width={60} height={16} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="COMMODITIES" fkey="CMDTY" className="col-span-2">
        <div className="p-2 text-[11px] font-mono">
          <table className="w-full">
            <thead className="text-amber border-b border-border-strong">
              <tr>
                <th className="text-left py-1">CMDTY</th>
                <th className="text-right py-1">PRICE</th>
                <th className="text-right py-1">UNIT</th>
                <th className="text-right py-1">CHG</th>
                <th className="text-right py-1">CHG%</th>
              </tr>
            </thead>
            <tbody>
              {COMMODITIES.map((c) => (
                <tr key={c.sym} className="border-b border-border/30">
                  <td className="py-1 text-amber font-bold">{c.sym}</td>
                  <td className="py-1 text-right tabular-nums">{fmt(c.value, 2)}</td>
                  <td className="py-1 text-right text-muted text-[10px]">{c.unit}</td>
                  <td className={`py-1 text-right tabular-nums ${c.chg >= 0 ? "text-up" : "text-down"}`}>
                    {c.chg >= 0 ? "+" : ""}{fmt(c.chg, 2)}
                  </td>
                  <td className={`py-1 text-right tabular-nums ${c.chgPct >= 0 ? "text-up" : "text-down"}`}>
                    {fmtPct(c.chgPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="GLOBAL EQUITY INDICES" fkey="WEI" className="col-span-2">
        <div className="p-2 text-[11px] font-mono">
          <table className="w-full">
            <thead className="text-amber border-b border-border-strong">
              <tr>
                <th className="text-left py-1">INDEX</th>
                <th className="text-right py-1">LAST</th>
                <th className="text-right py-1">CHG</th>
                <th className="text-right py-1">CHG%</th>
              </tr>
            </thead>
            <tbody>
              {GLOBAL.map((g) => (
                <tr key={g.sym} className="border-b border-border/30">
                  <td className="py-1 text-amber font-bold">{g.sym}</td>
                  <td className="py-1 text-right tabular-nums">{fmt(g.value, 2)}</td>
                  <td className={`py-1 text-right tabular-nums ${g.chg >= 0 ? "text-up" : "text-down"}`}>
                    {g.chg >= 0 ? "+" : ""}{fmt(g.chg, 2)}
                  </td>
                  <td className={`py-1 text-right tabular-nums ${g.chgPct >= 0 ? "text-up" : "text-down"}`}>
                    {fmtPct(g.chgPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="RBI POLICY RATES" fkey="RBI" className="col-span-2">
        <div className="p-2 text-[11px] font-mono">
          <table className="w-full">
            <thead className="text-amber border-b border-border-strong">
              <tr>
                <th className="text-left py-1">RATE</th>
                <th className="text-right py-1">CURRENT</th>
                <th className="text-right py-1">PREV</th>
                <th className="text-right py-1">CHG</th>
              </tr>
            </thead>
            <tbody>
              {RATES.map((r) => (
                <tr key={r.sym} className="border-b border-border/30">
                  <td className="py-1 text-amber font-bold">{r.sym}</td>
                  <td className="py-1 text-right tabular-nums">{fmt(r.value, 2)}%</td>
                  <td className="py-1 text-right tabular-nums text-muted">{fmt(r.prev, 2)}%</td>
                  <td className={`py-1 text-right ${r.change === "UNCH" ? "text-muted" : "text-amber"}`}>{r.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </PanelGrid>
  )
}
