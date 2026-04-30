"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { PageTitleBar } from "@/components/terminal/shell"
import { Panel } from "@/components/terminal/panel"
import { EQUITIES, genOHLC } from "@/lib/mock-data"
import { DEFAULT_WATCHLISTS } from "@/lib/mock-extra"
import { Sparkline } from "@/components/charts/sparkline"
import { fmtNum, fmtPct, fmtVol, dirColor, arrow } from "@/lib/format"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"

interface WL {
  name: string
  symbols: string[]
}

const STORAGE_KEY = "betagen.watchlists.v1"

function loadWatchlists(): WL[] {
  if (typeof window === "undefined") return DEFAULT_WATCHLISTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_WATCHLISTS
    const parsed = JSON.parse(raw) as WL[]
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_WATCHLISTS
    return parsed
  } catch {
    return DEFAULT_WATCHLISTS
  }
}

export default function WatchlistPage() {
  const [lists, setLists] = useState<WL[]>(DEFAULT_WATCHLISTS)
  const [active, setActive] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const [adding, setAdding] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [addSymbol, setAddSymbol] = useState("")

  useEffect(() => {
    setLists(loadWatchlists())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
    } catch {
      /* ignore */
    }
  }, [lists, hydrated])

  const current = lists[active] ?? lists[0]
  const rows = useMemo(() => {
    if (!current) return []
    return current.symbols
      .map((s) => EQUITIES.find((e) => e.symbol === s))
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .map((e) => ({ ...e, spark: genOHLC(e.symbol, 60).map((b) => b.c) }))
  }, [current])

  const addList = () => {
    const name = draftName.trim().toUpperCase()
    if (!name) return
    setLists((ls) => [...ls, { name, symbols: [] }])
    setDraftName("")
    setActive(lists.length)
  }
  const removeList = (i: number) => {
    if (!confirm(`Delete watchlist "${lists[i]?.name}"?`)) return
    setLists((ls) => ls.filter((_, idx) => idx !== i))
    setActive(0)
  }
  const addSym = () => {
    const s = addSymbol.trim().toUpperCase()
    if (!s || !EQUITIES.find((e) => e.symbol === s)) return
    setLists((ls) =>
      ls.map((l, idx) =>
        idx === active && !l.symbols.includes(s) ? { ...l, symbols: [...l.symbols, s] } : l,
      ),
    )
    setAddSymbol("")
  }
  const removeSym = (sym: string) => {
    setLists((ls) =>
      ls.map((l, idx) => (idx === active ? { ...l, symbols: l.symbols.filter((s) => s !== sym) } : l)),
    )
  }
  const move = (sym: string, dir: -1 | 1) => {
    setLists((ls) =>
      ls.map((l, idx) => {
        if (idx !== active) return l
        const i = l.symbols.indexOf(sym)
        if (i < 0) return l
        const j = i + dir
        if (j < 0 || j >= l.symbols.length) return l
        const next = [...l.symbols]
        ;[next[i], next[j]] = [next[j], next[i]]
        return { ...l, symbols: next }
      }),
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar title="WATCHLIST" code="W" subtitle="USER WATCHLISTS // PERSISTED LOCAL" />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <RPanel defaultSize={22} minSize={15}>
            <Panel
              title="LISTS"
              code="W"
              actions={
                <button
                  onClick={() => setAdding((s) => !s)}
                  className="px-2 text-[10px] tracking-widest font-bold text-[var(--color-amber)] hover:text-[var(--color-amber-bright)]"
                >
                  + NEW
                </button>
              }
            >
              {adding && (
                <div className="p-2 border-b border-[var(--color-border)] bg-black flex gap-1">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value.toUpperCase())}
                    placeholder="LIST NAME"
                    className="flex-1 bg-black border border-[var(--color-amber-dim)] px-2 py-1 text-[11px] text-[var(--color-amber)] outline-none uppercase tracking-wider"
                    spellCheck={false}
                  />
                  <button onClick={addList} className="bg-[var(--color-amber)] text-black px-2 text-[10px] font-bold tracking-widest">
                    OK
                  </button>
                </div>
              )}
              <div className="divide-y divide-[var(--color-border)]">
                {lists.map((l, i) => (
                  <div key={l.name + i} className="flex items-center bb-row">
                    <button
                      onClick={() => setActive(i)}
                      className={`flex-1 text-left px-2 py-[6px] text-[11px] ${
                        i === active ? "bg-[var(--color-amber-dim)]/40 text-[var(--color-amber-bright)] font-bold" : "text-[var(--color-amber)]"
                      }`}
                    >
                      {l.name}
                      <span className="text-[var(--color-mute)] ml-2 text-[9px]">{l.symbols.length}</span>
                    </button>
                    <button
                      onClick={() => removeList(i)}
                      className="px-2 text-[var(--color-down)] text-[10px] hover:bg-[var(--color-down)]/20"
                      aria-label={`Delete ${l.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={78}>
            <Panel
              title={current ? current.name : "—"}
              code="QUOT"
              actions={
                <div className="flex items-center gap-1 px-2">
                  <input
                    value={addSymbol}
                    onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                    placeholder="ADD SYMBOL"
                    className="bg-black border border-[var(--color-amber-dim)] px-2 h-[18px] text-[10px] text-[var(--color-amber)] outline-none uppercase tracking-wider w-[140px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSym()
                    }}
                    spellCheck={false}
                  />
                  <button
                    onClick={addSym}
                    className="px-2 h-[18px] bg-[var(--color-amber)] text-black text-[10px] font-bold tracking-widest"
                  >
                    +
                  </button>
                </div>
              }
            >
              <table className="w-full text-[11px]">
                <thead className="bg-[var(--color-panel-2)] sticky top-0 text-[10px] text-[var(--color-mute)]">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-2 py-1 font-normal">SYM</th>
                    <th className="text-right px-2 font-normal">LAST</th>
                    <th className="text-right px-2 font-normal">CHG</th>
                    <th className="text-right px-2 font-normal">%CHG</th>
                    <th className="text-right px-2 font-normal">VOL</th>
                    <th className="text-right px-2 font-normal">RSI</th>
                    <th className="text-right px-2 font-normal">60D</th>
                    <th className="text-right px-2 font-normal">ACT</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-[var(--color-mute)] py-6 tracking-widest text-[11px]">
                        NO SYMBOLS // ADD ABOVE OR USE COMMAND <span className="text-[var(--color-amber)]">EQS</span>
                      </td>
                    </tr>
                  )}
                  {rows.map((e) => {
                    const chg = e.price - e.prevClose
                    return (
                      <tr key={e.symbol} className="bb-row border-b border-[var(--color-border)]">
                        <td className="px-2 py-[3px]">
                          <Link href={`/stock/${e.symbol}?tab=des`} className="text-[var(--color-amber-bright)] hover:underline font-bold">
                            {e.symbol}
                          </Link>
                          <div className="text-[9px] text-[var(--color-mute)] truncate max-w-[180px]">{e.name}</div>
                        </td>
                        <td className="px-2 text-right text-white bb-num">{fmtNum(e.price)}</td>
                        <td className={`px-2 text-right bb-num ${dirColor(chg)}`}>
                          {arrow(chg)} {fmtNum(Math.abs(chg))}
                        </td>
                        <td className={`px-2 text-right bb-num ${dirColor(e.ret1d)}`}>{fmtPct(e.ret1d)}</td>
                        <td className="px-2 text-right text-[var(--color-cyan)] bb-num">{fmtVol(e.volume)}</td>
                        <td className={`px-2 text-right bb-num ${e.rsi14 > 70 ? "text-[var(--color-down)]" : e.rsi14 < 30 ? "text-[var(--color-up)]" : "text-white"}`}>
                          {e.rsi14.toFixed(0)}
                        </td>
                        <td className="px-2 text-right">
                          <Sparkline data={e.spark} width={70} height={14} />
                        </td>
                        <td className="px-2 text-right">
                          <button
                            onClick={() => move(e.symbol, -1)}
                            className="px-1 text-[10px] text-[var(--color-mute)] hover:text-[var(--color-amber)]"
                            aria-label={`Move ${e.symbol} up`}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => move(e.symbol, 1)}
                            className="px-1 text-[10px] text-[var(--color-mute)] hover:text-[var(--color-amber)]"
                            aria-label={`Move ${e.symbol} down`}
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeSym(e.symbol)}
                            className="px-1 text-[10px] text-[var(--color-down)] hover:bg-[var(--color-down)]/20"
                            aria-label={`Remove ${e.symbol}`}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Panel>
          </RPanel>
        </PanelGroup>
      </div>
    </div>
  )
}
