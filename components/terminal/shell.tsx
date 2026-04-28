import type React from "react"
import { TopBar } from "./top-bar"
import { FunctionBar } from "./function-bar"
import { CommandLine } from "./command-line"
import { StatusBar } from "./status-bar"
import { KeyboardShortcuts } from "./keyboard-shortcuts"

export function TerminalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-screen bg-black text-[var(--color-amber)] overflow-hidden">
      <KeyboardShortcuts />
      <TopBar />
      <FunctionBar />
      <CommandLine />
      <main className="flex-1 overflow-hidden">{children}</main>
      <StatusBar />
    </div>
  )
}

export function PageTitleBar({
  title,
  subtitle,
  code,
  right,
}: {
  title: string
  subtitle?: string
  code?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-stretch border-b border-[var(--color-amber)] bg-[var(--color-panel)] h-[22px]">
      <div className="flex items-center px-2 bg-[var(--color-amber)] text-black text-[11px] font-bold tracking-widest">
        {title}
      </div>
      {code && (
        <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-r border-[var(--color-border)]">
          {code}
        </div>
      )}
      {subtitle && (
        <div className="flex items-center px-2 text-[10px] text-[var(--color-amber-bright)]">{subtitle}</div>
      )}
      <div className="flex-1" />
      {right}
    </div>
  )
}
