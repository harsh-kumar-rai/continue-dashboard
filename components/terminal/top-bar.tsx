"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { INDICES, EQUITIES } from "@/lib/mock-data"
import { fmtNum, fmtPct, dirColor, arrow } from "@/lib/format"
import { SettingsPopover } from "./settings-popover"

export function TopBar() {
  const [time, setTime] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const pathname = usePathname()

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setTime(d.toLocaleTimeString("en-IN", { hour12: false }))
      setDate(
        d
          .toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
          .toUpperCase(),
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Resolve the currently-loaded security from the URL so users always see the
  // active context (Bloomberg keeps the loaded ticker pinned in the chrome).
  const active = useMemo(() => {
    const segs = pathname.split("/").filter(Boolean)
    if (segs.length < 2) return null
    const sym = decodeURIComponent(segs[1] ?? "")
    if (segs[0] === "stock" || segs[0] === "options") {
      const eq = EQUITIES.find((e) => e.symbol === sym)
      if (eq) {
        return {
          kind: "EQUITY" as const,
          symbol: eq.symbol,
          name: eq.name,
          last: eq.price,
          ret: eq.ret1d,
        }
      }
    }
    if (segs[0] === "index") {
      const ix = INDICES.find((i) => i.symbol === sym)
      if (ix) {
        return {
          kind: "INDEX" as const,
          symbol: ix.symbol,
          name: ix.name,
          last: ix.value,
          ret: ix.ret1d,
        }
      }
    }
    if (segs[0] === "chart") {
      const eq = EQUITIES.find((e) => e.symbol === sym)
      if (eq) {
        return { kind: "EQUITY" as const, symbol: eq.symbol, name: eq.name, last: eq.price, ret: eq.ret1d }
      }
      const ix = INDICES.find((i) => i.symbol === sym)
      if (ix) {
        return { kind: "INDEX" as const, symbol: ix.symbol, name: ix.name, last: ix.value, ret: ix.ret1d }
      }
    }
    return null
  }, [pathname])

  // Build a long, repeating ticker stream: indices first, then top equities by mcap.
  const tape = useMemo(() => {
    const idx = INDICES.map((i) => ({ sym: i.symbol, val: i.value, ret: i.ret1d }))
    const eqs = [...EQUITIES]
      .sort((a, b) => b.mcap - a.mcap)
      .slice(0, 24)
      .map((e) => ({ sym: e.symbol, val: e.price, ret: e.ret1d }))
    return [...idx, ...eqs]
  }, [])

  return (
    <div className="bb-chrome flex items-stretch border-b border-[var(--color-amber)] bg-black h-[24px]">
      <div className="flex items-center bg-[var(--color-amber)] text-black px-2 font-bold text-[11px] tracking-wider">
        BETAGEN
      </div>
      <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-r border-[var(--color-border)]">
        IND
      </div>

      {/* Active security context — pinned, like the Bloomberg "loaded ticker" header */}
      {active && (
        <div className="flex items-center gap-2 px-2 text-[10px] border-r border-[var(--color-border)] bg-[#0a0700]">
          <span className="text-[var(--color-mute)]">LOAD</span>
          <span className="text-[var(--color-amber-bright)] font-bold">{active.symbol}</span>
          <span className="bb-token" style={{ fontSize: 9, padding: "0 3px", margin: 0 }}>
            {active.kind}
          </span>
          <span className="text-white">{fmtNum(active.last)}</span>
          <span className={dirColor(active.ret)}>
            {arrow(active.ret)} {fmtPct(active.ret)}
          </span>
        </div>
      )}

      {/* Continuous scrolling ticker tape (marquee) */}
      <div className="flex-1 overflow-hidden flex items-center relative">
        <div className="bb-marquee text-[10px] whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-4 px-3 shrink-0">
              {tape.map((t, i) => (
                <span key={`${dup}-${t.sym}-${i}`} className="flex items-center gap-1">
                  <span className="text-[var(--color-white)] font-bold">{t.sym}</span>
                  <span className="text-[var(--color-amber)]">{fmtNum(t.val)}</span>
                  <span className={dirColor(t.ret)}>
                    {arrow(t.ret)} {fmtPct(t.ret)}
                  </span>
                  <span className="text-[var(--color-mute-2)]">|</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-l border-[var(--color-border)]">
        <span>{date}</span>
        <span className="mx-2 text-[var(--color-amber)] font-bold">{time}</span>
        <span>IST</span>
      </div>
      <SettingsPopover />
    </div>
  )
}
