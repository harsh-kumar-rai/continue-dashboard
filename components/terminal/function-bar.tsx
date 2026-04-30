"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { functionKeysFor } from "@/lib/commands"

export function FunctionBar() {
  const pathname = usePathname()
  const keys = functionKeysFor(pathname)
  return (
    <div className="bb-chrome flex items-stretch border-b border-[var(--color-border-strong)] bg-[var(--color-panel)] h-[22px]">
      {keys.map((f) => {
        // Compare paths ignoring query string, since stock keys vary by ?tab=.
        const linkPath = f.path.split("?")[0]
        const active = pathname === linkPath || (linkPath !== "/" && pathname.startsWith(linkPath))
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
