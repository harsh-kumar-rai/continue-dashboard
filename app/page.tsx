"use client"

import { Panel } from "@/components/terminal/panel"
import { PageTitleBar } from "@/components/terminal/shell"
import { Treemap } from "@/components/charts/treemap"
import { IndicesPanel } from "@/components/panels/indices-panel"
import { NewsPanel } from "@/components/panels/news-panel"
import { MoversPanel } from "@/components/panels/movers-panel"
import { BreadthPanel } from "@/components/panels/breadth-panel"
import { MacroSnapshotPanel } from "@/components/panels/macro-snapshot"
import { EQUITIES } from "@/lib/mock-data"
import { PanelGroup, Panel as RPanel, PanelResizeHandle } from "react-resizable-panels"
import { useMemo } from "react"

export default function DashboardPage() {
  const treeItems = useMemo(
    () =>
      EQUITIES.map((e) => ({
        id: e.symbol,
        label: e.symbol,
        sublabel: e.name,
        weight: e.mcap,
        value: e.ret1d,
        href: `/stock/${e.symbol}?tab=des`,
      })),
    [],
  )

  return (
    <div className="flex flex-col h-full">
      <PageTitleBar title="DASHBOARD" code="TOP" subtitle="INDIA MARKETS // OVERVIEW" />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="vertical">
          <RPanel defaultSize={62} minSize={30}>
            <PanelGroup direction="horizontal">
              <RPanel defaultSize={26} minSize={15}>
                <IndicesPanel />
              </RPanel>
              <PanelResizeHandle className="w-px" />
              <RPanel defaultSize={48} minSize={25}>
                <Panel title="HEAT MAP" code="IMAP">
                  <div className="w-full h-full p-px">
                    <Treemap items={treeItems} />
                  </div>
                </Panel>
              </RPanel>
              <PanelResizeHandle className="w-px" />
              <RPanel defaultSize={26} minSize={15}>
                <BreadthPanel />
              </RPanel>
            </PanelGroup>
          </RPanel>
          <PanelResizeHandle className="h-px" />
          <RPanel defaultSize={38} minSize={20}>
            <PanelGroup direction="horizontal">
              <RPanel defaultSize={34}>
                <MoversPanel />
              </RPanel>
              <PanelResizeHandle className="w-px" />
              <RPanel defaultSize={36}>
                <NewsPanel />
              </RPanel>
              <PanelResizeHandle className="w-px" />
              <RPanel defaultSize={30}>
                <MacroSnapshotPanel />
              </RPanel>
            </PanelGroup>
          </RPanel>
        </PanelGroup>
      </div>
    </div>
  )
}
