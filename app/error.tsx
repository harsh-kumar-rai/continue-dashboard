"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface in dev for debugging
    console.error("[v0] terminal error:", error)
  }, [error])

  return (
    <div className="flex flex-col h-full bg-black text-[var(--color-amber)]">
      <div className="flex items-stretch border-b border-[var(--color-down)] bg-[var(--color-panel)] h-[22px]">
        <div className="flex items-center px-2 bg-[var(--color-down)] text-black text-[11px] font-bold tracking-widest">
          ERROR
        </div>
        <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)]">
          UNHANDLED EXCEPTION · PANEL HALTED
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-[720px] w-full">
          <div className="border border-[var(--color-down)] bg-[var(--color-panel)]">
            <div className="flex items-stretch h-[20px] bg-black border-b border-[var(--color-down)]">
              <div className="flex items-center px-2 bg-[var(--color-down)] text-black text-[10px] font-bold tracking-widest">
                STACK TRACE
              </div>
              <div className="flex-1" />
              {error.digest && (
                <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)]">
                  ID {error.digest}
                </div>
              )}
            </div>
            <div className="p-4 text-[11px]">
              <div className="text-[var(--color-amber-bright)] font-bold tracking-widest mb-2">
                {error.name?.toUpperCase() ?? "RUNTIME ERROR"}
              </div>
              <pre className="text-[var(--color-down)] whitespace-pre-wrap break-words leading-[1.4]">
                {error.message || "AN UNEXPECTED ERROR OCCURRED IN THE TERMINAL."}
              </pre>
            </div>
            <div className="border-t border-[var(--color-border)] p-2 flex items-center gap-2">
              <button
                onClick={reset}
                className="px-3 py-1 bg-[var(--color-amber)] text-black text-[10px] font-bold tracking-widest hover:bg-[var(--color-amber-bright)]"
              >
                RETRY
              </button>
              <Link
                href="/"
                className="px-3 py-1 border border-[var(--color-amber-dim)] text-[var(--color-amber)] text-[10px] font-bold tracking-widest hover:bg-[var(--color-amber-dim)]/30"
              >
                TOP
              </Link>
              <Link
                href="/help"
                className="px-3 py-1 border border-[var(--color-amber-dim)] text-[var(--color-amber)] text-[10px] font-bold tracking-widest hover:bg-[var(--color-amber-dim)]/30"
              >
                HELP
              </Link>
              <div className="flex-1" />
              <span className="text-[10px] text-[var(--color-mute)]">PRESS F1 FOR HELP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
