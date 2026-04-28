"use client"

import { useState, useEffect, use } from "react"
import { useSearchParams, notFound } from "next/navigation"
import { StockHeader } from "@/components/panels/stock-header"
import {
  DesTab,
  ChartTab,
  FundamentalsTab,
  EarningsTab,
  HoldersTab,
  NewsTab,
} from "@/components/panels/stock-tabs"
import { Panel } from "@/components/terminal/panel"
import { OIHeatmap } from "@/components/charts/oi-heatmap"
import { getEquity } from "@/lib/mock-data"

export default function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params)
  const sp = useSearchParams()
  const initial = sp.get("tab") ?? "des"
  const [tab, setTab] = useState(initial)

  useEffect(() => {
    setTab(sp.get("tab") ?? "des")
  }, [sp])

  const eq = getEquity(decodeURIComponent(symbol))
  if (!eq) return notFound()

  return (
    <div className="flex flex-col h-full">
      <StockHeader eq={eq} tab={tab} onTab={setTab} />
      <div className="flex-1 overflow-hidden">
        {tab === "des" && <DesTab eq={eq} />}
        {tab === "chart" && <ChartTab eq={eq} />}
        {tab === "fundamentals" && <FundamentalsTab eq={eq} />}
        {tab === "earnings" && <EarningsTab eq={eq} />}
        {tab === "holders" && <HoldersTab eq={eq} />}
        {tab === "news" && <NewsTab eq={eq} />}
        {tab === "options" && (
          <Panel title={`${eq.symbol} OPTIONS — NEAREST EXPIRY`} code="OMON">
            <OIHeatmap underlying="NIFTY" />
          </Panel>
        )}
      </div>
    </div>
  )
}
