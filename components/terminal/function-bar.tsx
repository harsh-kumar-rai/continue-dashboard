"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FUNCTION_KEYS } from "@/lib/commands"

export function FunctionBar() {
  const pathname = usePathname()
  return (
    <div className="bb-chrome flex items-stretch border-b border-[var(--color-border-strong)] bg-[var(--color-panel)] h-[22px]">
      {FUNCTION_KEYS.map((f) => {
        const active = pathname === f.path || (f.path !== "/" && pathname.startsWith(f.path))
        return (
          <Link
            key={f.key}
            href={f.path}
            className={`flex items-center px-2 gap-1 text-[10px] border-r border-[var(--color-border)] hover:bg-[var(--color-amber-dim)]/30 ${
              active ? "bg-[var(--color-amber)] text-black" : "text-[var(--color-amber)]"
            }`}
          >
            <span className={active ? "text-black" : "text-[var(--color-mute)]"}>{f.key}</span>
            <span className="font-bold tracking-wider">{f.label}</span>
          </Link>
        )
      })}
      <div className="flex-1" />
      <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-l border-[var(--color-border)]">
        <span>NSE</span>
        <span className="mx-1 text-[var(--color-up)]">●</span>
        <span>BSE</span>
        <span className="mx-1 text-[var(--color-up)]">●</span>
        <span>MCX</span>
        <span className="mx-1 text-[var(--color-up)]">●</span>
      </div>
    </div>
  )
}
