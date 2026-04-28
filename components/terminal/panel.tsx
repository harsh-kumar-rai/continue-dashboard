"use client"

import type React from "react"

interface PanelProps {
  title: string
  code?: string // mnemonic shown top-right e.g. "DES"
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  scroll?: boolean
}

export function Panel({ title, code, actions, children, className = "", scroll = true }: PanelProps) {
  return (
    <div className={`flex flex-col h-full bg-[var(--color-panel)] border border-[var(--color-border-strong)] ${className}`}>
      <div className="flex items-stretch h-[20px] bg-black border-b border-[var(--color-amber-dim)]">
        <div className="flex items-center px-2 bg-[var(--color-amber)] text-black text-[10px] font-bold tracking-widest">
          {title}
        </div>
        <div className="flex-1" />
        {actions && <div className="flex items-center gap-1 px-1">{actions}</div>}
        {code && (
          <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-l border-[var(--color-border)]">
            {code}
          </div>
        )}
      </div>
      <div className={`flex-1 ${scroll ? "overflow-auto" : "overflow-hidden"}`}>{children}</div>
    </div>
  )
}

export function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--color-border)]">
      <div className="px-2 py-[2px] bg-black text-[9px] tracking-widest text-[var(--color-mute)] border-b border-[var(--color-border)]">
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function KV({ k, v, color, mono = true }: { k: string; v: React.ReactNode; color?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center px-2 py-[2px] text-[11px] hover:bg-[var(--color-amber-dim)]/10">
      <span className="text-[var(--color-mute)] tracking-wider">{k}</span>
      <span className={`${mono ? "font-mono" : ""} ${color ?? "text-[var(--color-white)]"}`}>{v}</span>
    </div>
  )
}
