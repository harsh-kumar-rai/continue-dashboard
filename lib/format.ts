// Indian numeric formatting + colors
export function fmtNum(n: number, decimals = 2): string {
  if (!isFinite(n)) return "—"
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function fmtInt(n: number): string {
  if (!isFinite(n)) return "—"
  return Math.round(n).toLocaleString("en-IN")
}

export function fmtPct(n: number, decimals = 2): string {
  if (!isFinite(n)) return "—"
  const sign = n > 0 ? "+" : ""
  return `${sign}${(n * 100).toFixed(decimals)}%`
}

export function fmtBpsOrPct(n: number): string {
  return fmtPct(n)
}

// Crore / Lakh formatting
export function fmtCr(n: number): string {
  // n in INR
  if (Math.abs(n) >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`
  if (Math.abs(n) >= 1e5) return `${(n / 1e5).toFixed(2)}L`
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(2)
}

// mcap is already in crore
export function fmtMcap(crore: number): string {
  if (crore >= 1e5) return `${(crore / 1e5).toFixed(2) }L Cr`
  if (crore >= 1000) return `${(crore / 1000).toFixed(2)}K Cr`
  return `${crore.toFixed(0)} Cr`
}

// Volume in lakh / crore
export function fmtVol(n: number): string {
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export function dirColor(n: number): string {
  if (n > 0) return "text-[var(--color-up)]"
  if (n < 0) return "text-[var(--color-down)]"
  return "text-[var(--color-flat)]"
}

export function dirBg(n: number, intensity = 0.4): string {
  // For heatmap-like cells
  return ""
}

export function pctChange(now: number, prev: number): number {
  if (!prev) return 0
  return (now - prev) / prev
}

export function fmtTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
}

export function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase()
}

export function arrow(n: number): string {
  if (n > 0) return "▲"
  if (n < 0) return "▼"
  return "▬"
}

// Aliases used by some pages
export const fmt = fmtNum

// Format a raw INR amount with the ₹ symbol and Indian numerals.
// Supports negative values and scales to L / Cr.
export function fmtINR(n: number): string {
  if (!isFinite(n)) return "—"
  const sign = n < 0 ? "-" : ""
  const a = Math.abs(n)
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)}Cr`
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(2)}L`
  if (a >= 1e3) return `${sign}₹${a.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
  return `${sign}₹${a.toFixed(2)}`
}
