"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { parseCommand, suggest, routeToPath, type Suggestion } from "@/lib/commands"

// Tokens that the parser treats as "yellow keys" — visually rendered as Bloomberg
// market-sector chips on top of the input.
const YELLOW_TOKENS = new Set(["EQUITY", "INDEX", "EQ", "IDX", "IN", "INDIA"])
const GO_TOKENS = new Set(["<GO>", "GO"])

export function CommandLine() {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [hIdx, setHIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const suggestions = value ? suggest(value) : []

  // Split suggestions into 3 columns — Functions, Securities, Search
  const columns = useMemo(() => {
    const fns: Suggestion[] = []
    const secs: Suggestion[] = []
    const srch: Suggestion[] = []
    for (const s of suggestions) {
      if (s.category === "PAGE" || s.category === "FUNCTION") fns.push(s)
      else if (s.category === "STOCK" || s.category === "INDEX") secs.push(s)
      else srch.push(s)
    }
    return { fns: fns.slice(0, 8), secs: secs.slice(0, 8), srch: srch.slice(0, 6) }
  }, [suggestions])

  // Flat list still drives keyboard navigation (top-to-bottom, fns -> secs -> srch).
  const flat = useMemo(
    () => [...columns.fns, ...columns.secs, ...columns.srch],
    [columns],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Persistent focus: any printable key while not in another input refocuses CMD.
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setOpen(false)
        setValue("")
        inputRef.current?.blur()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Visually tokenize the command line input — render <EQUITY>, <INDEX>, <GO>
  // as colored chips behind the input glyphs so the user gets immediate parser
  // feedback (the real terminal does this with physical yellow market keys).
  const tokens = useMemo(() => {
    const raw = value.trim()
    if (!raw) return []
    return raw.split(/\s+/)
  }, [value])

  function execute(raw: string) {
    const route = parseCommand(raw)
    if (route.kind === "unknown") return
    setHistory((h) => [raw, ...h].slice(0, 30))
    setHIdx(-1)
    setValue("")
    setOpen(false)
    router.push(routeToPath(route))
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (open && flat[activeIdx]) {
        execute(flat[activeIdx].command)
      } else {
        execute(value)
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (open) setActiveIdx((i) => Math.min(flat.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (open && flat.length) {
        setActiveIdx((i) => Math.max(0, i - 1))
      } else if (history.length) {
        const ni = Math.min(history.length - 1, hIdx + 1)
        setHIdx(ni)
        setValue(history[ni])
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      if (flat[activeIdx]) {
        setValue(flat[activeIdx].command + " ")
      }
    } else if (e.key === "F8") {
      // Map F8 to insert <EQUITY> token (real Bloomberg yellow key parity)
      e.preventDefault()
      setValue((v) => (v.endsWith(" ") || v === "" ? v + "EQUITY " : v + " EQUITY "))
    }
  }

  const hasTokens = tokens.some((t) => {
    const u = t.toUpperCase()
    return YELLOW_TOKENS.has(u) || GO_TOKENS.has(u)
  })

  return (
    <div className="bb-chrome border-b border-[var(--color-border-strong)] bg-black relative">
      <div className="flex items-stretch h-[26px]">
        <div className="flex items-center px-2 bg-[var(--color-amber)] text-black text-[11px] font-bold">
          CMD&gt;
        </div>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase())
            setOpen(true)
            setActiveIdx(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
          placeholder="TYPE TICKER OR MNEMONIC, THEN PRESS ENTER. E.G. RELIANCE IN EQUITY DES <GO>  ·  F8=<EQUITY>"
          className="flex-1 bg-transparent px-2 text-[12px] text-[var(--color-amber)] outline-none placeholder:text-[var(--color-mute-2)] uppercase tracking-wider caret-[var(--color-amber-bright)]"
          spellCheck={false}
          autoCorrect="off"
          autoComplete="off"
        />

        <button
          onClick={() => execute(value)}
          className="px-3 bg-[var(--color-amber)] text-black text-[11px] font-bold tracking-widest hover:bg-[var(--color-amber-bright)]"
        >
          &lt;GO&gt;
        </button>
      </div>

      {/* Parser feedback strip — Bloomberg shows the tokenized command back to
          the user as discrete yellow market-sector chips. */}
      {hasTokens && (
        <div className="flex items-center gap-1 px-2 h-[18px] bg-[#0a0700] border-t border-[var(--color-border)] text-[10px]">
          <span className="text-[var(--color-mute)] tracking-widest">PARSE</span>
          {tokens.map((t, i) => {
            const u = t.toUpperCase()
            if (YELLOW_TOKENS.has(u)) {
              return (
                <span key={i} className="bb-token" style={{ fontSize: 9 }}>
                  {u}
                </span>
              )
            }
            if (GO_TOKENS.has(u)) {
              return (
                <span key={i} className="bb-token bb-token-go" style={{ fontSize: 9 }}>
                  &lt;GO&gt;
                </span>
              )
            }
            return (
              <span key={i} className="text-[var(--color-amber-bright)] font-bold">
                {u}
              </span>
            )
          })}
        </div>
      )}

      {open && flat.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 bg-black border border-[var(--color-amber)] shadow-2xl">
          {/* 3-column header — Functions / Securities / Search */}
          <div className="grid grid-cols-3 border-b border-[var(--color-amber-dim)] text-[9px] tracking-widest">
            <div className="px-2 py-[2px] bg-[var(--color-amber)] text-black font-bold">FUNCTIONS</div>
            <div className="px-2 py-[2px] bg-[var(--color-yellow)] text-black font-bold border-l border-black">
              SECURITIES
            </div>
            <div className="px-2 py-[2px] bg-[var(--color-cyan)] text-black font-bold border-l border-black">
              SEARCH
            </div>
          </div>
          <div className="grid grid-cols-3 max-h-[420px] overflow-y-auto">
            <SuggestColumn items={columns.fns} flat={flat} activeIdx={activeIdx} setActiveIdx={setActiveIdx} execute={execute} empty="—" />
            <SuggestColumn items={columns.secs} flat={flat} activeIdx={activeIdx} setActiveIdx={setActiveIdx} execute={execute} empty="—" />
            <SuggestColumn items={columns.srch} flat={flat} activeIdx={activeIdx} setActiveIdx={setActiveIdx} execute={execute} empty="—" />
          </div>
          <div className="px-2 py-[2px] text-[9px] text-[var(--color-mute)] border-t border-[var(--color-border)] tracking-widest">
            ↑↓ NAVIGATE · TAB COMPLETE · ENTER &lt;GO&gt; · ESC CANCEL · F8 EQUITY
          </div>
        </div>
      )}
    </div>
  )
}

function SuggestColumn({
  items,
  flat,
  activeIdx,
  setActiveIdx,
  execute,
  empty,
}: {
  items: Suggestion[]
  flat: Suggestion[]
  activeIdx: number
  setActiveIdx: (n: number) => void
  execute: (raw: string) => void
  empty: string
}) {
  return (
    <div className="border-l border-[var(--color-border)] first:border-l-0">
      {items.length === 0 && (
        <div className="px-2 py-1 text-[10px] text-[var(--color-mute-2)] tracking-widest">{empty}</div>
      )}
      {items.map((s) => {
        const flatIdx = flat.indexOf(s)
        const active = flatIdx === activeIdx
        return (
          <div
            key={`${s.command}-${flatIdx}`}
            onMouseDown={(e) => {
              e.preventDefault()
              execute(s.command)
            }}
            onMouseEnter={() => setActiveIdx(flatIdx)}
            className={`px-2 py-[2px] text-[10px] cursor-pointer ${
              active ? "bg-[var(--color-amber)] text-black" : "hover:bg-[var(--color-amber-dim)]/30"
            }`}
          >
            <div className={active ? "font-bold" : "text-[var(--color-amber-bright)] font-bold"}>{s.command}</div>
            <div className={active ? "text-black/70 truncate" : "text-[var(--color-mute)] truncate"}>{s.description}</div>
          </div>
        )
      })}
    </div>
  )
}
