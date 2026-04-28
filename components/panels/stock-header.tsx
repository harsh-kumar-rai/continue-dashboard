"use client"

import type { Equity } from "@/lib/types"
import { fmtNum, fmtPct, dirColor, arrow } from "@/lib/format"

export function StockHeader({ eq, tab, onTab }: { eq: Equity; tab: string; onTab: (t: string) => void }) {
  const chg = eq.price - eq.prevClose
  const tabs = [
    ["des", "DES", "DESCRIPTION"],
    ["chart", "GIP", "CHART"],
    ["fundamentals", "FA", "FUNDAMENTALS"],
    ["earnings", "EE", "EARNINGS"],
    ["options", "OMON", "OPTIONS"],
    ["holders", "HOLD", "HOLDINGS"],
    ["news", "CN", "NEWS"],
  ]
  return (
    <div className="border-b border-[var(--color-amber-dim)] bg-black">
      <div className="flex items-stretch h-[26px] border-b border-[var(--color-border)]">
        <div className="flex items-center px-2 bg-[var(--color-amber)] text-black font-bold text-[12px]">
          {eq.symbol} <span className="opacity-70 ml-1 text-[10px]">IN EQUITY</span>
        </div>
        <div className="flex items-center px-2 text-[11px] text-[var(--color-amber-bright)] tracking-wider">
          {eq.name}
        </div>
        <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-l border-[var(--color-border)]">
          {eq.exchange}
        </div>
        <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] border-l border-[var(--color-border)]">
          ISIN {eq.isin}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3 px-3 border-l border-[var(--color-border)]">
          <span className="text-white text-[14px] font-bold">{fmtNum(eq.price)}</span>
          <span className={`text-[11px] ${dirColor(chg)}`}>
            {arrow(chg)} {fmtNum(Math.abs(chg))} ({fmtPct(eq.ret1d)})
          </span>
          <span className="text-[10px] text-[var(--color-mute)]">INR</span>
        </div>
      </div>
      <div className="flex items-stretch h-[20px]">
        {tabs.map(([key, mnem, label]) => (
          <button
            key={key}
            onClick={() => onTab(key)}
            className={`px-3 text-[10px] tracking-widest font-bold border-r border-[var(--color-border)] ${
              tab === key
                ? "bg-[var(--color-amber-dim)] text-black"
                : "text-[var(--color-amber)] hover:bg-[var(--color-amber-dim)]/30"
            }`}
          >
            <span className="text-[var(--color-mute)] mr-1">{mnem}</span>
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] gap-3">
          <span>O {fmtNum(eq.open)}</span>
          <span className="text-[var(--color-up)]">H {fmtNum(eq.high)}</span>
          <span className="text-[var(--color-down)]">L {fmtNum(eq.low)}</span>
          <span>VOL {(eq.volume / 1e5).toFixed(2)}L</span>
          <span>52H {fmtNum(eq.high52)}</span>
          <span>52L {fmtNum(eq.low52)}</span>
        </div>
      </div>
    </div>
  )
}
