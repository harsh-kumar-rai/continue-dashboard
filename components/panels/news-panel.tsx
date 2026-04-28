"use client"

import { Panel } from "@/components/terminal/panel"
import { NEWS } from "@/lib/mock-data"
import { fmtTime } from "@/lib/format"

const TAG_COLORS: Record<string, string> = {
  RES: "bg-[var(--color-cyan)] text-black",
  MGMT: "bg-[var(--color-amber)] text-black",
  REG: "bg-[var(--color-magenta)] text-white",
  MACRO: "bg-[var(--color-blue)] text-black",
  FII: "bg-[var(--color-yellow)] text-black",
  BLOCK: "bg-[var(--color-up)] text-black",
  COR: "bg-[var(--color-mute)] text-black",
}

export function NewsPanel() {
  return (
    <Panel title="NEWS" code="N">
      <div className="divide-y divide-[var(--color-border)]">
        {NEWS.map((n, i) => (
          <div key={i} className="bb-row px-2 py-[3px] text-[11px]">
            <div className="flex items-center gap-2 text-[10px] text-[var(--color-mute)]">
              <span>{fmtTime(n.t)}</span>
              <span className="text-[var(--color-amber-bright)] font-bold">{n.src}</span>
              {n.tag && (
                <span className={`px-1 text-[9px] font-bold ${TAG_COLORS[n.tag]}`}>{n.tag}</span>
              )}
              {n.sym && <span className="text-[var(--color-cyan)] font-bold">{n.sym}</span>}
            </div>
            <div className="text-[var(--color-white)] mt-[1px] tracking-tight">{n.headline}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
