"use client"

import { useMemo, useState } from "react"
import { PageTitleBar } from "@/components/terminal/shell"
import { Panel, PanelSection } from "@/components/terminal/panel"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"

interface CmdEntry {
  mnemonic: string
  desc: string
  group: "PAGE" | "STOCK" | "INDEX" | "DERIV" | "PORT" | "MACRO" | "ALERT" | "TOOL"
  example?: string
}

const COMMANDS: CmdEntry[] = [
  { mnemonic: "TOP", desc: "Top stories / dashboard", group: "PAGE", example: "TOP <GO>" },
  { mnemonic: "HOME", desc: "Default dashboard", group: "PAGE" },
  { mnemonic: "WEI", desc: "World equity indices / markets", group: "PAGE", example: "WEI <GO>" },
  { mnemonic: "MOST", desc: "Most active gainers/losers", group: "PAGE" },
  { mnemonic: "EQS", desc: "Equity screener", group: "PAGE", example: "EQS <GO>" },
  { mnemonic: "SCRN", desc: "Equity screener", group: "PAGE" },
  { mnemonic: "PORT", desc: "Portfolio manager", group: "PORT" },
  { mnemonic: "ECO", desc: "Macro / economic calendar", group: "MACRO" },
  { mnemonic: "QUANT", desc: "Quant lab", group: "PAGE" },
  { mnemonic: "STRAT", desc: "Strategy builder (options payoff)", group: "DERIV" },
  { mnemonic: "DERIV", desc: "Derivatives monitor (chain + Greeks)", group: "DERIV" },
  { mnemonic: "OMON", desc: "Options monitor for current symbol", group: "DERIV", example: "RELIANCE IN EQUITY OMON <GO>" },
  { mnemonic: "DES", desc: "Description / overview", group: "STOCK", example: "INFY IN EQUITY DES <GO>" },
  { mnemonic: "GIP / GP / CHART", desc: "Chart workbench", group: "STOCK", example: "TCS IN EQUITY CHART <GO>" },
  { mnemonic: "FA", desc: "Fundamentals", group: "STOCK", example: "HDFCBANK IN EQUITY FA <GO>" },
  { mnemonic: "EE", desc: "Earnings / corporate actions", group: "STOCK" },
  { mnemonic: "HOLD", desc: "Holders / shareholding", group: "STOCK" },
  { mnemonic: "ANR", desc: "Analyst recommendations", group: "STOCK" },
  { mnemonic: "RV", desc: "Relative value / valuation", group: "STOCK" },
  { mnemonic: "CN", desc: "Symbol news rail", group: "STOCK" },
  { mnemonic: "N / NEWS", desc: "Full news reader", group: "PAGE" },
  { mnemonic: "FII", desc: "FII / DII activity", group: "MACRO" },
  { mnemonic: "HMAP", desc: "Heatmap (treemap) full screen", group: "TOOL" },
  { mnemonic: "W", desc: "Watchlists", group: "TOOL" },
  { mnemonic: "ALRT", desc: "Alert builder", group: "ALERT" },
  { mnemonic: "HELP", desc: "Command directory & shortcuts", group: "PAGE" },
]

const SHORTCUTS: Array<[string, string]> = [
  ["F1", "Open HELP"],
  ["F2", "Open MARKETS / WEI"],
  ["F3", "Open SCREENER"],
  ["F4", "Open DERIVATIVES / OMON"],
  ["F5", "Open STRATEGY BUILDER"],
  ["F6", "Open QUANT LAB"],
  ["F7", "Open PORTFOLIO"],
  ["F8", "Open MACRO / ECO"],
  ["F9", "Open NEWS"],
  ["F10", "Open ALERTS"],
  ["/", "Focus command line"],
  ["ESC", "Blur command line / close popovers"],
  ["↑ / ↓", "Walk command history / suggestion list"],
  ["TAB", "Accept current suggestion"],
  ["ENTER", "Execute command"],
]

const GLOSSARY: Array<[string, string]> = [
  ["FII", "Foreign Institutional Investor"],
  ["DII", "Domestic Institutional Investor"],
  ["LTP", "Last Traded Price"],
  ["OI", "Open Interest"],
  ["PCR", "Put/Call Ratio (OI or Volume basis)"],
  ["VWAP", "Volume-Weighted Average Price"],
  ["RSI", "Relative Strength Index"],
  ["MACD", "Moving Average Convergence Divergence"],
  ["IV", "Implied Volatility"],
  ["DELTA", "∂Price / ∂Spot"],
  ["GAMMA", "∂Delta / ∂Spot"],
  ["THETA", "∂Price / ∂Time (per day)"],
  ["VEGA", "∂Price / ∂IV (per 1 vol point)"],
  ["IEP", "Indicative Equilibrium Price (NSE pre-open)"],
  ["SLB", "Stock Lending & Borrowing"],
  ["MTF", "Margin Trading Facility"],
  ["SAST", "Substantial Acquisition of Shares & Takeovers"],
  ["RRG", "Relative Rotation Graph (RS-Ratio vs RS-Momentum)"],
]

export default function HelpPage() {
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    const s = q.trim().toUpperCase()
    if (!s) return COMMANDS
    return COMMANDS.filter((c) => c.mnemonic.includes(s) || c.desc.toUpperCase().includes(s))
  }, [q])
  const groups = useMemo(() => {
    const map = new Map<string, CmdEntry[]>()
    for (const c of filtered) {
      const arr = map.get(c.group) ?? []
      arr.push(c)
      map.set(c.group, arr)
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar title="HELP" code="HELP" subtitle="COMMAND DIRECTORY // SHORTCUTS // GLOSSARY" />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <RPanel defaultSize={55}>
            <Panel
              title="COMMAND DIRECTORY"
              code="CMD"
              actions={
                <div className="px-2">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value.toUpperCase())}
                    placeholder="SEARCH MNEMONIC OR DESCRIPTION"
                    className="bg-black border border-[var(--color-amber-dim)] px-2 h-[18px] text-[10px] text-[var(--color-amber)] outline-none focus:border-[var(--color-amber)] w-[260px] uppercase tracking-wider placeholder:text-[var(--color-mute-2)]"
                    spellCheck={false}
                  />
                </div>
              }
            >
              <div className="divide-y divide-[var(--color-border)]">
                {groups.map(([g, list]) => (
                  <div key={g}>
                    <div className="px-2 py-[3px] bg-black text-[9px] tracking-widest text-[var(--color-mute)] border-b border-[var(--color-border)] sticky top-0">
                      {g}
                    </div>
                    {list.map((c) => (
                      <div key={c.mnemonic + c.desc} className="bb-row grid grid-cols-[140px,1fr,200px] items-center px-2 py-[3px] text-[11px]">
                        <span className="text-[var(--color-amber-bright)] font-bold tracking-wider">{c.mnemonic}</span>
                        <span className="text-white">{c.desc}</span>
                        <span className="text-[var(--color-mute)] text-[10px] tracking-wider truncate">{c.example ?? ""}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={45}>
            <PanelGroup direction="vertical">
              <RPanel defaultSize={50}>
                <Panel title="KEYBOARD SHORTCUTS" code="KBD">
                  <PanelSection label="GLOBAL">
                    {SHORTCUTS.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between px-2 py-[3px] text-[11px] bb-row">
                        <span className="px-2 py-[1px] border border-[var(--color-amber-dim)] text-[var(--color-amber)] font-bold bg-black min-w-[64px] text-center">
                          {k}
                        </span>
                        <span className="text-white text-right flex-1 ml-2">{v}</span>
                      </div>
                    ))}
                  </PanelSection>
                </Panel>
              </RPanel>
              <PanelResizeHandle className="h-px" />
              <RPanel defaultSize={50}>
                <Panel title="GLOSSARY" code="GLOS">
                  <div className="divide-y divide-[var(--color-border)]">
                    {GLOSSARY.map(([k, v]) => (
                      <div key={k} className="bb-row grid grid-cols-[100px,1fr] gap-2 items-center px-2 py-[3px] text-[11px]">
                        <span className="text-[var(--color-amber-bright)] font-bold tracking-wider">{k}</span>
                        <span className="text-white">{v}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </RPanel>
            </PanelGroup>
          </RPanel>
        </PanelGroup>
      </div>
    </div>
  )
}
