"use client"

import { AlertCircle, Check, CreditCard, Focus, Image as ImageIcon, Layers } from "lucide-react"
import { useStudioStore, type LayoutPreset } from "../../../lib/studio-store"
import { LAYOUT_PRESET_DEFINITIONS } from "../../../lib/layout-registry"
import { cn } from "../../../lib/utils"
import { FieldLabel } from "../../ui/field"
import { Separator } from "../../ui/separator"

const layoutPresetIcons: Record<LayoutPreset, React.ReactNode> = {
  "two-column": <Layers className="w-4 h-4" />,
  "hero-banner": <ImageIcon className="w-4 h-4" />,
  centered: <Focus className="w-4 h-4" />,
  "step-card": <CreditCard className="w-4 h-4" />,
}

// Which common options are rendered for each preset. Add a preset here when its layout
// component starts consuming the corresponding common config field.
const LAYOUT_COMMON_SUPPORT: Record<LayoutPreset, { cta: boolean; countdown: boolean; stats: boolean }> = {
  centered: { cta: true, countdown: true, stats: true },
  "hero-banner": { cta: true, countdown: false, stats: false },
  "two-column": { cta: false, countdown: false, stats: false },
  "step-card": { cta: false, countdown: false, stats: false },
}

function OptionGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  columns,
  disabled,
  hint,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; hint?: string }>
  columns: 2 | 3
  disabled?: boolean
  hint?: string
}) {
  const colsClass = columns === 3 ? "grid-cols-3" : "grid-cols-2"
  return (
    <div className={cn("space-y-2", disabled && "opacity-50")}>
      <p className="text-xs font-medium text-foreground/80">{label}</p>
      <div className={cn("grid gap-2", colsClass)}>
        {options.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition",
                disabled && "cursor-not-allowed",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50",
              )}
            >
              <p className="text-xs font-medium">{option.label}</p>
              {option.hint ? <p className="text-[11px] opacity-80">{option.hint}</p> : null}
            </button>
          )
        })}
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function LayoutPanel() {
  const { config, updateConfig } = useStudioStore()
  const radiusPresets = [
    { label: "None", value: 0 },
    { label: "Sharp", value: 4 },
    { label: "Balanced", value: 12 },
    { label: "Soft", value: 20 },
    { label: "Pill", value: 32 },
  ]

  const support = config.layoutPreset ? LAYOUT_COMMON_SUPPORT[config.layoutPreset] : null
  const hasAnyCommon = support && (support.cta || support.countdown || support.stats)
  const hasCenteredLocal = config.layoutPreset === "centered"
  const hasHeroBannerLocal = config.layoutPreset === "hero-banner"
  const heroMissingImage = config.layoutPreset === "hero-banner" && !config.heroImageUrl

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Layout System</h3>
        <p className="text-sm text-muted-foreground">
          Choose the overall page structure. This decides how your content, CTAs, and stats are arranged.
        </p>
      </div>

      <div className="space-y-3">
        <FieldLabel>Layout Presets</FieldLabel>
        <div className="grid gap-2">
          {(Object.keys(LAYOUT_PRESET_DEFINITIONS) as LayoutPreset[]).map((preset) => {
            const info = LAYOUT_PRESET_DEFINITIONS[preset]
            const isSelected = config.layoutPreset === preset
            return (
              <button
                key={preset}
                onClick={() => updateConfig("layoutPreset", preset)}
                className={cn(
                  "w-full overflow-hidden rounded-lg border text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(0,217,255,0.16)]"
                    : "border-border bg-card hover:border-muted-foreground/50",
                )}
              >
                <div className="flex items-center gap-2 border-b border-white/6 px-3 py-2">
                  <div className={isSelected ? "text-primary" : "text-muted-foreground"}>
                    {layoutPresetIcons[preset]}
                  </div>
                  <p className="text-sm font-medium flex-1">{info.label}</p>
                  {isSelected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                </div>
                <div className="px-3 py-3">
                  <p className="text-xs leading-5 text-foreground/90">{info.description}</p>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{info.details}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {heroMissingImage ? (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
          <div>
            <p className="text-xs font-medium text-warning">Hero image not set</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Hero Banner is designed around a featured image. Add one in <span className="font-medium text-foreground">Set Branding</span>.
            </p>
          </div>
        </div>
      ) : null}

      {support && hasAnyCommon ? (
        <>
          <Separator />
          <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
            <div>
              <FieldLabel>Common Options</FieldLabel>
              <p className="mt-1 text-xs text-muted-foreground">Shared controls that apply to this layout.</p>
            </div>
            {support.cta ? (
              <OptionGroup
                label="CTA arrangement"
                value={config.ctaArrangement}
                onChange={(v) => updateConfig("ctaArrangement", v)}
                options={[
                  { value: "inline", label: "Inline", hint: "Side by side" },
                  { value: "stacked", label: "Stacked", hint: "Vertical column" },
                ]}
                columns={2}
              />
            ) : null}
            {support.countdown ? (
              <OptionGroup
                label="Countdown emphasis"
                value={config.countdownEmphasis}
                onChange={(v) => updateConfig("countdownEmphasis", v)}
                options={[
                  { value: "compact", label: "Inline", hint: "Small above the title" },
                  { value: "hero", label: "Hero", hint: "Large, timer-first" },
                ]}
                columns={2}
                disabled={!config.showCountdown}
                hint={!config.showCountdown ? "Enable Countdown in Set Branding to apply." : undefined}
              />
            ) : null}
            {support.stats ? (
              <OptionGroup
                label="Stats size"
                value={config.statsSize}
                onChange={(v) => updateConfig("statsSize", v)}
                options={[
                  { value: "prominent", label: "Prominent", hint: "Larger metrics" },
                  { value: "compact", label: "Compact", hint: "Condensed metrics" },
                ]}
                columns={2}
                disabled={!config.showStats}
                hint={!config.showStats ? "Enable Stats in Set Branding to apply." : undefined}
              />
            ) : null}
          </div>
        </>
      ) : null}

      {hasCenteredLocal ? (
        <>
          <Separator />
          <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
            <div>
              <FieldLabel>Centered Options</FieldLabel>
              <p className="mt-1 text-xs text-muted-foreground">Width, density, and announcement style tuned for the centered layout.</p>
            </div>
            <OptionGroup
              label="Content width"
              value={config.centeredContentWidth}
              onChange={(v) => updateConfig("centeredContentWidth", v)}
              options={[
                { value: "narrow", label: "Narrow", hint: "Compact, timer-first" },
                { value: "medium", label: "Medium", hint: "Balanced default" },
                { value: "wide", label: "Wide", hint: "Editorial, copy-led" },
              ]}
              columns={3}
            />
            <OptionGroup
              label="Density"
              value={config.centeredDensity}
              onChange={(v) => updateConfig("centeredDensity", v)}
              options={[
                { value: "compact", label: "Compact", hint: "Tight gaps, smaller title" },
                { value: "comfortable", label: "Comfortable", hint: "Spacious default" },
              ]}
              columns={2}
            />
            <OptionGroup
              label="Announcement"
              value={config.centeredAnnouncementStyle}
              onChange={(v) => updateConfig("centeredAnnouncementStyle", v)}
              options={[
                { value: "subtle", label: "Subtle", hint: "Light tint strip" },
                { value: "bold", label: "Bold", hint: "Solid primary bar" },
              ]}
              columns={2}
              disabled={!config.showAnnouncement}
              hint={!config.showAnnouncement ? "Enable Announcement in Set Branding to apply." : undefined}
            />
          </div>
        </>
      ) : null}

      {hasHeroBannerLocal ? (
        <>
          <Separator />
          <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
            <div>
              <FieldLabel>Hero Banner Options</FieldLabel>
              <p className="mt-1 text-xs text-muted-foreground">Layout-specific placement for stats.</p>
            </div>
            <OptionGroup
              label="Stats placement"
              value={config.heroBannerStatsPlacement}
              onChange={(v) => updateConfig("heroBannerStatsPlacement", v)}
              options={[
                { value: "top-bar", label: "Top Bar", hint: "Horizontal strip below the hero" },
                { value: "inline", label: "Inline Cards", hint: "Three cards inside content flow" },
              ]}
              columns={2}
              disabled={!config.showStats}
              hint={!config.showStats ? "Enable Stats in Set Branding to apply." : undefined}
            />
          </div>
        </>
      ) : null}

      <Separator />

      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <FieldLabel>Global Radius</FieldLabel>
            <p className="mt-1 text-xs text-muted-foreground">
              Applies to cards, buttons, inputs, and the runtime frame.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-mono text-foreground">
            {config.globalRadius}px
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="32"
          step="2"
          value={config.globalRadius}
          onChange={(event) => updateConfig("globalRadius", Number(event.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="grid grid-cols-3 gap-1.5">
          {radiusPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => updateConfig("globalRadius", preset.value)}
              className={cn(
                "rounded-lg border px-2 py-2 text-center transition",
                config.globalRadius === preset.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50",
              )}
            >
              <p className="text-[11px] font-medium">{preset.label}</p>
              <p className="text-[10px] opacity-80">{preset.value}px</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
