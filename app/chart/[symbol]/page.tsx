"use client"

import { use, useMemo } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import { ChartWorkbench } from "@/components/charts/chart-workbench"
import { PageTitleBar } from "@/components/terminal/shell"
import { EQUITIES, INDICES } from "@/lib/mock-data"
import { fmtNum, fmtPct, dirColor, arrow } from "@/lib/format"

type Params = { symbol: string }

export default function ChartPage({ params }: { params: Promise<Params> }) {
  const { symbol: rawSym } = use(params)
  const sp = useSearchParams()
  const router = useRouter()
  const symbol = decodeURIComponent(rawSym).toUpperCase()

  const eq = EQUITIES.find((e) => e.symbol === symbol)
  const idx = INDICES.find((i) => i.symbol === symbol)

  // Allow ?tf=...&type=... as initial state passed by command parser
  const initialTimeframe = (sp.get("tf") as "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX" | null) ?? "1Y"
  const initialType = (sp.get("type") as "candle" | "line" | "area" | "bar" | null) ?? "candle"

  // Build a small "summary strip" so the page also acts as a quick quote view.
  const summary = useMemo(() => {
    if (eq) {
      return {
        name: eq.name,
        last: eq.price,
        chg: eq.price - eq.prevClose,
        chgPct: (eq.price - eq.prevClose) / eq.prevClose,
        meta: [
          ["O", fmtNum(eq.open)],
          ["H", fmtNum(eq.high)],
          ["L", fmtNum(eq.low)],
          ["VOL", `${(eq.volume / 1e5).toFixed(2)}L`],
          ["52W H", fmtNum(eq.high52)],
          ["52W L", fmtNum(eq.low52)],
        ] as Array<[string, string]>,
      }
    }
    if (idx) {
      return {
        name: idx.name,
        last: idx.value,
        chg: idx.value - idx.prevClose,
        chgPct: (idx.value - idx.prevClose) / idx.prevClose,
        meta: [
          ["O", fmtNum(idx.open)],
          ["H", fmtNum(idx.high)],
          ["L", fmtNum(idx.low)],
          ["YTD", fmtPct(idx.retYtd)],
          ["1Y", fmtPct(idx.ret1y)],
        ] as Array<[string, string]>,
      }
    }
    return null
  }, [eq, idx])

  if (!summary) return notFound()

  return (
    <div className="flex flex-col h-full min-h-0">
      <PageTitleBar
        title={`${symbol} CHART`}
        code="GP"
        subtitle={summary.name}
        right={
          <div className="flex items-center gap-2 px-2 text-[10px]">
            <span className="text-white tabular-nums">{fmtNum(summary.last)}</span>
            <span className={`tabular-nums ${dirColor(summary.chg)}`}>
              {arrow(summary.chg)} {fmtNum(summary.chg)} ({fmtPct(summary.chgPct)})
            </span>
            {summary.meta.map(([k, v]) => (
              <span key={k} className="text-[var(--color-mute)]">
                {k} <span className="text-white">{v}</span>
              </span>
            ))}
            {eq && (
              <button
                onClick={() => router.push(`/stock/${symbol}?tab=des`)}
                className="border border-[var(--color-border)] px-2 h-[18px] hover:bg-[var(--color-amber-dim)]/30"
                title="Open security description"
              >
                DES
              </button>
            )}
          </div>
        }
      />
      <div className="flex-1 min-h-0">
        <ChartWorkbench symbol={symbol} initialTimeframe={initialTimeframe} initialType={initialType} />
      </div>
    </div>
  )
}
