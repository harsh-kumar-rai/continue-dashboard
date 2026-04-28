"use client"

import { useEffect, useState } from "react"
import { INDICES } from "@/lib/mock-data"
import { fmtNum, fmtPct, dirColor, arrow } from "@/lib/format"

const TICKER_INDICES = ["NIFTY", "BANKNIFTY", "FINNIFTY", "SENSEX", "INDIAVIX", "NIFTYIT", "NIFTYAUTO", "NIFTYMETAL"]

export function TopBar() {
  const [time, setTime] = useState<string>("")
  const [date, setDate] = useState<string>("")

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setTime(d.toLocaleTimeString("en-IN", { hour12: false }))
      setDate(
        d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bb-chrome flex items-stretch border-b border-[var(--color-amber)] bg-black h-[24px]">
      <div className="flex items-center bg-[var(--color-amber)] text-black px-2 font-bold text-[11px] tracking-wider">
        DALAL <span className="text-black/70 ml-1">TERMINAL</span>
      </div>
      <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-r border-[var(--color-border)]">
        IND
      </div>
      <div className="flex-1 overflow-hidden flex items-center">
        <div className="flex items-center gap-3 px-2 text-[10px] whitespace-nowrap">
          {TICKER_INDICES.map((sym) => {
            const i = INDICES.find((x) => x.symbol === sym)
            if (!i) return null
            return (
              <div key={sym} className="flex items-center gap-1">
                <span className="text-[var(--color-white)] font-bold">{i.symbol}</span>
                <span className="text-[var(--color-amber)]">{fmtNum(i.value)}</span>
                <span className={dirColor(i.ret1d)}>
                  {arrow(i.ret1d)} {fmtPct(i.ret1d)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-l border-[var(--color-border)]">
        <span>{date}</span>
        <span className="mx-2 text-[var(--color-amber)] font-bold">{time}</span>
        <span>IST</span>
      </div>
    </div>
  )
}
