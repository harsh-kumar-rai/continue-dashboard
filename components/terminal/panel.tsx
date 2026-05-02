"use client"

import type React from "react"

interface PanelProps {
  title: string
  /** Mnemonic shown on the right side of the strip, e.g. "DES". */
  code?: string
  /** Alias for `code`, kept for backwards compatibility. */
  fkey?: string
  /** Optional numbered action menus rendered into the red strip
   *  between the title and the right-side mnemonic. Each becomes a
   *  yellow-numbered Bloomberg-style action like "94 SUGGESTED CHARTS". */
  stripActions?: { num: number; label: string; onClick?: () => void }[]
  /** Free-form actions (icons / buttons) rendered just before the mnemonic. */
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  scroll?: boolean
}

/**
 * Bloomberg-G–styled panel. Body is the signature dark navy (#07172e) and
 * the header is a deep oxblood-red strip with the security/function identifier
 * on the left, optional numbered action menus, and a mnemonic chip on the right.
 */
export function Panel({
  title,
  code,
  fkey,
  stripActions,
  actions,
  children,
  className = "",
  scroll = true,
}: PanelProps) {
  const mnemonic = code ?? fkey
  return (
    <div
      className={`flex flex-col h-full min-h-0 bg-[var(--color-panel)] border border-[var(--color-border-strong)] ${className}`}
    >
      <div className="bb-strip text-[10px]">
        <div className="bb-strip-id">{title}</div>
        {stripActions?.map((a) => (
          <button
            key={a.num}
            onClick={a.onClick}
            className="bb-strip-action"
            type="button"
          >
            <span className="bb-strip-num">{a.num}</span>
            <span>{a.label.toUpperCase()}</span>
          </button>
        ))}
        <div className="flex-1" />
        {actions && <div className="flex items-center gap-1 px-1">{actions}</div>}
        {mnemonic && <div className="bb-strip-tail">{mnemonic}</div>}
      </div>
      <div className={`flex-1 ${scroll ? "overflow-auto" : "overflow-hidden"}`}>{children}</div>
    </div>
  )
}

export function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--color-border)]">
      <div className="px-2 py-[2px] bg-[var(--color-panel-deep)] text-[9px] tracking-widest text-[var(--color-amber-bright)] border-b border-[var(--color-border)]">
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}

// CSS-grid wrapper used by pages that lay out multiple panels with col-span / row-span.
// `cols` controls the number of columns; rows are auto-sized to equal fractions.
export function PanelGrid({
  cols = 4,
  className = "",
  children,
}: {
  cols?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: "minmax(0, 1fr)",
        gap: 1,
        background: "var(--color-border-strong)",
      }}
    >
      {children}
    </div>
  )
}

export function KV({ k, v, color, mono = true }: { k: string; v: React.ReactNode; color?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center px-2 py-[2px] text-[11px] hover:bg-[#112c50]">
      <span className="text-[var(--color-amber-bright)] tracking-wider">{k}</span>
      <span className={`${mono ? "font-mono" : ""} ${color ?? "text-[var(--color-white)]"}`}>{v}</span>
    </div>
  )
}
