"use client"

import { Panel } from "@/components/terminal/panel"
import { MACRO } from "@/lib/mock-data"
import { fmtNum, dirColor, arrow } from "@/lib/format"

export function MacroSnapshotPanel() {
  return (
    <Panel title="MACRO" code="ECO">
      <table className="w-full text-[11px]">
        <thead className="bg-[var(--color-panel-2)] sticky top-0 text-[10px] text-[var(--color-mute)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-2 py-1 font-normal">INDICATOR</th>
            <th className="text-right px-2 font-normal">VALUE</th>
            <th className="text-right px-2 font-normal">CHG</th>
            <th className="text-right px-2 font-normal">AS-OF</th>
          </tr>
        </thead>
        <tbody>
          {MACRO.map((m) => (
            <tr key={m.label} className="bb-row border-b border-[var(--color-border)]">
              <td className="px-2 py-[3px] text-[var(--color-amber-bright)]">{m.label}</td>
              <td className="px-2 text-right text-white bb-num">
                {fmtNum(m.value, m.value > 1000 ? 1 : 2)}
                <span className="text-[var(--color-mute)] ml-1">{m.unit}</span>
              </td>
              <td className={`px-2 text-right bb-num ${dirColor(m.change)}`}>
                {arrow(m.change)} {fmtNum(Math.abs(m.change), 2)}
              </td>
              <td className="px-2 text-right text-[var(--color-mute)] text-[10px]">{m.asOf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}
