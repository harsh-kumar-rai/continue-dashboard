"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type Theme = "amber" | "green" | "paper"
export type Density = "compact" | "normal" | "comfortable"
export type Locale = "en-IN" | "en-US"

export interface TerminalSettings {
  theme: Theme
  density: Density
  locale: Locale
  sound: boolean
  marketHoursStrict: boolean
}

const DEFAULT_SETTINGS: TerminalSettings = {
  theme: "amber",
  density: "normal",
  locale: "en-IN",
  sound: false,
  marketHoursStrict: false,
}

const STORAGE_KEY = "betagen.settings.v1"

interface Ctx extends TerminalSettings {
  setTheme: (t: Theme) => void
  setDensity: (d: Density) => void
  setLocale: (l: Locale) => void
  setSound: (s: boolean) => void
  setMarketHoursStrict: (m: boolean) => void
  reset: () => void
}

const SettingsContext = createContext<Ctx | null>(null)

export function TerminalSettingsProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from localStorage on first client paint to avoid theme flash.
  const [s, setS] = useState<TerminalSettings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TerminalSettings>
        setS({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  // Persist whenever settings change (after hydration so we don't overwrite with defaults).
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      /* ignore */
    }
  }, [s, hydrated])

  // Reflect theme & density on <html> so CSS selectors like [data-theme="green"] apply globally.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = s.theme
    root.dataset.density = s.density
  }, [s.theme, s.density])

  const value = useMemo<Ctx>(
    () => ({
      ...s,
      setTheme: (theme) => setS((p) => ({ ...p, theme })),
      setDensity: (density) => setS((p) => ({ ...p, density })),
      setLocale: (locale) => setS((p) => ({ ...p, locale })),
      setSound: (sound) => setS((p) => ({ ...p, sound })),
      setMarketHoursStrict: (marketHoursStrict) => setS((p) => ({ ...p, marketHoursStrict })),
      reset: () => setS(DEFAULT_SETTINGS),
    }),
    [s],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useTerminalSettings(): Ctx {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    // Fallback so component trees can render outside the provider during SSR/first paint.
    const noop = () => {
      /* no-op */
    }
    return {
      ...DEFAULT_SETTINGS,
      setTheme: noop,
      setDensity: noop,
      setLocale: noop,
      setSound: noop,
      setMarketHoursStrict: noop,
      reset: noop,
    }
  }
  return ctx
}

// ---------- Market session helpers (NSE: 09:15 - 15:30 IST, Mon-Fri) ----------

export type MarketSession = "PRE" | "OPEN" | "POST" | "CLOSED"

export interface MarketStatus {
  session: MarketSession
  // ms until the next session boundary (open / pre-open / close)
  msToNext: number
  nextLabel: string
  // current IST clock as Date (note: the underlying instant is real, only the display is IST)
  istNow: Date
}

const IST_OFFSET_MIN = 5 * 60 + 30
function toIst(d: Date): Date {
  // Returns a Date whose UTC fields represent IST wall-clock. Useful for getHours()/getDay() math.
  const localOffsetMin = d.getTimezoneOffset()
  return new Date(d.getTime() + (IST_OFFSET_MIN + localOffsetMin) * 60_000)
}

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const ist = toIst(now)
  const day = ist.getUTCDay() // 0=Sun..6=Sat (after our shift, getUTCDay() reflects IST day)
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes()
  const PRE_OPEN = 9 * 60 // 09:00
  const OPEN = 9 * 60 + 15 // 09:15
  const CLOSE = 15 * 60 + 30 // 15:30
  const POST_END = 16 * 60 // 16:00

  let session: MarketSession = "CLOSED"
  if (day >= 1 && day <= 5) {
    if (minutes >= PRE_OPEN && minutes < OPEN) session = "PRE"
    else if (minutes >= OPEN && minutes < CLOSE) session = "OPEN"
    else if (minutes >= CLOSE && minutes < POST_END) session = "POST"
  }

  const istMidnightUtc = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate())
  const istNowUtc = istMidnightUtc + minutes * 60_000
  // produce "real" Date corresponding to a target IST minute on the same day
  const targetAt = (mins: number) => {
    const istLocalOffset = now.getTimezoneOffset()
    return new Date(istMidnightUtc + mins * 60_000 - (IST_OFFSET_MIN + istLocalOffset) * 60_000 + istLocalOffset * 60_000)
  }

  let nextLabel = ""
  let msToNext = 0
  if (session === "OPEN") {
    nextLabel = "CLOSE"
    msToNext = (CLOSE - minutes) * 60_000 - ist.getUTCSeconds() * 1000 - ist.getUTCMilliseconds()
  } else if (session === "PRE") {
    nextLabel = "OPEN"
    msToNext = (OPEN - minutes) * 60_000 - ist.getUTCSeconds() * 1000
  } else if (session === "POST") {
    nextLabel = "POST END"
    msToNext = (POST_END - minutes) * 60_000 - ist.getUTCSeconds() * 1000
  } else {
    nextLabel = "PRE-OPEN"
    // find next weekday and PRE_OPEN
    let addDays = 1
    let nd = (day + 1) % 7
    while (nd === 0 || nd === 6) {
      addDays++
      nd = (nd + 1) % 7
    }
    // if today and minutes < PRE_OPEN
    if (day >= 1 && day <= 5 && minutes < PRE_OPEN) {
      addDays = 0
    }
    msToNext = (PRE_OPEN - minutes) * 60_000 + addDays * 24 * 60 * 60_000
  }

  // Avoid unused warnings for helpers above.
  void istNowUtc
  void targetAt

  return { session, msToNext: Math.max(0, msToNext), nextLabel, istNow: ist }
}

export function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}H ${m.toString().padStart(2, "0")}M`
  return `${m}:${sec.toString().padStart(2, "0")}`
}
