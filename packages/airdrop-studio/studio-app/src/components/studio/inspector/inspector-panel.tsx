"use client"

import { useStudioStore, type StudioSection } from "../../../lib/studio-store"
import { BrandPanel } from "./brand-panel"
import { LayoutPanel } from "./layout-panel"
import { ThemePanel } from "./theme-panel"
import { CreateAirdropPanel } from "./create-airdrop-panel"
import { ReviewPanel } from "./review-panel"
import { GenerateAppPanel } from "./generate-app-panel"

const panels: Record<StudioSection, React.ComponentType> = {
  layout: LayoutPanel,
  brand: BrandPanel,
  theme: ThemePanel,
  "create-airdrop": CreateAirdropPanel,
  review: ReviewPanel,
  "generate-app": GenerateAppPanel,
}

export function InspectorPanel() {
  const { currentSection } = useStudioStore()
  const Panel = panels[currentSection]
  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5">
        <Panel />
      </div>
    </aside>
  )
}
