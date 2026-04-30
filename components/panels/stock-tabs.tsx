"use client"

import { useMemo } from "react"
import type { Equity } from "@/lib/types"
import { Panel, KV, PanelSection } from "@/components/terminal/panel"
import { PriceChart } from "@/components/charts/price-chart"
import { ChartWorkbench } from "@/components/charts/chart-workbench"
import { OIHeatmap } from "@/components/charts/oi-heatmap"
import { genOHLC, NEWS, CORP_ACTIONS, EQUITIES } from "@/lib/mock-data"
import { analystRecs } from "@/lib/mock-extra"
import { fmtNum, fmtPct, fmtMcap, fmtVol, dirColor, fmtTime } from "@/lib/format"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"

export function DesTab({ eq }: { eq: Equity }) {
  const bars = useMemo(() => genOHLC(eq.symbol, 252), [eq.symbol])
  const news = NEWS.filter((n) => n.sym === eq.symbol).slice(0, 5)
  return (
    <PanelGroup direction="horizontal">
      <RPanel defaultSize={28} minSize={20}>
        <Panel title="COMPANY" code="CD">
          <PanelSection label="OVERVIEW">
            <KV k="EXCHANGE" v={eq.exchange} />
            <KV k="SECTOR" v={eq.sector} />
            <KV k="INDUSTRY" v={eq.industry} />
            <KV k="ISIN" v={eq.isin} />
            <KV k="LOT SIZE" v={eq.lot.toString()} />
            <KV k="MKT CAP" v={fmtMcap(eq.mcap)} color="text-[var(--color-amber-bright)]" />
            <KV k="BETA (1Y)" v={eq.beta.toFixed(2)} />
          </PanelSection>
          <PanelSection label="VALUATION">
            <KV k="P/E TTM" v={eq.pe.toFixed(2)} />
            <KV k="P/B" v={eq.pb.toFixed(2)} />
            <KV k="EPS" v={fmtNum(eq.eps)} />
            <KV k="BOOK VALUE" v={fmtNum(eq.bookValue)} />
            <KV k="DIV YIELD" v={`${eq.divYield.toFixed(2)}%`} />
          </PanelSection>
          <PanelSection label="TECHNICAL">
            <KV k="52W HIGH" v={fmtNum(eq.high52)} color="text-[var(--color-up)]" />
            <KV k="52W LOW" v={fmtNum(eq.low52)} color="text-[var(--color-down)]" />
            <KV k="RSI 14D" v={eq.rsi14.toFixed(1)} color={eq.rsi14 > 70 ? "text-[var(--color-down)]" : eq.rsi14 < 30 ? "text-[var(--color-up)]" : "text-white"} />
            <KV k="AVG VOL 20D" v={fmtVol(eq.avgVol20)} />
          </PanelSection>
        </Panel>
      </RPanel>
      <PanelResizeHandle className="w-px" />
      <RPanel defaultSize={45}>
        <Panel title="PRICE CHART (1Y)" code="GIP">
          <PriceChart bars={bars} type="candle" />
          <div className="border-t border-[var(--color-border)] p-2 grid grid-cols-7 gap-2 text-[10px]">
            {[
              ["1D", eq.ret1d],
              ["5D", eq.ret5d],
              ["1M", eq.ret1m],
              ["3M", eq.ret3m],
              ["6M", eq.ret6m],
              ["YTD", eq.retYtd],
              ["1Y", eq.ret1y],
            ].map(([k, v]) => (
              <div key={k as string} className="flex flex-col items-center">
                <span className="text-[var(--color-mute)]">{k}</span>
                <span className={`font-bold ${dirColor(v as number)}`}>{fmtPct(v as number)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </RPanel>
      <PanelResizeHandle className="w-px" />
      <RPanel defaultSize={27}>
        <Panel title="NEWS" code="CN">
          <div className="divide-y divide-[var(--color-border)]">
            {(news.length ? news : NEWS.slice(0, 6)).map((n, i) => (
              <div key={i} className="bb-row px-2 py-[3px] text-[11px]">
                <div className="text-[10px] text-[var(--color-mute)]">
                  {fmtTime(n.t)} · <span className="text-[var(--color-amber-bright)]">{n.src}</span>
                </div>
                <div className="text-white tracking-tight">{n.headline}</div>
              </div>
            ))}
          </div>
        </Panel>
      </RPanel>
    </PanelGroup>
  )
}

export function ChartTab({ eq }: { eq: Equity }) {
  // Use the full chart workbench (lightweight-charts powered).
  // It provides timeframes, chart-type toggle, studies (SMA/EMA/VWAP/BB/RSI/MACD),
  // compare-symbol overlay, crosshair sync, horizontal-line drawing and CSV export.
  return <ChartWorkbench symbol={eq.symbol} initialTimeframe="1Y" initialType="candle" />
}

export function FundamentalsTab({ eq }: { eq: Equity }) {
  // synthesize 5y P&L
  const years = ["FY22", "FY23", "FY24", "FY25", "FY26E"]
  const baseRev = eq.price * eq.lot * 1000
  const rows = [
    ["REVENUE", years.map((_, i) => baseRev * (1 + i * 0.12) / 1e7)],
    ["EBITDA", years.map((_, i) => (baseRev * (1 + i * 0.12) * 0.18) / 1e7)],
    ["EBITDA MGN %", years.map((_, i) => 18 + i * 0.4)],
    ["PAT", years.map((_, i) => (baseRev * (1 + i * 0.12) * 0.11) / 1e7)],
    ["EPS", years.map((_, i) => eq.eps * (1 + i * 0.12))],
    ["ROE %", years.map(() => 14 + (eq.symbol.length % 5))],
    ["ROCE %", years.map(() => 17 + (eq.symbol.length % 4))],
    ["DEBT/EQUITY", years.map((_, i) => 0.4 - i * 0.03)],
  ] as Array<[string, number[]]>
  return (
    <PanelGroup direction="horizontal">
      <RPanel defaultSize={50}>
        <Panel title="P&L STATEMENT" code="FA">
          <table className="w-full text-[11px]">
            <thead className="bg-[var(--color-panel-2)] sticky top-0 text-[10px] text-[var(--color-mute)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-2 py-1 font-normal">METRIC</th>
                {years.map((y) => (
                  <th key={y} className="text-right px-2 font-normal">
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, vs]) => (
                <tr key={k} className="bb-row border-b border-[var(--color-border)]">
                  <td className="px-2 py-[3px] text-[var(--color-amber-bright)]">{k}</td>
                  {vs.map((v, i) => (
                    <td key={i} className="px-2 text-right text-white bb-num">
                      {fmtNum(v, 2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </RPanel>
      <PanelResizeHandle className="w-px" />
      <RPanel defaultSize={50}>
        <Panel title="RATIOS / VALUATION" code="RV">
          <PanelSection label="VALUATION">
            <KV k="P/E TTM" v={eq.pe.toFixed(2)} />
            <KV k="P/E FWD" v={(eq.pe * 0.88).toFixed(2)} />
            <KV k="P/B" v={eq.pb.toFixed(2)} />
            <KV k="EV/EBITDA" v={(eq.pe * 0.7).toFixed(2)} />
            <KV k="P/S" v={(eq.pe * 0.3).toFixed(2)} />
          </PanelSection>
          <PanelSection label="PROFITABILITY">
            <KV k="ROE" v={`${(14 + (eq.symbol.length % 5)).toFixed(1)}%`} />
            <KV k="ROCE" v={`${(17 + (eq.symbol.length % 4)).toFixed(1)}%`} />
            <KV k="OPM %" v={`${(18 + (eq.symbol.length % 6)).toFixed(1)}%`} />
            <KV k="NPM %" v={`${(11 + (eq.symbol.length % 5)).toFixed(1)}%`} />
          </PanelSection>
          <PanelSection label="GROWTH (3Y CAGR)">
            <KV k="REV" v={`${(11 + (eq.symbol.length % 7)).toFixed(1)}%`} />
            <KV k="EBITDA" v={`${(13 + (eq.symbol.length % 6)).toFixed(1)}%`} />
            <KV k="PAT" v={`${(15 + (eq.symbol.length % 6)).toFixed(1)}%`} />
          </PanelSection>
          <PanelSection label="LEVERAGE">
            <KV k="DEBT/EQUITY" v={(0.35 + (eq.symbol.length % 3) * 0.1).toFixed(2)} />
            <KV k="INT COVERAGE" v={(8 + (eq.symbol.length % 4)).toFixed(1)} />
          </PanelSection>
        </Panel>
      </RPanel>
    </PanelGroup>
  )
}

export function EarningsTab({ eq }: { eq: Equity }) {
  const ca = CORP_ACTIONS.filter((c) => c.symbol === eq.symbol)
  return (
    <PanelGroup direction="horizontal">
      <RPanel defaultSize={50}>
        <Panel title="QUARTERLY ESTIMATES" code="EE">
          <table className="w-full text-[11px]">
            <thead className="bg-[var(--color-panel-2)] sticky top-0 text-[10px] text-[var(--color-mute)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-2 py-1 font-normal">QTR</th>
                <th className="text-right px-2 font-normal">EST EPS</th>
                <th className="text-right px-2 font-normal">ACT EPS</th>
                <th className="text-right px-2 font-normal">SURPRISE</th>
                <th className="text-right px-2 font-normal">REV (CR)</th>
              </tr>
            </thead>
            <tbody>
              {["Q1FY25", "Q2FY25", "Q3FY25", "Q4FY25", "Q1FY26", "Q2FY26", "Q3FY26", "Q4FY26E"].map((q, i) => {
                const est = eq.eps * 0.25 * (1 + i * 0.04)
                const act = i === 7 ? null : est * (1 + (Math.sin(i + eq.symbol.length) * 0.06))
                const surp = act != null ? (act - est) / est : 0
                return (
                  <tr key={q} className="bb-row border-b border-[var(--color-border)]">
                    <td className="px-2 py-[3px] text-[var(--color-amber-bright)]">{q}</td>
                    <td className="px-2 text-right text-white bb-num">{fmtNum(est)}</td>
                    <td className="px-2 text-right text-white bb-num">{act != null ? fmtNum(act) : "—"}</td>
                    <td className={`px-2 text-right bb-num ${dirColor(surp)}`}>{act != null ? fmtPct(surp) : "—"}</td>
                    <td className="px-2 text-right text-[var(--color-cyan)] bb-num">{fmtNum(eq.mcap * 0.01 * (1 + i * 0.03), 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>
      </RPanel>
      <PanelResizeHandle className="w-px" />
      <RPanel defaultSize={50}>
        <Panel title="CORPORATE ACTIONS" code="CA">
          <table className="w-full text-[11px]">
            <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-2 py-1 font-normal">EX-DATE</th>
                <th className="text-left px-2 font-normal">TYPE</th>
                <th className="text-left px-2 font-normal">DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {(ca.length ? ca : CORP_ACTIONS.slice(0, 6)).map((c, i) => (
                <tr key={i} className="bb-row border-b border-[var(--color-border)]">
                  <td className="px-2 py-[3px] text-[var(--color-amber-bright)]">{c.exDate}</td>
                  <td className="px-2 text-[var(--color-cyan)]">{c.type}</td>
                  <td className="px-2 text-white">{c.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </RPanel>
    </PanelGroup>
  )
}

export function HoldersTab({ eq }: { eq: Equity }) {
  // synth shareholding pattern
  const data = [
    { cat: "PROMOTERS", pct: 45 + (eq.symbol.length % 7) },
    { cat: "FII", pct: 22 + (eq.symbol.length % 5) },
    { cat: "DII (MF)", pct: 15 + (eq.symbol.length % 4) },
    { cat: "DII (INSURE/OTHERS)", pct: 8 },
    { cat: "RETAIL", pct: 7 },
    { cat: "OTHERS", pct: 3 },
  ]
  const total = data.reduce((s, d) => s + d.pct, 0)
  return (
    <Panel title="SHAREHOLDING" code="HOLD">
      <table className="w-full text-[11px]">
        <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-2 py-1 font-normal">CATEGORY</th>
            <th className="text-right px-2 font-normal">% HOLDING</th>
            <th className="text-right px-2 font-normal">QoQ CHG</th>
            <th className="text-left px-2 font-normal w-1/2">DISTRIBUTION</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.cat} className="bb-row border-b border-[var(--color-border)]">
              <td className="px-2 py-[3px] text-[var(--color-amber-bright)]">{d.cat}</td>
              <td className="px-2 text-right text-white bb-num">{((d.pct / total) * 100).toFixed(2)}%</td>
              <td className={`px-2 text-right bb-num ${dirColor(((eq.symbol.charCodeAt(0) % 7) - 3) / 100)}`}>
                {(((eq.symbol.charCodeAt(0) % 7) - 3) / 10).toFixed(2)}%
              </td>
              <td className="px-2">
                <div className="h-3 bg-[var(--color-border)]">
                  <div
                    className="h-full bg-[var(--color-amber)]"
                    style={{ width: `${(d.pct / total) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}

export function NewsTab({ eq }: { eq: Equity }) {
  const news = NEWS.filter((n) => n.sym === eq.symbol)
  const list = news.length ? news : NEWS
  return (
    <Panel title={`${eq.symbol} NEWS`} code="CN">
      <div className="divide-y divide-[var(--color-border)]">
        {list.map((n, i) => (
          <div key={i} className="bb-row px-2 py-1 text-[11px]">
            <div className="text-[10px] text-[var(--color-mute)]">
              {fmtTime(n.t)} · <span className="text-[var(--color-amber-bright)] font-bold">{n.src}</span>
              {n.tag && <span className="ml-2 text-[var(--color-cyan)]">[{n.tag}]</span>}
            </div>
            <div className="text-white">{n.headline}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function OptionsTab({ eq }: { eq: Equity }) {
  // Real per-symbol equity option chain (monthly expiry). The OIHeatmap routes
  // through chainFor() so it picks an equity chain for stocks vs an index chain
  // for indices.
  return (
    <Panel title={`${eq.symbol} OPTIONS — NEAREST EXPIRY`} code="OMON">
      <OIHeatmap underlying={eq.symbol} />
    </Panel>
  )
}

const RATING_COLORS: Record<string, string> = {
  "STRONG BUY": "text-[var(--color-up)]",
  BUY: "text-[var(--color-up)]",
  HOLD: "text-[var(--color-amber)]",
  SELL: "text-[var(--color-down)]",
  "STRONG SELL": "text-[var(--color-down)]",
}

export function AnalystTab({ eq }: { eq: Equity }) {
  const { recs, consensus } = useMemo(() => analystRecs(eq.symbol), [eq.symbol])
  const total =
    consensus.strongBuy + consensus.buy + consensus.hold + consensus.sell + consensus.strongSell || 1
  const upside = ((consensus.avgTarget - eq.price) / eq.price) || 0
  const dist: Array<[string, number, string]> = [
    ["STRONG BUY", consensus.strongBuy, "var(--color-up)"],
    ["BUY", consensus.buy, "var(--color-up)"],
    ["HOLD", consensus.hold, "var(--color-amber)"],
    ["SELL", consensus.sell, "var(--color-down)"],
    ["STRONG SELL", consensus.strongSell, "var(--color-down)"],
  ]
  return (
    <PanelGroup direction="horizontal">
      <RPanel defaultSize={36} minSize={24}>
        <Panel title="ANALYST CONSENSUS" code="ANR">
          <PanelSection label="SUMMARY">
            <KV
              k="RATING"
              v={consensus.mean}
              color={RATING_COLORS[consensus.mean] ?? "text-white"}
            />
            <KV k="ANALYSTS" v={total.toString()} />
            <KV
              k="AVG TARGET"
              v={fmtNum(consensus.avgTarget, 0)}
              color="text-[var(--color-amber-bright)]"
            />
            <KV
              k="UPSIDE"
              v={fmtPct(upside)}
              color={dirColor(upside)}
            />
            <KV k="LAST PRICE" v={fmtNum(eq.price)} />
          </PanelSection>
          <PanelSection label="DISTRIBUTION">
            {dist.map(([label, count, color]) => (
              <div key={label} className="px-2 py-[3px] text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--color-mute)] tracking-wider">{label}</span>
                  <span className="text-white bb-num">{count}</span>
                </div>
                <div className="h-[6px] bg-[var(--color-border)] mt-[2px]">
                  <div
                    className="h-full"
                    style={{ width: `${(count / total) * 100}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </PanelSection>
        </Panel>
      </RPanel>
      <PanelResizeHandle className="w-px" />
      <RPanel defaultSize={64}>
        <Panel title="RECENT RATINGS" code="ANR">
          <table className="w-full text-[11px]">
            <thead className="bg-[var(--color-panel-2)] sticky top-0 text-[10px] text-[var(--color-mute)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-2 py-1 font-normal">DATE</th>
                <th className="text-left px-2 font-normal">BROKER</th>
                <th className="text-left px-2 font-normal">RATING</th>
                <th className="text-right px-2 font-normal">TARGET</th>
                <th className="text-right px-2 font-normal">PREV</th>
                <th className="text-right px-2 font-normal">UPSIDE</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r, i) => {
                const ups = (r.target - eq.price) / eq.price
                return (
                  <tr key={i} className="bb-row border-b border-[var(--color-border)]">
                    <td className="px-2 py-[3px] text-[var(--color-amber-bright)]">{r.date}</td>
                    <td className="px-2 text-white">{r.broker}</td>
                    <td className={`px-2 font-bold ${RATING_COLORS[r.rating] ?? "text-white"}`}>
                      {r.rating}
                    </td>
                    <td className="px-2 text-right text-white bb-num">{fmtNum(r.target, 0)}</td>
                    <td className="px-2 text-right text-[var(--color-mute)] bb-num">
                      {r.prevTarget != null ? fmtNum(r.prevTarget, 0) : "—"}
                    </td>
                    <td className={`px-2 text-right bb-num ${dirColor(ups)}`}>{fmtPct(ups)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>
      </RPanel>
    </PanelGroup>
  )
}

export function ValuationTab({ eq }: { eq: Equity }) {
  // Peer comparison on same sector (up to 8 peers).
  const peers = useMemo(
    () => EQUITIES.filter((e) => e.sector === eq.sector && e.symbol !== eq.symbol).slice(0, 7),
    [eq.sector, eq.symbol],
  )
  const universe = [eq, ...peers]
  const sectorAvg = (k: keyof Equity) =>
    universe.reduce((s, e) => s + (e[k] as number), 0) / universe.length
  const peAvg = sectorAvg("pe")
  const pbAvg = sectorAvg("pb")
  const peGap = (eq.pe - peAvg) / peAvg
  const pbGap = (eq.pb - pbAvg) / pbAvg
  return (
    <PanelGroup direction="horizontal">
      <RPanel defaultSize={36} minSize={24}>
        <Panel title="VALUATION VS PEERS" code="RV">
          <PanelSection label="VS SECTOR AVG">
            <KV k="P/E" v={eq.pe.toFixed(2)} />
            <KV k="P/E SECTOR" v={peAvg.toFixed(2)} color="text-[var(--color-mute)]" />
            <KV
              k="P/E PREMIUM"
              v={fmtPct(peGap)}
              color={dirColor(-peGap)}
            />
            <KV k="P/B" v={eq.pb.toFixed(2)} />
            <KV k="P/B SECTOR" v={pbAvg.toFixed(2)} color="text-[var(--color-mute)]" />
            <KV k="P/B PREMIUM" v={fmtPct(pbGap)} color={dirColor(-pbGap)} />
          </PanelSection>
          <PanelSection label="MARKET CAP">
            <KV k={eq.symbol} v={fmtMcap(eq.mcap)} />
            <KV
              k="SECTOR MCAP"
              v={fmtMcap(universe.reduce((s, e) => s + e.mcap, 0))}
              color="text-[var(--color-amber-bright)]"
            />
          </PanelSection>
        </Panel>
      </RPanel>
      <PanelResizeHandle className="w-px" />
      <RPanel defaultSize={64}>
        <Panel title={`PEERS — ${eq.sector}`} code="RV">
          <table className="w-full text-[11px]">
            <thead className="bg-[var(--color-panel-2)] sticky top-0 text-[10px] text-[var(--color-mute)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-2 py-1 font-normal">SYMBOL</th>
                <th className="text-right px-2 font-normal">PRICE</th>
                <th className="text-right px-2 font-normal">1D %</th>
                <th className="text-right px-2 font-normal">P/E</th>
                <th className="text-right px-2 font-normal">P/B</th>
                <th className="text-right px-2 font-normal">DIV %</th>
                <th className="text-right px-2 font-normal">MCAP</th>
                <th className="text-right px-2 font-normal">VOL</th>
              </tr>
            </thead>
            <tbody>
              {universe.map((p) => (
                <tr
                  key={p.symbol}
                  className={`bb-row border-b border-[var(--color-border)] ${
                    p.symbol === eq.symbol ? "bg-[var(--color-amber-dim)]/20" : ""
                  }`}
                >
                  <td className="px-2 py-[3px] text-[var(--color-amber-bright)] font-bold">
                    {p.symbol}
                  </td>
                  <td className="px-2 text-right text-white bb-num">{fmtNum(p.price)}</td>
                  <td className={`px-2 text-right bb-num ${dirColor(p.ret1d)}`}>
                    {fmtPct(p.ret1d)}
                  </td>
                  <td className="px-2 text-right text-white bb-num">{p.pe.toFixed(2)}</td>
                  <td className="px-2 text-right text-white bb-num">{p.pb.toFixed(2)}</td>
                  <td className="px-2 text-right text-[var(--color-cyan)] bb-num">
                    {p.divYield.toFixed(2)}%
                  </td>
                  <td className="px-2 text-right text-white bb-num">{fmtMcap(p.mcap)}</td>
                  <td className="px-2 text-right text-[var(--color-mute)] bb-num">
                    {fmtVol(p.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </RPanel>
    </PanelGroup>
  )
}
