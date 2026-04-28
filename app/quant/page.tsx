"use client"

import { Panel, PanelGrid } from "@/components/terminal/panel"
import { CorrelationMatrix } from "@/components/charts/correlation-matrix"
import { Sparkline } from "@/components/charts/sparkline"
import { STOCKS, generateOHLC } from "@/lib/mock-data"
import { fmt, fmtPct } from "@/lib/format"

const FACTORS = [
  { f: "VALUE", ytd: 0.142, m1: 0.021, m3: 0.048, m12: 0.184, sharpe: 1.12 },
  { f: "QUALITY", ytd: 0.187, m1: 0.014, m3: 0.052, m12: 0.221, sharpe: 1.34 },
  { f: "MOMENTUM", ytd: 0.241, m1: 0.038, m3: 0.084, m12: 0.312, sharpe: 1.56 },
  { f: "LOW VOL", ytd: 0.094, m1: 0.008, m3: 0.024, m12: 0.126, sharpe: 1.02 },
  { f: "SIZE", ytd: 0.218, m1: 0.029, m3: 0.067, m12: 0.284, sharpe: 1.21 },
  { f: "GROWTH", ytd: 0.164, m1: 0.019, m3: 0.042, m12: 0.198, sharpe: 1.18 },
]

const SIGNALS = [
  { sym: "RELIANCE", signal: "GOLDEN CROSS", strength: 0.82, dir: "BUY" },
  { sym: "TCS", signal: "RSI OVERSOLD", strength: 0.71, dir: "BUY" },
  { sym: "HDFCBANK", signal: "BREAKOUT 52W", strength: 0.91, dir: "BUY" },
  { sym: "INFY", signal: "BEARISH ENGULF", strength: 0.68, dir: "SELL" },
  { sym: "ITC", signal: "MACD BULL", strength: 0.74, dir: "BUY" },
  { sym: "BAJFIN", signal: "DEATH CROSS", strength: 0.79, dir: "SELL" },
  { sym: "SBIN", signal: "VOL SPIKE", strength: 0.88, dir: "BUY" },
  { sym: "MARUTI", signal: "DOUBLE TOP", strength: 0.66, dir: "SELL" },
]

const REGIME = [
  { metric: "VIX", value: 13.42, state: "LOW", color: "up" },
  { metric: "ADV/DEC", value: 1.42, state: "RISK ON", color: "up" },
  { metric: "PUT/CALL", value: 0.92, state: "NEUTRAL", color: "amber" },
  { metric: "10Y-2Y", value: 0.34, state: "STEEPENING", color: "up" },
  { metric: "USD/INR", value: 84.21, state: "WEAK INR", color: "down" },
  { metric: "BREADTH 50", value: 68, state: "BULLISH", color: "up" },
]

export default function QuantPage() {
  const topMomentum = [...STOCKS]
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 8)

  return (
    <PanelGrid cols={4} className="h-full">
      <Panel title="FACTOR PERFORMANCE" fkey="FAC" className="col-span-2">
        <div className="p-2 text-[11px] font-mono">
          <table className="w-full">
            <thead className="text-amber border-b border-border-strong">
              <tr>
                <th className="text-left py-1">FACTOR</th>
                <th className="text-right py-1">YTD</th>
                <th className="text-right py-1">1M</th>
                <th className="text-right py-1">3M</th>
                <th className="text-right py-1">12M</th>
                <th className="text-right py-1">SHARPE</th>
              </tr>
            </thead>
            <tbody>
              {FACTORS.map((f) => (
                <tr key={f.f} className="border-b border-border/30">
                  <td className="py-1 text-amber font-bold">{f.f}</td>
                  <td className={`py-1 text-right tabular-nums ${f.ytd >= 0 ? "text-up" : "text-down"}`}>{fmtPct(f.ytd)}</td>
                  <td className={`py-1 text-right tabular-nums ${f.m1 >= 0 ? "text-up" : "text-down"}`}>{fmtPct(f.m1)}</td>
                  <td className={`py-1 text-right tabular-nums ${f.m3 >= 0 ? "text-up" : "text-down"}`}>{fmtPct(f.m3)}</td>
                  <td className={`py-1 text-right tabular-nums ${f.m12 >= 0 ? "text-up" : "text-down"}`}>{fmtPct(f.m12)}</td>
                  <td className="py-1 text-right tabular-nums">{fmt(f.sharpe, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="MARKET REGIME" fkey="REG" className="col-span-2">
        <div className="p-2 text-[11px] font-mono grid grid-cols-3 gap-2">
          {REGIME.map((r) => (
            <div key={r.metric} className="border border-border-strong bg-bg p-2">
              <div className="text-muted text-[10px]">{r.metric}</div>
              <div className="text-amber font-bold text-base tabular-nums">{fmt(r.value, 2)}</div>
              <div className={`text-[10px] font-bold ${r.color === "up" ? "text-up" : r.color === "down" ? "text-down" : "text-amber"}`}>
                {r.state}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="CORRELATION MATRIX — 60D" fkey="CORR" className="col-span-2 row-span-2">
        <CorrelationMatrix />
      </Panel>

      <Panel title="QUANT SIGNALS — LIVE" fkey="SIG" className="col-span-2">
        <div className="p-2 text-[11px] font-mono">
          <table className="w-full">
            <thead className="text-amber border-b border-border-strong">
              <tr>
                <th className="text-left py-1">TICKER</th>
                <th className="text-left py-1">SIGNAL</th>
                <th className="text-right py-1">STRENGTH</th>
                <th className="text-right py-1">DIR</th>
              </tr>
            </thead>
            <tbody>
              {SIGNALS.map((s, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-1 text-amber font-bold">{s.sym}</td>
                  <td className="py-1 text-muted">{s.signal}</td>
                  <td className="py-1 text-right tabular-nums">
                    <span className="inline-block bg-amber/30 h-2" style={{ width: `${s.strength * 50}px` }} />
                    <span className="ml-1">{(s.strength * 100).toFixed(0)}</span>
                  </td>
                  <td className={`py-1 text-right font-bold ${s.dir === "BUY" ? "text-up" : "text-down"}`}>{s.dir}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="MOMENTUM LEADERS" fkey="MOM" className="col-span-2">
        <div className="text-[11px] font-mono">
          <table className="w-full">
            <thead className="text-amber border-b border-border-strong">
              <tr>
                <th className="text-left px-2 py-1">TICKER</th>
                <th className="text-right px-2 py-1">CHG%</th>
                <th className="text-right px-2 py-1">RSI</th>
                <th className="px-2 py-1">5D TREND</th>
              </tr>
            </thead>
            <tbody>
              {topMomentum.map((s) => {
                const ohlc = generateOHLC(s.symbol, 30)
                const closes = ohlc.slice(-12).map((c) => c.c)
                return (
                  <tr key={s.symbol} className="border-b border-border/30">
                    <td className="px-2 py-1 text-amber font-bold">{s.symbol}</td>
                    <td className={`px-2 py-1 text-right tabular-nums ${s.changePct >= 0 ? "text-up" : "text-down"}`}>
                      {fmtPct(s.changePct)}
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums">{fmt(s.rsi, 1)}</td>
                    <td className="px-2 py-1">
                      <Sparkline data={closes} positive={s.changePct >= 0} width={80} height={18} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </PanelGrid>
  )
}
