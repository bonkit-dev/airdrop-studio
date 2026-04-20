"use client"

import { useMemo } from "react"
import { Brush, Check, CircleDashed, CircleDot, ClipboardCheck, Code, Palette, Rocket, SwatchBook } from "lucide-react"
import { Progress } from "../ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { useStudioStore, type StudioSection, type CampaignConfigDraft } from "../../lib/studio-store"
import { cn } from "../../lib/utils"

const sections: { id: StudioSection; label: string; icon: React.ElementType }[] = [
  { id: "layout", label: "Choose Layout", icon: Brush },
  { id: "theme", label: "Pick Theme", icon: SwatchBook },
  { id: "brand", label: "Set Branding", icon: Palette },
  { id: "create-airdrop", label: "Create Airdrop", icon: Rocket },
  { id: "review", label: "Review Setup", icon: ClipboardCheck },
  { id: "generate-app", label: "Generate App", icon: Code },
]

const DIRTY_SECTIONS = ["layout", "theme", "brand"] as const
type DirtySection = (typeof DIRTY_SECTIONS)[number]

const sectionConfigKeys: Record<DirtySection, (keyof CampaignConfigDraft)[]> = {
  layout: [
    "layoutPreset",
    "globalRadius",
    "ctaArrangement",
    "countdownEmphasis",
    "statsSize",
    "heroBannerStatsPlacement",
    "centeredContentWidth",
    "centeredDensity",
    "centeredAnnouncementStyle",
  ],
  theme: ["themePreset", "fontPreset", "useCustomColors", "customColors"],
  brand: [
    "brandName", "brandNameColor", "tagline", "showTagline",
    "heroTitle", "heroTitleColor", "heroBody", "logoUrl", "showBrandNameWithLogo",
    "heroImageUrl", "heroImageScale", "heroImagePositionX", "heroImagePositionY",
    "heroOverlayOpacity", "heroGradientPrimary", "heroGradientAccent", "symbolUrl",
    "connectWalletLabel", "claimButtonLabel", "eligibilityButtonLabel",
    "showAnnouncement", "announcementText", "useAnnouncementBarColorOverride", "announcementBarColorOverride",
    "showCountdown", "countdownStartEyebrow", "countdownEndEyebrow", "countdownEndedLabel",
    "countdownHoursLabel", "countdownMinutesLabel", "countdownSecondsLabel",
    "showStats", "statTotalClaimsLabel", "statAllocatedLabel", "statClaimedLabel",
    "showFooter", "footerLinks",
  ],
}

function computeDirtySections(
  config: CampaignConfigDraft,
  savedConfig: CampaignConfigDraft,
): Set<StudioSection> {
  const result = new Set<StudioSection>()
  for (const section of DIRTY_SECTIONS) {
    const keys = sectionConfigKeys[section]
    const dirty = keys.some((key) => {
      const current = config[key]
      const saved = savedConfig[key]
      if (current === saved) return false
      if (current && saved && typeof current === "object" && typeof saved === "object") {
        return JSON.stringify(current) !== JSON.stringify(saved)
      }
      return true
    })
    if (dirty) result.add(section)
  }
  return result
}

type SectionStatus = "pending" | "dirty" | "complete"

const STATUS_TOOLTIP: Record<SectionStatus, string> = {
  pending: "Not started",
  dirty: "Unsaved changes",
  complete: "Complete",
}

function StatusIcon({ status }: { status: SectionStatus }) {
  if (status === "complete") return <Check className="w-4 h-4 text-success" />
  if (status === "dirty") return <CircleDot className="w-4 h-4 text-warning" />
  return <CircleDashed className="w-4 h-4 text-muted-foreground/60" />
}

export function LeftRail() {
  const currentSection = useStudioStore((state) => state.currentSection)
  const setCurrentSection = useStudioStore((state) => state.setCurrentSection)
  const checklist = useStudioStore((state) => state.checklist)
  const config = useStudioStore((state) => state.config)
  const savedConfig = useStudioStore((state) => state.savedConfig)

  const dirtySections = useMemo(
    () => computeDirtySections(config, savedConfig),
    [config, savedConfig],
  )

  const completedCount = checklist.filter((item) => item.completed).length
  const progress = (completedCount / checklist.length) * 100

  const sectionStatuses = useMemo(() => {
    const statuses: Record<StudioSection, SectionStatus> = {
      layout: "pending",
      theme: "pending",
      brand: "pending",
      "create-airdrop": "pending",
      review: "pending",
      "generate-app": "pending",
    }
    for (const section of sections) {
      if (dirtySections.has(section.id)) {
        statuses[section.id] = "dirty"
        continue
      }
      const items = checklist.filter((item) => item.section === section.id)
      if (items.length > 0 && items.every((item) => item.completed)) {
        statuses[section.id] = "complete"
      }
    }
    return statuses
  }, [checklist, dirtySections])

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-sidebar-foreground">Campaign Progress</span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{checklist.length}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon
            const status = sectionStatuses[section.id]
            const isActive = currentSection === section.id
            return (
              <li key={section.id}>
                <button
                  onClick={() => setCurrentSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left font-medium">{section.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center justify-center">
                        <StatusIcon status={status} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">{STATUS_TOOLTIP[status]}</TooltipContent>
                  </Tooltip>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <a
        href="https://bonkit.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="group px-4 py-3 border-t border-sidebar-border flex items-center gap-2"
      >
        <span className="text-[10px] tracking-wide uppercase shrink-0 text-muted-foreground/50">powered by</span>
        <img src="/logo.svg" alt="BONKIT" className="h-3.5 opacity-50 transition-opacity group-hover:opacity-80" />
      </a>

      <div className="p-4 border-t border-sidebar-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Checklist</h3>
        <ul className="space-y-2">
          {checklist.map((item) => {
            const sectionStatus = sectionStatuses[item.section]
            const showDirty = sectionStatus === "dirty" && !item.completed
            const showCheck = item.completed && sectionStatus !== "dirty"
            return (
              <li key={item.id} className="flex items-start gap-2">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0",
                    showCheck
                      ? "bg-success border-success"
                      : showDirty
                        ? "bg-warning border-warning"
                        : "border-muted-foreground/30",
                  )}
                >
                  {showCheck ? <Check className="w-2.5 h-2.5 text-success-foreground" /> : null}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium truncate",
                      showCheck ? "text-muted-foreground line-through" : "text-sidebar-foreground",
                    )}
                  >
                    {item.label}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
