"use client"

import { Panel } from "@/components/terminal/panel"
import { NEWS } from "@/lib/mock-data"
import { fmtTime } from "@/lib/format"

// Source mnemonics get colored *text* (not pills) — Bloomberg-grade.
const SRC_CLASS: Record<string, string> = {
  BBG: "bb-src-bbg",
  REUT: "bb-src-reut",
  MINT: "bb-src-mint",
  ET: "bb-src-et",
  BSE: "bb-src-bse",
  NSE: "bb-src-nse",
}
const TAG_CLASS: Record<string, string> = {
  RES: "bb-tag-res",
  MGMT: "bb-tag-mgmt",
  REG: "bb-tag-reg",
  MACRO: "bb-tag-macro",
  FII: "bb-tag-fii",
  BLOCK: "bb-tag-block",
  COR: "bb-tag-cor",
}

export function NewsPanel() {
  return (
    <Panel title="NEWS" code="N">
      {/* Strict 3-column rigid grid: TIME | SRC | HEADLINE */}
      <div>
        {NEWS.map((n, i) => {
          const srcCls = SRC_CLASS[n.src] ?? "text-[var(--color-amber-bright)]"
          const tagCls = n.tag ? TAG_CLASS[n.tag] ?? "text-[var(--color-mute)]" : ""
          return (
            <div
              key={i}
              className="bb-row grid items-baseline gap-2 px-2 text-[11px] border-b border-[var(--color-border)]"
              style={{ gridTemplateColumns: "60px 50px 1fr" }}
            >
              <span className="text-[var(--color-mute)] bb-num text-[10px]">{fmtTime(n.t)}</span>
              <span className={`${srcCls} font-bold tracking-wider text-[10px]`}>{n.src}</span>
              <span className="text-white truncate py-[2px]">
                {n.tag && (
                  <span className={`${tagCls} bb-tag mr-2 text-[9px]`}>[{n.tag}]</span>
                )}
                {n.sym && (
                  <span className="text-[var(--color-cyan)] font-bold mr-1">{n.sym}</span>
                )}
                {n.headline}
              </span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
