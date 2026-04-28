"use client"

import { Panel } from "@/components/terminal/panel"
import { STOCKS } from "@/lib/mock-data"
import { fmt, fmtPct } from "@/lib/format"
import { useMemo, useState } from "react"
import Link from "next/link"

interface Filter {
  id: string
  field: keyof typeof STOCKS[0]
  op: ">" | "<" | ">=" | "<=" | "="
  value: number
  enabled: boolean
}

const FIELD_OPTIONS: { value: keyof typeof STOCKS[0]; label: string }[] = [
  { value: "marketCap", label: "MCAP (Cr)" },
  { value: "pe", label: "P/E" },
  { value: "pb", label: "P/B" },
  { value: "divYield", label: "DIV YLD %" },
  { value: "beta", label: "BETA" },
  { value: "changePct", label: "CHG %" },
  { value: "rsi", label: "RSI(14)" },
  { value: "last", label: "LTP" },
  { value: "volume", label: "VOL" },
  { value: "high52w", label: "52W H" },
  { value: "low52w", label: "52W L" },
]

export default function ScreenerPage() {
  const [filters, setFilters] = useState<Filter[]>([
    { id: "f1", field: "marketCap", op: ">", value: 100000, enabled: true },
    { id: "f2", field: "pe", op: "<", value: 30, enabled: true },
    { id: "f3", field: "rsi", op: "<", value: 70, enabled: true },
  ])
  const [sortBy, setSortBy] = useState<keyof typeof STOCKS[0]>("marketCap")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const results = useMemo(() => {
    const filtered = STOCKS.filter((s) => {
      return filters.every((f) => {
        if (!f.enabled) return true
        const v = s[f.field] as number
        if (typeof v !== "number") return true
        switch (f.op) {
          case ">": return v > f.value
          case "<": return v < f.value
          case ">=": return v >= f.value
          case "<=": return v <= f.value
          case "=": return v === f.value
        }
      })
    })
    return filtered.sort((a, b) => {
      const av = a[sortBy] as number
      const bv = b[sortBy] as number
      return sortDir === "asc" ? av - bv : bv - av
    })
  }, [filters, sortBy, sortDir])

  const updateFilter = (id: string, patch: Partial<Filter>) =>
    setFilters((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  const removeFilter = (id: string) => setFilters((p) => p.filter((f) => f.id !== id))
  const addFilter = () =>
    setFilters((p) => [...p, { id: `f${Date.now()}`, field: "pe", op: "<", value: 25, enabled: true }])

  const toggleSort = (col: keyof typeof STOCKS[0]) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortBy(col)
      setSortDir("desc")
    }
  }

  const sortIndicator = (col: string) => (sortBy === col ? (sortDir === "asc" ? " ▲" : " ▼") : "")

  return (
    <div className="flex flex-col h-full">
      <Panel title="FILTERS" fkey="EQS" className="border-b border-border-strong" actions={
        <button onClick={addFilter} className="text-amber hover:bg-amber hover:text-bg px-2 py-0.5 border border-amber font-bold">
          + ADD
        </button>
      }>
        <div className="p-2 text-[11px] font-mono">
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <div key={f.id} className="flex items-center bg-panel-alt border border-border-strong">
                <input
                  type="checkbox"
                  checked={f.enabled}
                  onChange={(e) => updateFilter(f.id, { enabled: e.target.checked })}
                  className="mx-1 accent-amber"
                />
                <select
                  value={f.field}
                  onChange={(e) => updateFilter(f.id, { field: e.target.value as Filter["field"] })}
                  className="bg-bg border-r border-border-strong text-amber px-1 font-bold"
                >
                  {FIELD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={f.op}
                  onChange={(e) => updateFilter(f.id, { op: e.target.value as Filter["op"] })}
                  className="bg-bg border-r border-border-strong text-amber px-1"
                >
                  <option>{">"}</option>
                  <option>{"<"}</option>
                  <option>{">="}</option>
                  <option>{"<="}</option>
                  <option>{"="}</option>
                </select>
                <input
                  type="number"
                  value={f.value}
                  onChange={(e) => updateFilter(f.id, { value: Number(e.target.value) })}
                  className="bg-bg border-r border-border-strong w-20 px-1 text-right font-mono"
                />
                <button onClick={() => removeFilter(f.id)} className="text-down hover:bg-down hover:text-bg px-2">
                  X
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-muted text-[10px]">
            MATCHED: <span className="text-amber font-bold">{results.length}</span> / {STOCKS.length}
          </div>
        </div>
      </Panel>

      <Panel title={`RESULTS — ${results.length}`} fkey="RES" className="flex-1 min-h-0">
        <div className="overflow-auto h-full text-[11px] font-mono">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 bg-panel-alt z-10">
              <tr className="text-amber border-b border-border-strong">
                {[
                  ["symbol", "TICKER"],
                  ["name", "NAME"],
                  ["sector", "SECTOR"],
                  ["last", "LTP"],
                  ["changePct", "CHG%"],
                  ["volume", "VOL"],
                  ["marketCap", "MCAP CR"],
                  ["pe", "P/E"],
                  ["pb", "P/B"],
                  ["divYield", "DY%"],
                  ["beta", "β"],
                  ["rsi", "RSI"],
                ].map(([k, l]) => (
                  <th
                    key={k}
                    onClick={() => toggleSort(k as keyof typeof STOCKS[0])}
                    className="text-left border-b border-border-strong py-1 px-2 cursor-pointer hover:bg-panel"
                  >
                    {l}{sortIndicator(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((s, i) => (
                <tr key={s.symbol} className={`border-b border-border/30 ${i % 2 ? "bg-panel-alt/40" : ""}`}>
                  <td className="px-2 py-0.5">
                    <Link href={`/stock/${s.symbol}`} className="text-amber hover:underline font-bold">{s.symbol}</Link>
                  </td>
                  <td className="px-2 py-0.5 text-muted truncate max-w-[160px]">{s.name}</td>
                  <td className="px-2 py-0.5 text-muted">{s.sector}</td>
                  <td className="px-2 py-0.5 text-right tabular-nums">{fmt(s.last, 2)}</td>
                  <td className={`px-2 py-0.5 text-right tabular-nums ${s.changePct >= 0 ? "text-up" : "text-down"}`}>
                    {fmtPct(s.changePct)}
                  </td>
                  <td className="px-2 py-0.5 text-right tabular-nums">{(s.volume / 1e6).toFixed(2)}M</td>
                  <td className="px-2 py-0.5 text-right tabular-nums">
                    {(s.marketCap / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-2 py-0.5 text-right tabular-nums">{fmt(s.pe, 1)}</td>
                  <td className="px-2 py-0.5 text-right tabular-nums">{fmt(s.pb, 2)}</td>
                  <td className="px-2 py-0.5 text-right tabular-nums">{fmt(s.divYield, 2)}</td>
                  <td className="px-2 py-0.5 text-right tabular-nums">{fmt(s.beta, 2)}</td>
                  <td className={`px-2 py-0.5 text-right tabular-nums ${s.rsi > 70 ? "text-down" : s.rsi < 30 ? "text-up" : ""}`}>
                    {fmt(s.rsi, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
