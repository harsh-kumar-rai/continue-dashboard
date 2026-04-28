"use client"

import { Panel, KV } from "@/components/terminal/panel"
import { EQUITIES, sectorAggregates } from "@/lib/mock-data"
import { fmtPct, dirColor } from "@/lib/format"

export function BreadthPanel() {
  const adv = EQUITIES.filter((e) => e.ret1d > 0).length
  const dec = EQUITIES.filter((e) => e.ret1d < 0).length
  const unch = EQUITIES.length - adv - dec
  const ratio = adv / Math.max(1, dec)
  const above50 = EQUITIES.filter((e) => e.price > e.low52 + (e.high52 - e.low52) * 0.5).length
  const above200 = EQUITIES.filter((e) => e.price > e.low52 + (e.high52 - e.low52) * 0.7).length
  const overbought = EQUITIES.filter((e) => e.rsi14 > 70).length
  const oversold = EQUITIES.filter((e) => e.rsi14 < 30).length

  const sectors = sectorAggregates().sort((a, b) => b.avgRet1d - a.avgRet1d)

  return (
    <Panel title="BREADTH" code="BR">
      <div className="grid grid-cols-3 gap-px bg-[var(--color-border)] text-center text-[11px]">
        <div className="bg-black p-2">
          <div className="text-[9px] text-[var(--color-mute)]">ADV</div>
          <div className="text-[var(--color-up)] text-lg font-bold">{adv}</div>
        </div>
        <div className="bg-black p-2">
          <div className="text-[9px] text-[var(--color-mute)]">DEC</div>
          <div className="text-[var(--color-down)] text-lg font-bold">{dec}</div>
        </div>
        <div className="bg-black p-2">
          <div className="text-[9px] text-[var(--color-mute)]">UNCH</div>
          <div className="text-[var(--color-mute)] text-lg font-bold">{unch}</div>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)]">
        <KV k="A/D RATIO" v={ratio.toFixed(2)} color={dirColor(ratio - 1)} />
        <KV k="% ABOVE 50% RNG" v={`${((above50 / EQUITIES.length) * 100).toFixed(0)}%`} />
        <KV k="% ABOVE 70% RNG" v={`${((above200 / EQUITIES.length) * 100).toFixed(0)}%`} />
        <KV k="RSI > 70" v={overbought.toString()} color="text-[var(--color-yellow)]" />
        <KV k="RSI < 30" v={oversold.toString()} color="text-[var(--color-cyan)]" />
      </div>
      <div className="border-t border-[var(--color-amber-dim)]">
        <div className="px-2 py-1 text-[9px] tracking-widest text-[var(--color-mute)] bg-black">SECTORS</div>
        {sectors.map((s) => (
          <div key={s.sector} className="bb-row flex items-center justify-between px-2 py-[2px] text-[11px]">
            <span className="text-[var(--color-amber-bright)] tracking-wider">{s.sector}</span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-mute)] text-[10px]">{s.n} STKS</span>
              <span className={`bb-num w-14 text-right ${dirColor(s.avgRet1d)}`}>{fmtPct(s.avgRet1d)}</span>
              {/* mini bar */}
              <div className="w-16 h-2 bg-[var(--color-border)] relative">
                <div
                  className="absolute top-0 h-full"
                  style={{
                    left: s.avgRet1d > 0 ? "50%" : `${50 + Math.max(-50, (s.avgRet1d / 0.04) * 50)}%`,
                    width: `${Math.min(50, (Math.abs(s.avgRet1d) / 0.04) * 50)}%`,
                    background: s.avgRet1d > 0 ? "var(--color-up)" : "var(--color-down)",
                  }}
                />
                <div className="absolute top-0 left-1/2 h-full w-px bg-[var(--color-mute-2)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
