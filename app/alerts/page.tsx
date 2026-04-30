"use client"

import { useEffect, useState } from "react"
import { PageTitleBar } from "@/components/terminal/shell"
import { Panel, PanelSection } from "@/components/terminal/panel"
import { EQUITIES, INDICES } from "@/lib/mock-data"
import { fmtNum } from "@/lib/format"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"

type Op = ">" | "<" | ">=" | "<=" | "="
type Field = "PRICE" | "%CHG" | "VOLUME" | "RSI" | "VIX"

interface AlertRule {
  id: string
  symbol: string
  field: Field
  op: Op
  value: number
  active: boolean
  fired: boolean
  createdAt: number
}

const STORAGE_KEY = "betagen.alerts.v1"

function loadAlerts(): AlertRule[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AlertRule[]) : []
  } catch {
    return []
  }
}

const SAMPLE: AlertRule[] = [
  { id: "a1", symbol: "NIFTY", field: "PRICE", op: "<", value: 24000, active: true, fired: false, createdAt: Date.now() - 86400_000 },
  { id: "a2", symbol: "INDIAVIX", field: "PRICE", op: ">", value: 18, active: true, fired: false, createdAt: Date.now() - 3600_000 },
  { id: "a3", symbol: "RELIANCE", field: "%CHG", op: ">", value: 2, active: true, fired: true, createdAt: Date.now() - 7_200_000 },
  { id: "a4", symbol: "HDFCBANK", field: "RSI", op: "<", value: 30, active: false, fired: false, createdAt: Date.now() - 2 * 86400_000 },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRule[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [draft, setDraft] = useState<{ symbol: string; field: Field; op: Op; value: string }>({
    symbol: "NIFTY",
    field: "PRICE",
    op: "<",
    value: "24000",
  })

  useEffect(() => {
    const loaded = loadAlerts()
    setAlerts(loaded.length ? loaded : SAMPLE)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
    } catch {
      /* ignore */
    }
  }, [alerts, hydrated])

  const universe = [...INDICES.map((i) => i.symbol), ...EQUITIES.map((e) => e.symbol)]

  const addAlert = () => {
    const v = parseFloat(draft.value)
    if (!isFinite(v)) return
    setAlerts((a) => [
      {
        id: `a${Date.now()}`,
        symbol: draft.symbol,
        field: draft.field,
        op: draft.op,
        value: v,
        active: true,
        fired: false,
        createdAt: Date.now(),
      },
      ...a,
    ])
  }

  const removeAlert = (id: string) => setAlerts((a) => a.filter((x) => x.id !== id))
  const toggleAlert = (id: string) => setAlerts((a) => a.map((x) => (x.id === id ? { ...x, active: !x.active } : x)))

  const live = (sym: string) => {
    const idx = INDICES.find((i) => i.symbol === sym)
    if (idx) return { price: idx.value, chg: idx.ret1d * 100, rsi: 50 }
    const eq = EQUITIES.find((e) => e.symbol === sym)
    if (eq) return { price: eq.price, chg: eq.ret1d * 100, rsi: eq.rsi14 }
    return { price: 0, chg: 0, rsi: 0 }
  }

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar title="ALERTS" code="ALRT" subtitle="PRICE / TECHNICAL / FLOW ALERTS" />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <RPanel defaultSize={32} minSize={22}>
            <Panel title="NEW ALERT" code="NEW">
              <PanelSection label="CONDITION">
                <div className="p-2 grid grid-cols-1 gap-2 text-[11px]">
                  <label className="flex items-center justify-between gap-2">
                    <span className="text-[var(--color-mute)] tracking-wider w-[80px]">SYMBOL</span>
                    <select
                      value={draft.symbol}
                      onChange={(e) => setDraft((d) => ({ ...d, symbol: e.target.value }))}
                      className="flex-1 bg-black border border-[var(--color-amber-dim)] text-[11px] text-[var(--color-amber)] px-1 py-1 outline-none uppercase"
                    >
                      {universe.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span className="text-[var(--color-mute)] tracking-wider w-[80px]">FIELD</span>
                    <select
                      value={draft.field}
                      onChange={(e) => setDraft((d) => ({ ...d, field: e.target.value as Field }))}
                      className="flex-1 bg-black border border-[var(--color-amber-dim)] text-[11px] text-[var(--color-amber)] px-1 py-1 outline-none uppercase"
                    >
                      {(["PRICE", "%CHG", "VOLUME", "RSI", "VIX"] as Field[]).map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span className="text-[var(--color-mute)] tracking-wider w-[80px]">OP</span>
                    <select
                      value={draft.op}
                      onChange={(e) => setDraft((d) => ({ ...d, op: e.target.value as Op }))}
                      className="flex-1 bg-black border border-[var(--color-amber-dim)] text-[11px] text-[var(--color-amber)] px-1 py-1 outline-none uppercase"
                    >
                      {(["<", "<=", "=", ">=", ">"] as Op[]).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span className="text-[var(--color-mute)] tracking-wider w-[80px]">VALUE</span>
                    <input
                      value={draft.value}
                      onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                      className="flex-1 bg-black border border-[var(--color-amber-dim)] px-1 py-1 text-[11px] text-[var(--color-amber)] outline-none focus:border-[var(--color-amber)] tracking-wider"
                      spellCheck={false}
                    />
                  </label>
                  <button
                    onClick={addAlert}
                    className="bg-[var(--color-amber)] text-black font-bold tracking-widest px-3 py-2 text-[11px] hover:bg-[var(--color-amber-bright)]"
                  >
                    + CREATE ALERT
                  </button>
                </div>
              </PanelSection>
              <PanelSection label="EXAMPLES">
                <div className="px-2 py-1 text-[10px] text-[var(--color-mute)] space-y-1 leading-relaxed">
                  <div>NIFTY PRICE &lt; 24000</div>
                  <div>INDIAVIX PRICE &gt; 18</div>
                  <div>RELIANCE %CHG &gt; 2</div>
                  <div>HDFCBANK RSI &lt; 30</div>
                </div>
              </PanelSection>
            </Panel>
          </RPanel>
          <PanelResizeHandle className="w-px" />
          <RPanel defaultSize={68}>
            <Panel
              title="ACTIVE / HISTORY"
              code="ALRT"
              actions={<div className="px-2 text-[10px] text-[var(--color-mute)]">{alerts.length} TOTAL</div>}
            >
              <table className="w-full text-[11px]">
                <thead className="bg-[var(--color-panel-2)] text-[10px] text-[var(--color-mute)] sticky top-0">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-2 py-1 font-normal">STATE</th>
                    <th className="text-left px-2 font-normal">SYM</th>
                    <th className="text-left px-2 font-normal">FIELD</th>
                    <th className="text-left px-2 font-normal">OP</th>
                    <th className="text-right px-2 font-normal">TARGET</th>
                    <th className="text-right px-2 font-normal">CURRENT</th>
                    <th className="text-left px-2 font-normal">CREATED</th>
                    <th className="text-right px-2 font-normal">ACT</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-[var(--color-mute)] py-6 tracking-widest text-[11px]">
                        NO ALERTS // CREATE ONE ON THE LEFT
                      </td>
                    </tr>
                  )}
                  {alerts.map((a) => {
                    const lv = live(a.symbol)
                    const cur = a.field === "PRICE" ? lv.price : a.field === "%CHG" ? lv.chg : a.field === "RSI" ? lv.rsi : lv.price
                    const triggered = a.fired || (a.active && (
                      (a.op === "<" && cur < a.value) ||
                      (a.op === "<=" && cur <= a.value) ||
                      (a.op === ">" && cur > a.value) ||
                      (a.op === ">=" && cur >= a.value) ||
                      (a.op === "=" && Math.abs(cur - a.value) < 0.01)
                    ))
                    return (
                      <tr key={a.id} className="bb-row border-b border-[var(--color-border)]">
                        <td className="px-2 py-[3px]">
                          <span
                            className={`px-1 text-[9px] font-bold ${
                              triggered
                                ? "bg-[var(--color-up)] text-black"
                                : a.active
                                  ? "bg-[var(--color-amber)] text-black"
                                  : "bg-[var(--color-mute)] text-black"
                            }`}
                          >
                            {triggered ? "FIRED" : a.active ? "WATCH" : "PAUSE"}
                          </span>
                        </td>
                        <td className="px-2 text-[var(--color-amber-bright)] font-bold">{a.symbol}</td>
                        <td className="px-2 text-[var(--color-cyan)]">{a.field}</td>
                        <td className="px-2 text-white">{a.op}</td>
                        <td className="px-2 text-right text-[var(--color-amber-bright)] bb-num">{fmtNum(a.value)}</td>
                        <td className="px-2 text-right text-white bb-num">{fmtNum(cur)}</td>
                        <td className="px-2 text-[var(--color-mute)] text-[10px]">
                          {new Date(a.createdAt).toLocaleString("en-IN", { hour12: false }).toUpperCase()}
                        </td>
                        <td className="px-2 text-right">
                          <button
                            onClick={() => toggleAlert(a.id)}
                            className="px-2 h-[18px] border border-[var(--color-border)] text-[10px] text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30 mr-1"
                          >
                            {a.active ? "PAUSE" : "WATCH"}
                          </button>
                          <button
                            onClick={() => removeAlert(a.id)}
                            className="px-2 h-[18px] border border-[var(--color-border)] text-[10px] text-[var(--color-down)] hover:bg-[var(--color-down)]/20"
                          >
                            DEL
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Panel>
          </RPanel>
        </PanelGroup>
      </div>
    </div>
  )
}
