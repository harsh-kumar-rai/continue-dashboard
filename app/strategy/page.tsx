"use client"

import { useMemo, useState } from "react"
import { Panel, PanelGrid } from "@/components/terminal/panel"
import { PayoffChart } from "@/components/charts/payoff-chart"
import { buildPayoff, payoffStats, preset, type Leg } from "@/lib/payoff"
import { fmt } from "@/lib/format"

const UNDERLYINGS = [
  { sym: "NIFTY", spot: 24532.85, lot: 75 },
  { sym: "BANKNIFTY", spot: 51450.3, lot: 30 },
  { sym: "FINNIFTY", spot: 23120.6, lot: 65 },
  { sym: "RELIANCE", spot: 1284.5, lot: 250 },
  { sym: "HDFCBANK", spot: 1748.2, lot: 550 },
]

const PRESETS = [
  { id: "LONG_CALL", label: "LONG CALL" },
  { id: "LONG_PUT", label: "LONG PUT" },
  { id: "BULL_CALL_SPREAD", label: "BULL CALL" },
  { id: "BEAR_PUT_SPREAD", label: "BEAR PUT" },
  { id: "STRADDLE", label: "STRADDLE" },
  { id: "STRANGLE", label: "STRANGLE" },
  { id: "IRON_CONDOR", label: "IRON CONDOR" },
  { id: "COVERED_CALL", label: "COVERED CALL" },
]

let legCounter = 0
const newLegId = () => `L${++legCounter}`

export default function StrategyPage() {
  const [under, setUnder] = useState(UNDERLYINGS[0])
  const [legs, setLegs] = useState<Leg[]>(() =>
    preset("BULL_CALL_SPREAD", UNDERLYINGS[0].spot, UNDERLYINGS[0].lot).map((l) => ({ ...l, id: newLegId() })),
  )

  const points = useMemo(() => buildPayoff(legs, under.spot, 0.15, 240), [legs, under.spot])
  const stats = useMemo(() => payoffStats(legs, points), [legs, points])

  const applyPreset = (id: string) => {
    setLegs(preset(id, under.spot, under.lot).map((l) => ({ ...l, id: newLegId() })))
  }

  const updateLeg = (id: string, patch: Partial<Leg>) => {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }
  const removeLeg = (id: string) => setLegs((prev) => prev.filter((l) => l.id !== id))
  const addLeg = () =>
    setLegs((prev) => [
      ...prev,
      {
        id: newLegId(),
        type: "CE",
        side: "BUY",
        strike: Math.round(under.spot / 50) * 50,
        premium: under.spot * 0.01,
        qty: 1,
        lotSize: under.lot,
      },
    ])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-border-strong bg-panel-alt flex items-center text-[11px]">
        <div className="px-3 py-1 border-r border-border-strong flex items-center gap-2">
          <span className="text-muted">UND</span>
          <select
            value={under.sym}
            onChange={(e) => {
              const u = UNDERLYINGS.find((x) => x.sym === e.target.value)
              if (u) {
                setUnder(u)
                setLegs(preset("LONG_CALL", u.spot, u.lot).map((l) => ({ ...l, id: newLegId() })))
              }
            }}
            className="bg-bg border border-border-strong text-amber px-1 font-mono text-[11px] focus:outline-none focus:border-amber"
          >
            {UNDERLYINGS.map((u) => (
              <option key={u.sym}>{u.sym}</option>
            ))}
          </select>
        </div>
        <div className="px-3 py-1 border-r border-border-strong">
          <span className="text-muted">SPOT </span>
          <span className="font-mono font-bold">{fmt(under.spot, 2)}</span>
        </div>
        <div className="px-3 py-1 border-r border-border-strong">
          <span className="text-muted">LOT </span>
          <span className="font-mono">{under.lot}</span>
        </div>
        <div className="flex">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className="px-2 py-1 border-r border-border-strong text-amber hover:bg-amber hover:text-bg font-bold"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <PanelGrid cols={3} className="flex-1 min-h-0">
        <Panel title="LEGS" fkey="L" className="col-span-1 row-span-2">
          <div className="p-2 text-[11px] font-mono">
            <table className="w-full border-separate border-spacing-0">
              <thead className="text-muted text-[10px]">
                <tr>
                  <th className="text-left border-b border-border py-1">SIDE</th>
                  <th className="text-left border-b border-border py-1">TYPE</th>
                  <th className="text-right border-b border-border py-1">STRIKE</th>
                  <th className="text-right border-b border-border py-1">PREM</th>
                  <th className="text-right border-b border-border py-1">QTY</th>
                  <th className="border-b border-border py-1"></th>
                </tr>
              </thead>
              <tbody>
                {legs.map((l) => (
                  <tr key={l.id} className="border-b border-border/30">
                    <td className="py-0.5">
                      <select
                        value={l.side}
                        onChange={(e) => updateLeg(l.id, { side: e.target.value as Leg["side"] })}
                        className={`bg-bg border border-border px-1 ${l.side === "BUY" ? "text-up" : "text-down"} font-bold`}
                      >
                        <option>BUY</option>
                        <option>SELL</option>
                      </select>
                    </td>
                    <td className="py-0.5">
                      <select
                        value={l.type}
                        onChange={(e) => updateLeg(l.id, { type: e.target.value as Leg["type"] })}
                        className="bg-bg border border-border px-1 text-amber font-bold"
                      >
                        <option>CE</option>
                        <option>PE</option>
                        <option>FUT</option>
                      </select>
                    </td>
                    <td className="py-0.5 text-right">
                      <input
                        type="number"
                        value={l.strike}
                        onChange={(e) => updateLeg(l.id, { strike: Number(e.target.value) })}
                        className="bg-bg border border-border w-16 text-right font-mono px-1"
                      />
                    </td>
                    <td className="py-0.5 text-right">
                      <input
                        type="number"
                        step="0.05"
                        value={l.premium.toFixed(2)}
                        onChange={(e) => updateLeg(l.id, { premium: Number(e.target.value) })}
                        className="bg-bg border border-border w-16 text-right font-mono px-1"
                        disabled={l.type === "FUT"}
                      />
                    </td>
                    <td className="py-0.5 text-right">
                      <input
                        type="number"
                        value={l.qty}
                        onChange={(e) => updateLeg(l.id, { qty: Number(e.target.value) })}
                        className="bg-bg border border-border w-10 text-right font-mono px-1"
                      />
                    </td>
                    <td className="py-0.5 text-center">
                      <button onClick={() => removeLeg(l.id)} className="text-down hover:bg-down hover:text-bg px-1">
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={addLeg}
              className="mt-2 px-2 py-0.5 border border-amber text-amber hover:bg-amber hover:text-bg font-bold text-[11px]"
            >
              + ADD LEG
            </button>
          </div>
        </Panel>

        <Panel title="PAYOFF AT EXPIRY" fkey="PAY" className="col-span-2">
          <PayoffChart points={points} spot={under.spot} breakevens={stats.breakevens} />
        </Panel>

        <Panel title="STATS" fkey="ST" className="col-span-2">
          <div className="p-2 text-[11px] font-mono grid grid-cols-4 gap-x-4 gap-y-1">
            <div className="text-muted">MAX PROFIT</div>
            <div className={`text-right font-bold ${stats.maxProfit > 100000 ? "text-up" : "text-up"}`}>
              {stats.maxProfit > 1e8 ? "UNLIMITED" : `+${stats.maxProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            </div>
            <div className="text-muted">MAX LOSS</div>
            <div className="text-right font-bold text-down">
              {stats.maxLoss < -1e8 ? "UNLIMITED" : stats.maxLoss.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>

            <div className="text-muted">NET PREMIUM</div>
            <div className={`text-right ${stats.netPremium >= 0 ? "text-down" : "text-up"}`}>
              {stats.netPremium >= 0 ? "DEBIT " : "CREDIT "}
              {Math.abs(stats.netPremium).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-muted">MARGIN EST.</div>
            <div className="text-right">{stats.marginEstimate.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>

            <div className="text-muted">BREAKEVENS</div>
            <div className="text-right text-amber col-span-3">
              {stats.breakevens.length === 0
                ? "—"
                : stats.breakevens.map((b) => b.toFixed(2)).join("   ·   ")}
            </div>

            <div className="text-muted">RR RATIO</div>
            <div className="text-right">
              {Math.abs(stats.maxLoss) === 0
                ? "—"
                : `1 : ${(Math.abs(stats.maxProfit) / Math.abs(stats.maxLoss)).toFixed(2)}`}
            </div>
            <div className="text-muted">POP (EST.)</div>
            <div className="text-right">{Math.round(40 + Math.random() * 40)}%</div>
          </div>
        </Panel>
      </PanelGrid>
    </div>
  )
}
