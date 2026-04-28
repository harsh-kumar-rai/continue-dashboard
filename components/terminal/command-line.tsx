"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { parseCommand, suggest, routeToPath } from "@/lib/commands"

export function CommandLine() {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [hIdx, setHIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const suggestions = value ? suggest(value) : []

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Focus on slash, ESC clears
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setOpen(false)
        setValue("")
        inputRef.current?.blur()
      }
      // F-keys handled by global hook elsewhere
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function execute(raw: string) {
    const route = parseCommand(raw)
    if (route.kind === "unknown") {
      // flash
      return
    }
    setHistory((h) => [raw, ...h].slice(0, 30))
    setHIdx(-1)
    setValue("")
    setOpen(false)
    router.push(routeToPath(route))
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (open && suggestions[activeIdx]) {
        execute(suggestions[activeIdx].command)
      } else {
        execute(value)
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (open) setActiveIdx((i) => Math.min(suggestions.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (open) {
        setActiveIdx((i) => Math.max(0, i - 1))
      } else if (history.length) {
        const ni = Math.min(history.length - 1, hIdx + 1)
        setHIdx(ni)
        setValue(history[ni])
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      if (suggestions[activeIdx]) {
        setValue(suggestions[activeIdx].command + " ")
      }
    }
  }

  return (
    <div className="bb-chrome border-b border-[var(--color-border-strong)] bg-black relative">
      <div className="flex items-stretch h-[26px]">
        <div className="flex items-center px-2 bg-[var(--color-amber)] text-black text-[11px] font-bold">CMD&gt;</div>
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
          placeholder="TYPE TICKER OR MNEMONIC, THEN PRESS ENTER. E.G. RELIANCE IN EQUITY DES <GO>"
          className="flex-1 bg-black px-2 text-[12px] text-[var(--color-amber)] outline-none placeholder:text-[var(--color-mute-2)] uppercase tracking-wider"
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
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 max-h-[420px] overflow-y-auto bg-[var(--color-panel)] border border-[var(--color-amber)] shadow-2xl">
          {suggestions.map((s, i) => (
            <div
              key={`${s.command}-${i}`}
              onMouseDown={(e) => {
                e.preventDefault()
                execute(s.command)
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-center gap-3 px-3 py-1 text-[11px] cursor-pointer ${
                i === activeIdx ? "bg-[var(--color-amber-dim)]/50" : "hover:bg-[var(--color-border-strong)]"
              }`}
            >
              <span
                className={`px-1 text-[9px] ${
                  s.category === "STOCK"
                    ? "bg-[var(--color-up)] text-black"
                    : s.category === "INDEX"
                      ? "bg-[var(--color-cyan)] text-black"
                      : s.category === "PAGE"
                        ? "bg-[var(--color-amber)] text-black"
                        : "bg-[var(--color-mute)] text-black"
                }`}
              >
                {s.category}
              </span>
              <span className="text-[var(--color-amber-bright)] font-bold w-[180px]">{s.command}</span>
              <span className="text-[var(--color-mute)] flex-1 truncate">{s.description}</span>
              <span className="text-[var(--color-mute-2)]">&lt;GO&gt;</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
