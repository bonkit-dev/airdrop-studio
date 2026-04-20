"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "../../../../../src/runtime/components/ui/popover"
import { AllocationSectionView, type AllocationItem } from "../../../../../src/runtime/components/wallet/allocation-section"
import { getAllocationClassName } from "../../../../../src/runtime/layouts/slots"
import { WalletConnectView } from "../../../../../src/runtime/components/wallet/wallet-connect-view"
import { WalletPopoverView } from "../../../../../src/runtime/components/wallet/wallet-popover-view"
import { contrastTextColor, lightenHex, isLightHex, getPrimaryCtaStyle } from "../../../../../src/runtime/layouts/shared/theme-utils"
export { contrastTextColor, lightenHex, isLightHex, getPrimaryCtaStyle }
import { SiDiscord, SiMedium, SiTelegram, SiX } from "@icons-pack/react-simple-icons"
import {
  MOCK_SOL_BALANCE,
  MOCK_WALLET_ADDRESS,
  MOCK_WALLET_SHORT,
  mockWalletOptions,
  usePreviewMock,
} from "../../../contexts/preview-mock-context"
import { useStudioStore, type FooterLinkCategory, type PreviewField } from "../../../lib/studio-store"
import { cn } from "../../../lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip"

export function SampleStat({ value, className, style }: { value: string; className?: string; style?: React.CSSProperties }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("cursor-help border-b border-dashed border-[var(--preview-border)] text-[var(--preview-fg-muted)]", className)}
          style={style}
        >
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent>Sample value — replaced with live data in deployed app</TooltipContent>
    </Tooltip>
  )
}

function deriveAirdropStatus(startDate: string, endDate: string): { label: string; pulse: boolean } {
  const now = Date.now()
  const start = startDate ? new Date(startDate).getTime() : 0
  const end = endDate ? new Date(endDate).getTime() : 0

  if (start && now < start) return { label: "Upcoming", pulse: false }
  if (end && now > end) return { label: "Ended", pulse: false }
  if (start && now >= start) return { label: "Live Airdrop", pulse: true }
  if (!start && end && now <= end) return { label: "Live Airdrop", pulse: true }
  return { label: "Live Airdrop", pulse: true }
}

export function AirdropStatusBadge({ colors, className }: { colors: { primary: string; accent: string }; className?: string }) {
  const currentSection = useStudioStore((s) => s.currentSection)
  const startDate = useStudioStore((s) => s.airdrop.startDate)
  const endDate = useStudioStore((s) => s.airdrop.endDate)
  const useLiveData = currentSection === "review" || currentSection === "generate-app"
  const { label, pulse } = useLiveData
    ? deriveAirdropStatus(startDate, endDate)
    : { label: "Live Airdrop", pulse: true }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-[var(--studio-radius-lg)] text-xs font-medium border",
        className,
      )}
      style={{ backgroundColor: `${colors.accent}15`, color: colors.accent, borderColor: `${colors.accent}30` }}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", pulse && "animate-pulse")}
        style={{ backgroundColor: colors.accent }}
      />
      {label}
    </div>
  )
}

/**
 * Returns a 0..1 multiplier that dims a layer's alpha based on the brand color's HSV saturation.
 * Saturated colors (emerald, amber) appear "louder" than muted colors (indigo) on light backgrounds
 * at the same alpha, so we automatically dim them. Pure white/gray returns 1 (no dimming).
 */
function saturationDim(hex: string): number {
  const raw = hex.replace("#", "")
  if (raw.length < 6) return 1
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturation = max === 0 ? 0 : (max - min) / max
  // At full saturation (1.0), reduce alpha by 55%. At zero saturation, no change.
  return 1 - saturation * 0.55
}

/**
 * Elevated card surface: theme surface tone with a faint top-down brand wash plus theme shadow.
 * Use for stat strips, info bands, footer cards — anywhere that should read as "lifted".
 */
export function getElevatedCardStyle(colors: LayoutProps["colors"]): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${colors.primary}0D 0%, transparent 100%), var(--preview-surface)`,
    boxShadow: "var(--preview-shadow)",
  }
}

const previewFieldLabels: Record<Exclude<PreviewField, null>, string> = {
  brandName: "Brand",
  tagline: "Tagline",
  announcementText: "Announcement",
  countdownStartEyebrow: "Countdown Eyebrow (starts in)",
  countdownEndEyebrow: "Countdown Eyebrow (ends in)",
  countdownEndedLabel: "Countdown Ended Label",
  countdownHoursLabel: "Hours Label",
  countdownMinutesLabel: "Minutes Label",
  countdownSecondsLabel: "Seconds Label",
  statusBadgeStartLabel: "Status — Before Start",
  statusBadgeLiveLabel: "Status — Live",
  statusBadgeEndedLabel: "Status — Ended",
  statTotalClaimsLabel: "Total Claims Label",
  statAllocatedLabel: "Allocated Label",
  statClaimedLabel: "Claimed Label",
  heroTitle: "Title",
  heroBody: "Body",
  logo: "Logo",
  symbol: "Symbol",
  heroImage: "Hero Image",
  claimButton: "Primary CTA",
  eligibilityButton: "Secondary CTA",
  connectWallet: "Wallet",
}

export function InspectRegion({
  children,
  className,
}: {
  label?: string
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("relative", className)}>{children}</div>
}

/**
 * Empty state shown when an image-led layout (Hero Banner, Two Column) is missing its hero
 * image. Designed to fill the entire hero region of its parent so the user gets an honest
 * visual sense of how much space the image will occupy. Place inside a sized parent (e.g.,
 * the layout's h-64/h-80/h-96 hero band, or a Two Column media side) and pass
 * `className="absolute inset-0"` to anchor.
 */
export function HeroImageRequiredState({
  className,
  message = "This layout works best with a hero image.",
  hint = "Add one from the brand inspector to complete the layout.",
}: {
  className?: string
  message?: string
  hint?: string
}) {
  const setCurrentSection = useStudioStore((state) => state.setCurrentSection)
  const setActiveField = useStudioStore((state) => state.setActiveField)
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-4 border-2 border-dashed border-[var(--preview-border)] bg-[var(--preview-tint-subtle)] p-6 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--preview-border)] bg-[var(--preview-tint-strong)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-7 w-7 text-[var(--preview-fg-muted)]"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-[var(--preview-fg)]">{message}</p>
        <p className="text-xs text-[var(--preview-fg-muted)]">{hint}</p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setCurrentSection("brand")
          setActiveField("heroImage")
        }}
        className="rounded-[var(--studio-radius-md)] border border-[var(--preview-border)] bg-[var(--preview-surface)] px-4 py-2 text-xs font-semibold text-[var(--preview-fg)] shadow-[var(--preview-shadow)] hover:bg-[var(--preview-tint-strong)]"
      >
        Add hero image →
      </button>
    </div>
  )
}

export function ImageRegion({
  field,
  children,
  className,
}: {
  field: PreviewField
  children: React.ReactNode
  className?: string
}) {
  const { activeField, setActiveField, currentSection } = useStudioStore()
  const isHighlighted = activeField === field
  const isBrandMode = currentSection === "brand"

  return (
    <div
      className={cn("relative", isBrandMode && "group", className)}
      onMouseEnter={isBrandMode ? () => setActiveField(field) : undefined}
      onMouseLeave={isBrandMode ? () => setActiveField(null) : undefined}
    >
      {children}
      {isBrandMode ? (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 transition-all duration-150",
            isHighlighted ? "bg-primary/10" : "group-hover:bg-primary/5",
          )}
          style={{
            outline: isHighlighted ? "2px solid rgba(99,102,241,0.8)" : "1px solid transparent",
            outlineOffset: "-2px",
          }}
        />
      ) : null}
    </div>
  )
}

function getHeroImageStyle(config: { heroImageScale: number; heroImagePositionX: number; heroImagePositionY: number }) {
  return {
    objectPosition: `${config.heroImagePositionX}% ${config.heroImagePositionY}%`,
    transform: `scale(${config.heroImageScale})`,
    transformOrigin: `${config.heroImagePositionX}% ${config.heroImagePositionY}%`,
  } as const
}

export function HeroOverlay({ intense = false }: { intense?: boolean } = {}) {
  // Always darkens, regardless of theme: hero text is always white-on-image so legibility
  // depends on a dark scrim. The user-controlled --preview-hero-overlay scales the strength.
  if (intense) {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          opacity: "var(--preview-hero-overlay, 0.5)",
        }}
      />
    )
  }
  return (
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)",
        opacity: "var(--preview-hero-overlay, 0.5)",
      }}
    />
  )
}

export function HeroImageSurface({
  imageUrl,
  fallback,
  className,
  imageClassName,
  overlay,
}: {
  imageUrl: string
  fallback: React.ReactNode
  className?: string
  imageClassName?: string
  overlay?: React.ReactNode
}) {
  const { config } = useStudioStore()

  return (
    <ImageRegion field="heroImage" className={cn("relative overflow-hidden", className)}>
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Hero"
            className={cn("h-full w-full object-cover", imageClassName)}
            style={getHeroImageStyle(config)}
          />
          {overlay}
        </>
      ) : (
        fallback
      )}
    </ImageRegion>
  )
}

export function HeroFallbackScene({
  colors,
  className,
  gradientPrimary,
  gradientAccent,
}: LayoutProps & {
  className?: string
  gradientPrimary?: string
  gradientAccent?: string
}) {
  const gp = gradientPrimary || colors.primary
  const ga = gradientAccent || colors.accent
  const isLight = isLightHex(colors.background)

  // Theme-aware tuning. Dark themes use additive luminance (low-alpha glows on dark).
  // Light themes use subtractive saturation: bigger washes, slower fade, brand-tinted base,
  // plus a vignette to ground the composition.
  // Light theme base gets a subtle brand-tinted corners → surface mid → accent-tinted corners.
  // Use color-mix so the perceived strength stays consistent regardless of brand saturation.
  const baseGradient = isLight
    ? `linear-gradient(160deg, color-mix(in srgb, ${gp} 6%, ${colors.background}) 0%, ${colors.surface} 38%, color-mix(in srgb, ${ga} 5%, ${colors.background}) 100%)`
    : `linear-gradient(160deg, ${colors.background} 0%, ${colors.surface} 58%, rgba(255,255,255,0.02) 100%)`

  // For light themes, scale each blob's alpha by its color's saturation. Saturated colors
  // (emerald, amber) read much louder than muted colors (indigo) on bright backgrounds at the
  // same alpha — saturationDim compensates so all themes feel equally subtle.
  const primaryDim = isLight ? saturationDim(gp) : 1
  const accentDim = isLight ? saturationDim(ga) : 1
  const secondaryDim = isLight ? saturationDim(colors.secondary) : 1
  const primaryBlobOpacity = (isLight ? 0.18 : 0.12) * primaryDim
  const accentBlobOpacity = (isLight ? 0.13 : 0.07) * accentDim
  const secondaryBlobOpacity = (isLight ? 0.11 : 0.06) * secondaryDim
  const glowBlobOpacity = (isLight ? 0.08 : 0.04) * primaryDim
  const fadeStop = isLight ? 88 : 72

  // All blob layers fill the parent (absolute inset-0). The visible blob shape is
  // controlled entirely by the gradient size in the radial-gradient — never by the
  // element's clamp width/height — so there are no rectangular box edges that could
  // create visible color seams against the surrounding background.
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute inset-0"
        style={{ background: baseGradient }}
      />
      {/* Primary blob — top center, dominant */}
      <div
        className="absolute inset-0"
        style={{
          opacity: primaryBlobOpacity,
          background: `radial-gradient(circle 36vmin at 50% 22%, ${gp} 0%, rgba(0,0,0,0) ${fadeStop}%)`,
        }}
      />
      {/* Accent blob — upper center, smaller, blurred */}
      <div
        className="absolute inset-0"
        style={{
          opacity: accentBlobOpacity,
          background: `radial-gradient(circle 26vmin at 50% 30%, ${ga} 0%, rgba(0,0,0,0) ${fadeStop - 2}%)`,
          filter: "blur(16px)",
        }}
      />
      {/* Secondary blob — bottom left */}
      <div
        className="absolute inset-0"
        style={{
          opacity: secondaryBlobOpacity,
          background: `radial-gradient(circle 30vmin at 25% 78%, ${colors.secondary} 0%, rgba(0,0,0,0) ${fadeStop}%)`,
          filter: "blur(20px)",
        }}
      />
      {/* Surface glow — right side */}
      <div
        className="absolute inset-0"
        style={{
          opacity: glowBlobOpacity,
          background: `radial-gradient(circle 22vmin at 80% 50%, ${gp} 0%, rgba(0,0,0,0) ${fadeStop - 4}%)`,
          filter: "blur(24px)",
        }}
      />
      {/* Light-theme vignette: brand-tinted corner wash to frame the composition */}
      {isLight ? (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 45%, ${gp}07 100%)`,
          }}
        />
      ) : null}
    </div>
  )
}

export function HeroBackground({
  colors,
  className,
}: LayoutProps & {
  className?: string
}) {
  const { config } = useStudioStore()
  const gp = config.heroGradientPrimary || undefined
  const ga = config.heroGradientAccent || undefined
  return <HeroFallbackScene colors={colors} className={className} gradientPrimary={gp} gradientAccent={ga} />
}

export function CommonCampaignHeader({
  colors,
  className,
}: LayoutProps & {
  className?: string
}) {
  const { config, updateConfig } = useStudioStore()

  return (
    <header className={cn("relative z-10 px-4 py-3 sm:px-5 sm:py-4", className)}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${colors.background}88 0%, ${colors.background}44 40%, transparent 100%)`,
        }}
      />
      <div className="relative flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {config.logoUrl ? (
            <ImageRegion field="logo" className="shrink-0">
              <div className="flex h-9 items-center">
                <img
                  src={config.logoUrl}
                  alt={`${config.brandName} logo`}
                  className="h-full w-auto max-w-[8.5rem] object-contain sm:max-w-[10rem]"
                />
              </div>
            </ImageRegion>
          ) : null}
          {!config.logoUrl || config.showBrandNameWithLogo ? (
            <InlineText
              field="brandName"
              value={config.brandName}
              placeholder="Your Brand"
              onChange={(value) => updateConfig("brandName", value)}
              className="min-w-0 break-words text-sm font-semibold leading-tight text-[var(--preview-brand-color)] sm:text-base"
              tag="span"
            />
          ) : null}
        </div>
        <InlineButton
          field="connectWallet"
          label={config.connectWalletLabel}
          onLabelChange={(value) => updateConfig("connectWalletLabel", value)}
          className="hidden self-end justify-center rounded-[var(--studio-radius-md)] px-3.5 py-2 text-[11px] font-semibold text-[var(--preview-fg)] sm:flex sm:w-auto sm:shrink-0 sm:px-4 sm:text-sm"
          style={{
            backgroundColor: `${colors.primary}18`,
            color: colors.primary,
            border: `1px solid ${colors.primary}32`,
            backdropFilter: "blur(8px)",
          }}
        />
      </div>
    </header>
  )
}

export function CommonMobileWalletCta({ colors }: LayoutProps) {
  const { config, updateConfig } = useStudioStore()

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-40 sm:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <InlineButton
        field="connectWallet"
        label={config.connectWalletLabel}
        onLabelChange={(value) => updateConfig("connectWalletLabel", value)}
        className="w-full justify-center rounded-[var(--studio-radius-lg)] px-4 py-3 text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: colors.primary, color: contrastTextColor(colors.primary) }}
        stretch
      />
    </div>
  )
}

export function InlineText({
  field,
  value,
  onChange,
  className,
  style,
  tag: Tag = "span",
  multiline = false,
  placeholder,
}: {
  field: PreviewField
  value: string
  onChange: (value: string) => void
  className?: string
  style?: React.CSSProperties
  tag?: React.ElementType
  multiline?: boolean
  placeholder?: string
}) {
  const { activeField, setActiveField, currentSection } = useStudioStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const isHighlighted = activeField === field
  const isBrandMode = currentSection === "brand"
  useEffect(() => {
    if (!editing) {
      setDraft(value)
    }
  }, [value, editing])

  const Component = Tag as React.ElementType

  const isPlaceholder = !value && Boolean(placeholder)

  if (!isBrandMode) {
    return (
      <Component className={cn(multiline && "whitespace-pre-wrap", className, isPlaceholder && "text-[var(--preview-fg-muted)] border-b border-dashed border-[var(--preview-border)]")} style={style}>
        {value || placeholder}
      </Component>
    )
  }

  return (
    <Component
      className={cn(
        "group/text relative cursor-text outline-none",
        multiline && "whitespace-pre-wrap",
        isPlaceholder && "text-[var(--preview-fg-muted)] border-b border-dashed border-[var(--preview-border)]",
        className,
      )}
      style={style}
      onMouseEnter={() => !editing && setActiveField(field)}
      onMouseLeave={() => !editing && setActiveField(null)}
      onClick={(event: React.MouseEvent<HTMLElement>) => {
        if (editing) return
        event.preventDefault()
        event.stopPropagation()
        setEditing(true)
        setDraft(value)
        setActiveField(field)
      }}
    ><span className={editing ? "invisible" : ""}>{value || placeholder}</span>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="absolute inset-0 z-30 h-full w-full resize-none rounded-[inherit] border border-primary/70 outline-none"
            style={{
              font: "inherit",
              fontSize: "inherit",
              fontWeight: "inherit",
              fontFamily: "inherit",
              color: "inherit",
              letterSpacing: "inherit",
              lineHeight: "inherit",
              textTransform: "inherit",
              textAlign: "inherit",
              whiteSpace: "pre-wrap",
              overflowY: "auto",
              padding: 0,
              margin: 0,
              backgroundColor: "color-mix(in srgb, var(--preview-bg) 85%, transparent)",
            }}
            onBlur={() => {
              setEditing(false)
              setActiveField(null)
              if (draft !== value) {
                onChange(draft)
              }
            }}
          />
        ) : (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="absolute inset-0 z-30 h-full w-full rounded-[inherit] border border-primary/70 outline-none"
            style={{
              font: "inherit",
              fontSize: "inherit",
              fontWeight: "inherit",
              fontFamily: "inherit",
              color: "inherit",
              letterSpacing: "inherit",
              lineHeight: "inherit",
              textTransform: "inherit",
              textAlign: "inherit",
              padding: 0,
              margin: 0,
              backgroundColor: "color-mix(in srgb, var(--preview-bg) 85%, transparent)",
            }}
            onBlur={() => {
              setEditing(false)
              setActiveField(null)
              if (draft !== value) {
                onChange(draft)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setEditing(false)
                setActiveField(null)
                if (draft !== value) {
                  onChange(draft)
                }
              }
              if (event.key === "Escape") {
                setDraft(value)
                setEditing(false)
                setActiveField(null)
              }
            }}
          />
        )
      ) : null}
      <span
        className={cn(
          "pointer-events-none absolute inset-0 transition-all duration-150",
          editing || isHighlighted ? "bg-primary/[0.04]" : "",
        )}
        style={{
          outline: editing || isHighlighted
            ? "2px solid rgba(99,102,241,0.8)"
            : "1px solid transparent",
          outlineOffset: "-2px",
        }}
      />
      {isHighlighted && !editing ? (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded z-30 whitespace-nowrap leading-none shadow-sm pointer-events-none">
          {previewFieldLabels[field as Exclude<PreviewField, null>]}
        </span>
      ) : null}
    </Component>
  )
}

export function InlineButton({
  field,
  label,
  onLabelChange,
  style,
  className,
  stretch = false,
  disabled: externalDisabled = false,
}: {
  field: PreviewField
  label: string
  onLabelChange: (value: string) => void
  style?: React.CSSProperties
  className?: string
  stretch?: boolean
  disabled?: boolean
}) {
  const { activeField, setActiveField, currentSection } = useStudioStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const isHighlighted = activeField === field
  const isBrandMode = currentSection === "brand"
  useEffect(() => {
    if (!editing) {
      setDraft(label)
    }
  }, [label, editing])

  const {
    eligibilityChecked, allocations, canClaim, claimPhase, checkEligibility, startClaim,
    walletConnected, openWalletDialog, toggleWalletDropdown,
  } = usePreviewMock()

  const handleNonBrandClick = useCallback(() => {
    if (field === "connectWallet") {
      if (walletConnected) toggleWalletDropdown()
      else openWalletDialog()
    } else if (field === "eligibilityButton") {
      checkEligibility()
    } else if (field === "claimButton") {
      startClaim()
    }
  }, [field, walletConnected, toggleWalletDropdown, openWalletDialog, checkEligibility, startClaim])

  if (!isBrandMode) {
    const isWalletButton = field === "connectWallet"
    const isClaim = field === "claimButton"
    const isEligibility = field === "eligibilityButton"
    const isInteractive = isWalletButton || isClaim || isEligibility

    const walletLabel = isWalletButton && walletConnected
      ? MOCK_WALLET_SHORT
      : label

    let displayLabel = walletLabel
    if (isClaim && claimPhase === "processing") displayLabel = "Processing..."
    else if (isClaim && claimPhase === "done") displayLabel = "Claimed!"
    else if (isEligibility && eligibilityChecked) displayLabel = "Eligible ✓"

    const claimDisabled = isClaim && (!canClaim || claimPhase !== "idle")
    const needsWallet = (isEligibility || isClaim) && !walletConnected
    // externalDisabled comes from schedule window (claim only) — layout passes it in.
    const isDisabled = claimDisabled || needsWallet || externalDisabled

    // shimmer conditions — must match generated app
    const eligibilityShimmer = isEligibility && walletConnected && !eligibilityChecked
    const singleUnclaimed = allocations.length === 1 && !allocations[0].claimed
    const claimShimmer = isClaim && walletConnected && claimPhase === "idle" && !externalDisabled && (
      (singleUnclaimed && eligibilityChecked) || canClaim
    )
    if (isWalletButton) {
      return (
        <MockWalletButton
          label={label}
          walletLabel={walletLabel}
          className={className}
          style={style}
          stretch={stretch}
        />
      )
    }

    return (
      <button
        className={cn(
          className,
          isInteractive && !isDisabled && "cursor-pointer transition-all hover:opacity-80 active:scale-[0.98]",
          isClaim && claimPhase === "processing" && "animate-pulse",
          isDisabled && "opacity-50 cursor-not-allowed",
          eligibilityShimmer && "campaign-shimmer",
          claimShimmer && "campaign-shimmer-glow",
        )}
        style={style}
        onClick={isInteractive && !isDisabled ? handleNonBrandClick : undefined}
        disabled={isDisabled}
      >
        {displayLabel}
      </button>
    )
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className={cn("relative outline-none", className)}
        style={{ ...style, textAlign: "center" }}
        onBlur={() => {
          setEditing(false)
          setActiveField(null)
          if (draft !== label) {
            onLabelChange(draft)
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            setEditing(false)
            setActiveField(null)
            if (draft !== label) {
              onLabelChange(draft)
            }
          }
          if (event.key === "Escape") {
            setDraft(label)
            setEditing(false)
            setActiveField(null)
          }
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className={cn("relative cursor-text", className)}
      style={style}
      onMouseEnter={() => setActiveField(field)}
      onMouseLeave={() => setActiveField(null)}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        setEditing(true)
        setDraft(label)
        setActiveField(field)
      }}
      aria-label={`Edit ${previewFieldLabels[field as Exclude<PreviewField, null>]}`}
    >
      {label}
      {isHighlighted ? (
        <span
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ outline: "2px solid rgba(99,102,241,0.8)", outlineOffset: "-2px" }}
        />
      ) : null}
      {isHighlighted ? (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded whitespace-nowrap leading-none shadow-sm pointer-events-none">
          {previewFieldLabels[field as Exclude<PreviewField, null>]}
        </span>
      ) : null}
    </button>
  )
}

/* ── Mock Wallet Button (with inline dropdown) ── */

function MockWalletButton({
  label,
  walletLabel,
  className,
  style,
  stretch,
}: {
  label: string
  walletLabel: string
  className?: string
  style?: React.CSSProperties
  stretch?: boolean
}) {
  const {
    walletConnected, walletDropdownOpen, openWalletDialog,
    toggleWalletDropdown, closeWalletDropdown, disconnectMockWallet,
  } = usePreviewMock()
  const dropdownId = stretch ? "mobile" : "header"
  const isOpen = walletDropdownOpen === dropdownId
  const containerRef = useRef<HTMLDivElement>(null)

  if (!walletConnected) {
    return (
      <button
        className={cn(className, "cursor-pointer transition-all hover:opacity-80 active:scale-[0.98]")}
        style={style}
        onClick={openWalletDialog}
      >
        {label}
      </button>
    )
  }

  return (
    <div ref={containerRef} className={cn("relative", stretch && "w-full")}>
    <Popover open={isOpen} onOpenChange={(open: boolean) => open ? toggleWalletDropdown(dropdownId) : closeWalletDropdown()}>
      <PopoverTrigger asChild>
        <button
          className={cn(className, "cursor-pointer transition-all hover:opacity-80 active:scale-[0.98]", stretch && "w-full")}
          style={style}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {walletLabel}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={stretch ? "top" : "bottom"}
        align="end"
        sideOffset={8}
        className={cn("p-0", stretch && "w-[var(--radix-popover-trigger-width)]")}
        container={containerRef.current}
      >
        <WalletPopoverView
          shortAddress={MOCK_WALLET_SHORT}
          fullAddress={MOCK_WALLET_ADDRESS}
          walletName="Phantom"
          balance={MOCK_SOL_BALANCE}
          accentColor={style?.color as string | undefined}
          onDisconnect={() => disconnectMockWallet()}
        />
      </PopoverContent>
    </Popover>
    </div>
  )
}

/* ── Mock Wallet Connect Dialog (scoped to preview canvas) ── */

export function MockWalletConnectDialog() {
  const { walletDialogOpen, closeWalletDialog, connectMockWallet } = usePreviewMock()

  if (!walletDialogOpen) return null

  const walletItems = mockWalletOptions.map((w) => ({
    name: w.label,
    icon: w.icon,
    statusLabel: "Detected",
    onClick: () => connectMockWallet(w.name),
  }))

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={closeWalletDialog}
      />
      <div
        className="campaign-panel relative w-[340px] overflow-hidden rounded-2xl border shadow-2xl"
      >
        <WalletConnectView
          wallets={walletItems}
          footer={
            <div style={{ borderTop: "1px solid var(--campaign-border)" }} className="px-5 py-2.5">
              <p className="text-center text-[11px] text-[var(--campaign-muted-foreground)] opacity-60">
                Preview mode — no real connection
              </p>
            </div>
          }
        />
      </div>
    </div>
  )
}

export interface LayoutProps {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
  }
}

function CountdownUnit({
  value,
  label,
  field,
  color,
  onLabelChange,
}: {
  value: number | string
  label: string
  field: "countdownHoursLabel" | "countdownMinutesLabel" | "countdownSecondsLabel"
  color: string
  onLabelChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-[var(--studio-radius-lg)] text-base font-bold text-[var(--preview-fg)] sm:h-12 sm:w-12 sm:text-lg"
        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
      >
        {value}
      </div>
      <InlineText
        field={field}
        value={label}
        onChange={onLabelChange}
        className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--preview-fg-muted)]"
        tag="span"
      />
    </div>
  )
}

const MOCK_COUNTDOWN_MS = 47 * 3600_000 + 20 * 60_000 + 12_000

export type CountdownPhase = "hidden" | "ended" | "starts-in" | "ends-in"

export function useCountdownState(): { phase: CountdownPhase; h: number; m: number; s: number } {
  const currentSection = useStudioStore((s) => s.currentSection)
  const startDate = useStudioStore((s) => s.airdrop.startDate)
  const endDate = useStudioStore((s) => s.airdrop.endDate)
  const scenario = useStudioStore((s) => s.previewCountdownScenario)
  const useLiveData = currentSection === "review" || currentSection === "generate-app"

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (!useLiveData) {
    // Non-review preview: user picks a mock scenario from the preview toolbar.
    if (scenario === "ended") {
      return { phase: "ended", h: 0, m: 0, s: 0 }
    }
    const remaining = MOCK_COUNTDOWN_MS
    const sec = Math.floor(remaining / 1000)
    const time = {
      h: Math.floor(sec / 3600),
      m: Math.floor((sec % 3600) / 60),
      s: sec % 60,
    }
    return { phase: scenario, ...time }
  }

  const startMs = startDate ? new Date(startDate).getTime() : 0
  const endMs = endDate ? new Date(endDate).getTime() : 0
  const phase: CountdownPhase = (() => {
    if (startMs && now < startMs) return "starts-in"
    if (endMs) {
      if (now <= endMs) return "ends-in"
      return "ended"
    }
    return "hidden"
  })()
  const target = phase === "starts-in" ? startMs : phase === "ends-in" ? endMs : 0
  const remaining = Math.max(0, target - now)
  const sec = Math.floor(remaining / 1000)
  return {
    phase,
    h: Math.floor(sec / 3600),
    m: Math.floor((sec % 3600) / 60),
    s: sec % 60,
  }
}

export function CommonCountdownBlock({
  colors,
  className,
  compact = false,
  onHero = false,
}: LayoutProps & {
  className?: string
  compact?: boolean
  onHero?: boolean
}) {
  const { config, updateConfig } = useStudioStore()
  const state = useCountdownState()

  if (!config.showCountdown) {
    return null
  }
  if (state.phase === "hidden") {
    return null
  }

  const onHeroStyle = onHero
    ? {
        backgroundColor: `${colors.background}cc`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${colors.accent}40`,
      }
    : undefined

  const { eyebrowField, eyebrowValue, onEyebrowChange } =
    state.phase === "starts-in"
      ? {
          eyebrowField: "countdownStartEyebrow" as const,
          eyebrowValue: config.countdownStartEyebrow,
          onEyebrowChange: (value: string) => updateConfig("countdownStartEyebrow", value),
        }
      : state.phase === "ended"
        ? {
            eyebrowField: "countdownEndedLabel" as const,
            eyebrowValue: config.countdownEndedLabel,
            onEyebrowChange: (value: string) => updateConfig("countdownEndedLabel", value),
          }
        : {
            eyebrowField: "countdownEndEyebrow" as const,
            eyebrowValue: config.countdownEndEyebrow,
            onEyebrowChange: (value: string) => updateConfig("countdownEndEyebrow", value),
          }

  const showTime = state.phase !== "ended"

  return (
    <InspectRegion label="Countdown" className={cn("shrink-0", className)}>
      <div
        className={cn("px-4 text-center rounded-[var(--studio-radius-xl)]", compact ? "py-4" : "py-5 sm:py-6")}
        style={onHeroStyle}
      >
        <div
          className={cn(
            "mx-auto rounded-[var(--studio-radius-lg)] border px-4 py-2",
            compact ? "max-w-sm" : "max-w-md",
          )}
          style={{ backgroundColor: `${colors.accent}14`, color: colors.accent, borderColor: `${colors.accent}28` }}
        >
          <InlineText
            field={eyebrowField}
            value={eyebrowValue}
            onChange={onEyebrowChange}
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            tag="span"
          />
        </div>
        {showTime ? (
          <div className={cn("mt-4 flex items-start justify-center", compact ? "gap-3" : "gap-4")}>
            <CountdownUnit
              value={String(state.h).padStart(2, "0")}
              label={config.countdownHoursLabel}
              field="countdownHoursLabel"
              color={colors.accent}
              onLabelChange={(value) => updateConfig("countdownHoursLabel", value)}
            />
            <span className="pt-2 text-xl font-bold text-[var(--preview-fg-muted)]">:</span>
            <CountdownUnit
              value={String(state.m).padStart(2, "0")}
              label={config.countdownMinutesLabel}
              field="countdownMinutesLabel"
              color={colors.accent}
              onLabelChange={(value) => updateConfig("countdownMinutesLabel", value)}
            />
            <span className="pt-2 text-xl font-bold text-[var(--preview-fg-muted)]">:</span>
            <CountdownUnit
              value={String(state.s).padStart(2, "0")}
              label={config.countdownSecondsLabel}
              field="countdownSecondsLabel"
              color={colors.accent}
              onLabelChange={(value) => updateConfig("countdownSecondsLabel", value)}
            />
          </div>
        ) : null}
      </div>
    </InspectRegion>
  )
}

export function CommonAnnouncementBar({
  colors,
  className,
}: LayoutProps & {
  className?: string
}) {
  const { config, updateConfig } = useStudioStore()
  const announcementColor = config.useAnnouncementBarColorOverride
    ? config.announcementBarColorOverride
    : colors.primary

  if (!config.showAnnouncement) {
    return null
  }

  return (
    <InspectRegion label="Announcement" className={cn("relative z-10 shrink-0", className)}>
      <div
        className="border-b border-[var(--preview-border)] px-4 py-2 text-center"
        style={{ backgroundColor: `${announcementColor}14`, color: announcementColor }}
      >
        <InlineText
          field="announcementText"
          value={config.announcementText}
          placeholder="Your announcement message"
          onChange={(value) => updateConfig("announcementText", value)}
          className="text-xs font-semibold tracking-widest"
          tag="span"
        />
      </div>
    </InspectRegion>
  )
}

// ---------------------------------------------------------------------------
// Mock allocation card — shown after Check Eligibility in preview
// ---------------------------------------------------------------------------

export function MockAllocationSection({ colors, className, maxWidthClass }: { colors: { primary: string }; className?: string; maxWidthClass?: string }) {
  const { eligibilityChecked, allocations, selectedIndex, claimPhase, selectAllocation } = usePreviewMock()
  const tokenSymbol = useStudioStore((s) => s.airdrop.tokenSymbol) || "TOKENS"

  if (!eligibilityChecked) return null

  const status = allocations.length === 0
    ? "not-eligible" as const
    : allocations.length === 1
      ? "single" as const
      : "multi" as const

  const items: AllocationItem[] = allocations.map((a) => ({
    index: a.index,
    amountLabel: a.amount,
    claimed: a.claimed,
  }))

  const totalLabel = allocations
    .reduce((sum, a) => sum + Number(a.amount.replace(/,/g, "")), 0)
    .toLocaleString()

  return (
    <AllocationSectionView
      status={status}
      allocations={items}
      primaryColor={colors.primary}
      tokenSymbol={tokenSymbol}
      totalLabel={totalLabel}
      selectedIndex={selectedIndex}
      onSelect={selectAllocation}
      claimIdle={claimPhase === "idle"}
      className={getAllocationClassName(className, maxWidthClass)}
    />
  )
}

const categoryIcons: Record<Exclude<FooterLinkCategory, "custom">, React.ReactNode> = {
  x: <SiX className="h-4 w-4 fill-current" />,
  discord: <SiDiscord className="h-4 w-4 fill-current" />,
  telegram: <SiTelegram className="h-4 w-4 fill-current" />,
  medium: <SiMedium className="h-4 w-4 fill-current" />,
}

export function CommonFooterBlock({ className }: { className?: string }) {
  const { config, updateConfig } = useStudioStore()
  const links = config.footerLinks.filter((link) => link.label.trim().length > 0 && link.href.trim().length > 0)

  if (!config.showTagline && (!config.showFooter || links.length === 0)) {
    return null
  }

  return (
    <InspectRegion label="Footer" className={cn("shrink-0", className)}>
      <footer className="border-t border-[var(--preview-border)] px-4 py-4 pb-24 text-center sm:pb-4">
        {config.showTagline ? (
          <InlineText
            field="tagline"
            value={config.tagline}
            placeholder="Your tagline here"
            onChange={(value) => updateConfig("tagline", value)}
            className="text-xs text-[var(--preview-fg-muted)]"
            tag="p"
          />
        ) : null}
        {config.showFooter && links.length > 0 ? (
          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs",
              config.showTagline ? "mt-3" : "",
            )}
          >
            {links.map((link) => {
              const category = link.category ?? "custom"
              const icon = category !== "custom" ? categoryIcons[category] : null

              if (icon && link.iconOnly) {
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className="inline-flex items-center justify-center text-[var(--preview-fg-muted)] transition hover:text-[var(--preview-fg)]"
                  >
                    {icon}
                  </a>
                )
              }

              return (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[var(--preview-fg-muted)] transition hover:text-[var(--preview-fg)]"
                >
                  {icon ? icon : null}
                  <span>{link.label}</span>
                </a>
              )
            })}
          </div>
        ) : null}
      </footer>
    </InspectRegion>
  )
}

