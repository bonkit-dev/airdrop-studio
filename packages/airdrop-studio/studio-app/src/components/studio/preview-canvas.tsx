"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import { Brush, Clock3, Maximize2, Monitor, RotateCcw, Smartphone, Tablet, X } from "lucide-react"
import { PreviewMockProvider, usePreviewMock, scenarioLabels, type MockScenario } from "../../contexts/preview-mock-context"
import { LAYOUT_PRESET_LABELS, useStudioStore, type LayoutPreset, themePresets, fontPresets } from "../../lib/studio-store"
import { DEFAULT_LAYOUT_PRESET_ID, isLayoutPresetId } from "../../lib/layout-registry"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { CreateAirdropCanvas } from "./create-airdrop-canvas"

import { deriveSemanticTokens } from "../../../../src/theme/derive"
import { LayoutCentered } from "./preview/layout-centered"
import { LayoutHeroBanner } from "./preview/layout-hero-banner"
import { LayoutStepCard } from "./preview/layout-step-card"
import { PreviewPresetShell } from "./preview/preview-shell"
import { MockWalletConnectDialog, type LayoutProps } from "./preview/shared"
import { LayoutTwoColumn } from "./preview/layout-two-column"

const layoutComponents: Record<LayoutPreset, React.ComponentType<LayoutProps> | null> = {
  "two-column": LayoutTwoColumn,
  "hero-banner": LayoutHeroBanner,
  centered: LayoutCentered,
  "step-card": LayoutStepCard,
}

export function PreviewCanvas() {
  return (
    <PreviewMockProvider>
      <PreviewCanvasInner />
    </PreviewMockProvider>
  )
}

function PreviewCanvasInner() {
  const {
    previewMode,
    setPreviewMode,
    config,
    currentSection,
    previewCountdownScenario,
    setPreviewCountdownScenario,
  } = useStudioStore()
  const [fullscreen, setFullscreen] = useState(false)
  const previewFrameUrl = "/preview?embed=1"
  const isAirdropBuilderSection =
    currentSection === "create-airdrop" &&
    (typeof window === "undefined" || !window.location.pathname.startsWith("/preview"))

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const showCountdownScenario = currentSection !== "review" && currentSection !== "generate-app"

  const controls = (
    <div className="flex items-center gap-4">
      <PreviewMockControls />
      {showCountdownScenario ? (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Schedule
          </span>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            {(
              [
                { value: "starts-in", label: "Before start" },
                { value: "ends-in", label: "Claiming" },
                { value: "ended", label: "Ended" },
              ] as const
            ).map((option) => (
              <Button
                key={option.value}
                variant={previewCountdownScenario === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewCountdownScenario(option.value)}
                className="h-7 px-2.5 text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Device</span>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={previewMode === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPreviewMode("desktop")}
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </Button>
          <Button
            variant={previewMode === "tablet" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPreviewMode("tablet")}
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            <Tablet className="w-3.5 h-3.5" />
            Tablet
          </Button>
          <Button
            variant={previewMode === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPreviewMode("mobile")}
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </Button>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="w-7 h-7 p-0" onClick={() => setFullscreen(true)}>
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Fullscreen preview</TooltipContent>
      </Tooltip>
    </div>
  )

  const desktopContent = (
    <PreviewContent />
  )

  const tabletContent = (
    <div className="shrink-0">
      <div className="w-[820px] h-[1100px] rounded-[2rem] border-4 border-zinc-700 shadow-2xl bg-black p-2 relative">
        <div className="h-full w-full overflow-hidden rounded-[1.5rem] bg-background">
          <iframe title="Tablet Preview" src={previewFrameUrl} className="h-full w-full border-0 bg-background" />
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-3">Tablet Frame — 768 × 1024</p>
    </div>
  )

  const mobileContent = (
    <div className="shrink-0">
      <div className="w-97.5 h-211 rounded-[2.5rem] border-4 border-zinc-700 shadow-2xl bg-black p-2 relative">
        <div className="h-full w-full overflow-hidden rounded-[2rem] bg-background">
          <iframe title="Mobile Preview" src={previewFrameUrl} className="h-full w-full border-0 bg-background" />
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-3">Mobile Frame — 390 × 844</p>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-surface/90 border-b border-border backdrop-blur shrink-0">
          <span className="text-sm font-medium text-foreground">
            {previewMode === "tablet" ? "Tablet Preview" : previewMode === "mobile" ? "Mobile Preview" : "Desktop Preview"}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={previewMode === "desktop" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("desktop")} className="w-8 h-8 p-0">
                    <Monitor className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Desktop</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={previewMode === "tablet" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("tablet")} className="w-8 h-8 p-0">
                    <Tablet className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Tablet</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={previewMode === "mobile" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("mobile")} className="w-8 h-8 p-0">
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Mobile</TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0" onClick={() => setFullscreen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Exit fullscreen (Esc)</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div
          className={cn(
            "flex-1 overflow-auto",
            previewMode === "desktop"
              ? "flex flex-col"
              : "flex items-center justify-center bg-zinc-900 p-8",
          )}
        >
          {previewMode === "desktop" ? desktopContent : previewMode === "tablet" ? tabletContent : mobileContent}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/50 shrink-0">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {isAirdropBuilderSection ? "Create Airdrop" : "Preview"}
          </span>
          {!isAirdropBuilderSection ? (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {config.layoutPreset ? LAYOUT_PRESET_LABELS[config.layoutPreset] : "No Layout"}
            </span>
          ) : null}
        </div>
        {isAirdropBuilderSection ? null : controls}
      </div>
      <div
        className={cn(
          "flex-1 overflow-auto flex flex-col",
          isAirdropBuilderSection
            ? "bg-muted/20"
            : previewMode !== "desktop"
              ? "items-center bg-zinc-900/50 p-6"
              : "bg-muted/20",
        )}
      >
        {isAirdropBuilderSection
          ? <CreateAirdropCanvas />
          : previewMode === "desktop"
            ? desktopContent
            : previewMode === "tablet"
              ? tabletContent
              : mobileContent}
      </div>
    </div>
  )
}

function PreviewMockControls() {
  const { scenario, setScenario, eligibilityChecked, claimPhase, reset } = usePreviewMock()
  const hasState = eligibilityChecked || claimPhase !== "idle"
  const scenarios: MockScenario[] = ["multi", "single", "none"]

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Test</span>
      <div className="flex items-center bg-muted rounded-lg p-1">
        {scenarios.map((s) => (
          <button
            key={s}
            onClick={() => setScenario(s)}
            className={cn(
              "px-3 py-1 rounded-md text-sm transition-colors whitespace-nowrap",
              scenario === s
                ? "bg-background text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {scenarioLabels[s]}
          </button>
        ))}
      </div>
      {hasState ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={reset}
              className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Reset preview state</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

export function PreviewContent({ readonly = false, embedded = false }: { readonly?: boolean; embedded?: boolean }) {
  const { config } = useStudioStore()
  const resolvedPreset = isLayoutPresetId(config.layoutPreset) ? config.layoutPreset : DEFAULT_LAYOUT_PRESET_ID
  const colors = config.useCustomColors ? config.customColors : themePresets[config.themePreset ?? "midnight"]
  const derived = deriveSemanticTokens(colors, config.globalRadius)
  const fgColor = derived.foreground
  const fgMuted = derived.mutedForeground
  const borderColor = derived.border
  const surfaceElevated = derived.surfaceElevated
  const tintSubtle = derived.tintSubtle
  const tintStrong = derived.tintStrong
  const ringColor = derived.ring
  const shadowToken = derived.shadow
  const font = fontPresets[config.fontPreset]
  const radiusSm = derived.radiusSm
  const radiusMd = derived.radiusMd
  const radiusLg = derived.radiusLg
  const radiusXl = derived.radiusXl
  const radiusVars = {
    "--studio-radius-sm": radiusSm,
    "--studio-radius-md": radiusMd,
    "--studio-radius-lg": radiusLg,
    "--studio-radius-xl": radiusXl,
  } as CSSProperties
  useEffect(() => {
    if (!font.googleImport) return
    document.head.querySelectorAll("link[data-bonkit-google-font]").forEach((node) => node.remove())
    const link = document.createElement("link")
    link.setAttribute("data-bonkit-google-font", config.fontPreset)
    link.rel = "stylesheet"
    const families = font.googleImport.split("|").map((f) => `family=${f}`).join("&")
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [config.fontPreset, font.googleImport])

  const LayoutComponent = layoutComponents[resolvedPreset]

  const hasLayout = Boolean(config.layoutPreset)

  const content = hasLayout && LayoutComponent ? (
    <PreviewPresetShell preset={resolvedPreset} embedded={embedded}>
      <LayoutComponent colors={colors} />
    </PreviewPresetShell>
  ) : null

  return (
    <div
      className={cn(
        "relative w-full flex-1 flex flex-col",
        readonly && "pointer-events-none select-none",
      )}
      style={{
        ...radiusVars,
        backgroundColor: colors.background,
        "--preview-bg": colors.background,
        "--preview-fg": fgColor,
        "--preview-fg-muted": fgMuted,
        "--preview-border": borderColor,
        "--preview-surface": colors.surface,
        "--preview-surface-elevated": surfaceElevated,
        "--preview-tint-subtle": tintSubtle,
        "--preview-tint-strong": tintStrong,
        "--preview-ring": ringColor,
        "--preview-shadow": shadowToken,
        "--preview-font-heading": font.heading,
        "--preview-font-body": font.body,
        "--preview-hero-overlay": `${config.heroOverlayOpacity / 100}`,
        "--preview-brand-color": config.brandNameColor || fgColor,
        "--preview-title-color": config.heroTitleColor || fgColor,
        // campaign-* aliases — complete set matching generated app's :root vars
        "--campaign-primary": colors.primary,
        "--campaign-primary-foreground": derived.primaryForeground,
        "--campaign-secondary": colors.secondary,
        "--campaign-background": colors.background,
        "--campaign-foreground": fgColor,
        "--campaign-card": colors.surface,
        "--campaign-card-foreground": derived.cardForeground,
        "--campaign-muted": derived.muted,
        "--campaign-muted-foreground": fgMuted,
        "--campaign-border": borderColor,
        "--campaign-input": tintSubtle,
        "--campaign-input-hover": tintStrong,
        "--campaign-ring": ringColor,
        "--campaign-radius": radiusLg,
        "--campaign-radius-sm": radiusSm,
        "--campaign-radius-md": radiusMd,
        "--campaign-radius-lg": radiusLg,
        "--campaign-radius-xl": radiusXl,
        "--campaign-font-body": font.body,
        "--campaign-font-heading": font.heading,
        fontFamily: font.body,
      } as CSSProperties}
    >
      <style>{`
        h1, h2, h3, h4, h5, h6 { font-family: var(--preview-font-heading) !important; }
        button, input, textarea, select { font-family: inherit; }
      `}</style>
      <MockWalletConnectDialog />
      {hasLayout ? content : (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Brush className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Choose a Layout</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start by picking a layout preset. The preview will appear here once a layout is selected.
            </p>
            {!readonly && !embedded ? (
              <Button onClick={() => useStudioStore.getState().setCurrentSection("layout")}>
                Open Layout
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
