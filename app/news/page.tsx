"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { PageTitleBar } from "@/components/terminal/shell"
import { Panel, KV, PanelSection } from "@/components/terminal/panel"
import { NEWS } from "@/lib/mock-data"
import { fmtTime } from "@/lib/format"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"

const SOURCES = ["ALL", "BBG", "REUT", "MINT", "ET", "BSE", "NSE"] as const
const TAGS = ["ALL", "RES", "MGMT", "REG", "MACRO", "FII", "BLOCK", "COR"] as const

const TAG_BG: Record<string, string> = {
  RES: "bg-[var(--color-cyan)] text-black",
  MGMT: "bg-[var(--color-amber)] text-black",
  REG: "bg-[var(--color-magenta)] text-white",
  MACRO: "bg-[var(--color-blue)] text-black",
  FII: "bg-[var(--color-yellow)] text-black",
  BLOCK: "bg-[var(--color-up)] text-black",
  COR: "bg-[var(--color-mute)] text-black",
}

export default function NewsPage() {
  const [source, setSource] = useState<(typeof SOURCES)[number]>("ALL")
  const [tag, setTag] = useState<(typeof TAGS)[number]>("ALL")
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase()
    return NEWS.filter((n) => {
      if (source !== "ALL" && n.src !== source) return false
      if (tag !== "ALL" && n.tag !== tag) return false
      if (q && !n.headline.toUpperCase().includes(q) && !(n.sym ?? "").includes(q)) return false
      return true
    })
  }, [source, tag, query])

  const selected = filtered[selectedIdx] ?? filtered[0]

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar title="NEWS" code="N" subtitle="ALL SOURCES // ALL TAGS // INDIA-FOCUS" />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <RPanel defaultSize={20} minSize={15}>
            <Panel title="FILTERS" code="FILT">
              <PanelSection label="SOURCE">
                <div className="grid grid-cols-2 gap-px bg-[var(--color-border)]">
                  {SOURCES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSource(s)}
                      className={`px-2 py-[3px] text-[10px] tracking-widest text-left ${
                        source === s ? "bg-[var(--color-amber)] text-black font-bold" : "bg-black text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </PanelSection>
              <PanelSection label="TAG">
                <div className="grid grid-cols-2 gap-px bg-[var(--color-border)]">
                  {TAGS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTag(t)}
                      className={`px-2 py-[3px] text-[10px] tracking-widest text-left ${
                        tag === t ? "bg-[var(--color-amber)] text-black font-bold" : "bg-black text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </PanelSection>
              <PanelSection label="QUICK PRESETS">
                <button onClick={() => { setSource("ALL"); setTag("MACRO"); setQuery("") }} className="bb-row text-left w-full px-2 py-[3px] text-[11px] hover:bg-[var(--color-amber-dim)]/20">
                  <span className="text-[var(--color-amber-bright)]">RBI / SEBI / MoF</span>
                  <div className="text-[9px] text-[var(--color-mute)]">REG + MACRO TAGS</div>
                </button>
                <button onClick={() => { setSource("ALL"); setTag("FII"); setQuery("") }} className="bb-row text-left w-full px-2 py-[3px] text-[11px] hover:bg-[var(--color-amber-dim)]/20">
                  <span className="text-[var(--color-amber-bright)]">FII / DII FLOWS</span>
                  <div className="text-[9px] text-[var(--color-mute)]">DAILY ACTIVITY</div>
                </button>
                <button onClick={() => { setSource("ALL"); setTag("RES"); setQuery("") }} className="bb-row text-left w-full px-2 py-[3px] text-[11px] hover:bg-[var(--color-amber-dim)]/20">
                  <span className="text-[var(--color-amber-bright)]">EARNINGS</span>
                  <div className="text-[9px] text-[var(--color-mute)]">RESULTS / GUIDANCE</div>
                </button>
                <button onClick={() => { setSource("ALL"); setTag("BLOCK"); setQuery("") }} className="bb-row text-left w-full px-2 py-[3px] text-[11px] hover:bg-[var(--color-amber-dim)]/20">
                  <span className="text-[var(--color-amber-bright)]">BLOCK / BULK DEALS</span>
                  <div className="text-[9px] text-[var(--color-mute)]">LARGE TRADES</div>
                </button>
              </PanelSection>
              <div className="border-t border-[var(--color-border)] p-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  placeholder="SEARCH HEADLINE / SYMBOL"
                  className="w-full bg-black border border-[var(--color-amber-dim)] px-2 py-1 text-[11px] text-[var(--color-amber)] outline-none focus:border-[var(--color-amber)] uppercase tracking-wider placeholder:text-[var(--color-mute-2)]"
                  spellCheck={false}
                  autoCorrect="off"
                />
              </div>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={45}>
            <Panel
              title={`HEADLINES — ${filtered.length}`}
              code="N"
              actions={<div className="px-2 text-[10px] text-[var(--color-mute)]">SORTED BY TIME</div>}
            >
              <div className="divide-y divide-[var(--color-border)]">
                {filtered.length === 0 && (
                  <div className="p-6 text-center text-[var(--color-mute)] text-[11px] tracking-widest">NO RESULTS // ADJUST FILTERS // F1 FOR HELP</div>
                )}
                {filtered.map((n, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    className={`w-full text-left bb-row px-2 py-1 text-[11px] ${
                      i === selectedIdx ? "bg-[var(--color-amber-dim)]/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-mute)]">
                      <span>{fmtTime(n.t)}</span>
                      <span className="text-[var(--color-amber-bright)] font-bold">{n.src}</span>
                      {n.tag && <span className={`px-1 text-[9px] font-bold ${TAG_BG[n.tag]}`}>{n.tag}</span>}
                      {n.sym && <span className="text-[var(--color-cyan)] font-bold">{n.sym}</span>}
                    </div>
                    <div className="text-white tracking-tight mt-[1px]">{n.headline}</div>
                  </button>
                ))}
              </div>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={35}>
            <Panel title="STORY" code="STRY">
              {!selected ? (
                <div className="p-4 text-[var(--color-mute)] text-[11px]">SELECT A HEADLINE</div>
              ) : (
                <div className="p-3 text-[12px] text-white space-y-3">
                  <div className="text-[10px] text-[var(--color-mute)] flex items-center gap-2">
                    <span>{fmtTime(selected.t)}</span>
                    <span className="text-[var(--color-amber-bright)] font-bold">{selected.src}</span>
                    {selected.tag && <span className={`px-1 text-[9px] font-bold ${TAG_BG[selected.tag]}`}>{selected.tag}</span>}
                  </div>
                  <h2 className="text-[14px] font-bold text-[var(--color-amber-bright)] tracking-tight leading-snug">
                    {selected.headline}
                  </h2>
                  <p className="text-[var(--color-mute)] text-[11px] leading-relaxed">
                    Detailed story body would stream here from the wire feed. The terminal supports inline-symbol auto-tagging
                    and live updates via the news ticker. Use ALT+T to toggle ticker sound, F1 for help, and command palette
                    (/) to jump to related instruments.
                  </p>
                  {selected.sym && (
                    <PanelSection label="RELATED INSTRUMENT">
                      <div className="px-2 py-1 flex items-center gap-2">
                        <Link
                          href={`/stock/${selected.sym}?tab=des`}
                          className="text-[var(--color-amber-bright)] hover:underline font-bold text-[12px]"
                        >
                          {selected.sym}
                        </Link>
                        <span className="text-[10px] text-[var(--color-mute)]">IN EQUITY</span>
                        <Link
                          href={`/chart/${selected.sym}`}
                          className="ml-auto px-2 h-[18px] flex items-center text-[10px] border border-[var(--color-border)] hover:bg-[var(--color-amber-dim)]/30"
                        >
                          GP
                        </Link>
                        <Link
                          href={`/options/${selected.sym}`}
                          className="px-2 h-[18px] flex items-center text-[10px] border border-[var(--color-border)] hover:bg-[var(--color-amber-dim)]/30"
                        >
                          OMON
                        </Link>
                      </div>
                    </PanelSection>
                  )}
                  <PanelSection label="META">
                    <KV k="WIRE" v={selected.src} />
                    <KV k="TAG" v={selected.tag ?? "—"} />
                    <KV k="TIMESTAMP" v={new Date(selected.t).toLocaleString("en-IN", { hour12: false }).toUpperCase()} />
                  </PanelSection>
                </div>
              )}
            </Panel>
          </RPanel>
        </PanelGroup>
      </div>
    </div>
  )
}
