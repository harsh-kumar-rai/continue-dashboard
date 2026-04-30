"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import * as Popover from "@radix-ui/react-popover"
import {
  useTerminalSettings,
  type Density,
  type Locale,
  type Theme,
} from "@/lib/terminal-settings"

const THEMES: Array<[Theme, string]> = [
  ["amber", "AMBER"],
  ["green", "GREEN"],
  ["paper", "PAPER"],
]
const DENSITIES: Array<[Density, string]> = [
  ["compact", "COMPACT"],
  ["normal", "NORMAL"],
  ["comfortable", "COMFORT"],
]
const LOCALES: Array<[Locale, string]> = [
  ["en-IN", "INDIAN (1,23,45,678)"],
  ["en-US", "WESTERN (123,456,789)"],
]

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="px-2 py-[5px] border-b border-[var(--color-border)]">
      <div className="text-[9px] tracking-widest text-[var(--color-mute)] mb-[3px]">{label}</div>
      <div className="flex items-stretch gap-[1px]">{children}</div>
    </div>
  )
}

function Btn({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2 py-1 text-[10px] tracking-widest font-bold border ${
        active
          ? "bg-[var(--color-amber)] text-black border-[var(--color-amber)]"
          : "bg-black text-[var(--color-amber)] border-[var(--color-border-strong)] hover:border-[var(--color-amber-dim)]"
      }`}
    >
      {children}
    </button>
  )
}

export function SettingsPopover() {
  const s = useTerminalSettings()
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-l border-[var(--color-border)] hover:bg-[var(--color-amber-dim)]/30 hover:text-[var(--color-amber-bright)]"
          aria-label="Terminal settings"
        >
          <Settings className="w-3 h-3 mr-1" />
          <span>SETTINGS</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={2}
          className="w-[320px] bg-[var(--color-panel)] border border-[var(--color-amber)] shadow-2xl text-[var(--color-amber)] z-50"
        >
          <div className="flex items-stretch h-[20px] bg-black border-b border-[var(--color-amber-dim)]">
            <div className="flex items-center px-2 bg-[var(--color-amber)] text-black text-[10px] font-bold tracking-widest">
              SETTINGS
            </div>
            <div className="flex-1" />
            <Popover.Close className="px-2 text-[10px] text-[var(--color-mute)] hover:text-[var(--color-amber)] border-l border-[var(--color-border)]">
              CLOSE
            </Popover.Close>
          </div>
          <Row label="THEME">
            {THEMES.map(([k, l]) => (
              <Btn key={k} active={s.theme === k} onClick={() => s.setTheme(k)}>
                {l}
              </Btn>
            ))}
          </Row>
          <Row label="DENSITY">
            {DENSITIES.map(([k, l]) => (
              <Btn key={k} active={s.density === k} onClick={() => s.setDensity(k)}>
                {l}
              </Btn>
            ))}
          </Row>
          <Row label="NUMERAL FORMAT">
            {LOCALES.map(([k, l]) => (
              <Btn key={k} active={s.locale === k} onClick={() => s.setLocale(k)}>
                {l}
              </Btn>
            ))}
          </Row>
          <Row label="ALERT SOUND">
            <Btn active={s.sound} onClick={() => s.setSound(true)}>
              ON
            </Btn>
            <Btn active={!s.sound} onClick={() => s.setSound(false)}>
              OFF
            </Btn>
          </Row>
          <Row label="MARKET-HOURS GATING">
            <Btn active={s.marketHoursStrict} onClick={() => s.setMarketHoursStrict(true)}>
              STRICT
            </Btn>
            <Btn active={!s.marketHoursStrict} onClick={() => s.setMarketHoursStrict(false)}>
              OFF
            </Btn>
          </Row>
          <div className="px-2 py-2 flex items-center justify-between text-[10px] text-[var(--color-mute)]">
            <span>BETAGEN v1.0.0 · PERSISTED LOCAL</span>
            <button
              onClick={() => s.reset()}
              className="px-2 py-[2px] border border-[var(--color-amber-dim)] text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
            >
              RESET
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
