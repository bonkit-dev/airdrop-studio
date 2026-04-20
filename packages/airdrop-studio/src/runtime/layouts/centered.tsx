import type { LayoutColors, LayoutConfig, LayoutSlots } from "./slots"
import { getPrimaryCtaStyle, contrastTextColor, getGlassPanelStyle } from "./shared/theme-utils"
import { HeroBackground } from "./shared/HeroBackground"
import { HeroImageSurface, HeroOverlay } from "./shared/HeroImageSurface"
import { CountdownBlock, useCountdownPhase } from "./shared/CountdownBlock"
import { StatusBadge } from "./shared/StatusBadge"
import { FooterBlock } from "./shared/FooterBlock"
import { TokenIdentity } from "./shared/TokenIdentity"

type CenteredProps = {
  config: LayoutConfig
  colors: LayoutColors
  slots: LayoutSlots
}

const WIDTH_CLASS: Record<"narrow" | "medium" | "wide", string> = {
  narrow: "max-w-sm",
  medium: "max-w-lg",
  wide: "max-w-3xl",
}

const TITLE_CLASS: Record<"compact" | "comfortable", string> = {
  compact: "font-bold leading-[1.05] tracking-tight",
  comfortable: "font-bold leading-[1.02] tracking-[-0.02em]",
}

const TITLE_FONT_SIZE: Record<"compact" | "comfortable", string> = {
  compact: "clamp(1.5rem, 5.5vw, 2.25rem)",
  comfortable: "clamp(2rem, 7.5vw, 3.75rem)",
}

const CONTENT_GAP: Record<"compact" | "comfortable", string> = {
  compact: "gap-4",
  comfortable: "gap-6",
}

const MAIN_PADDING: Record<"compact" | "comfortable", string> = {
  compact: "px-5 py-6 pb-28 sm:p-6",
  comfortable: "px-5 py-8 pb-28 sm:px-8",
}

const MAIN_PADDING_GLASS: Record<"compact" | "comfortable", string> = {
  compact: "px-3 py-6 pb-28 sm:p-6",
  comfortable: "px-3 py-8 pb-28 sm:px-8",
}

export function CenteredLayout({ config, colors, slots }: CenteredProps) {
  const width = config.centeredContentWidth ?? "medium"
  const density = config.centeredDensity ?? "comfortable"
  const countdownEmphasis = config.countdownEmphasis ?? "compact"
  const announcementStyle = config.centeredAnnouncementStyle ?? "subtle"
  const ctaArrangement = config.ctaArrangement ?? "inline"
  const statsSize = config.statsSize ?? "prominent"

  const hasAnyStats =
    config.showStats && (config.statTotalClaimsVisible || config.statAllocatedVisible || config.statClaimedVisible)

  const schedulePhase = useCountdownPhase(config.countdownStartDate, config.countdownEndDate)
  const claimOutsideWindow = schedulePhase === "starts-in" || schedulePhase === "ended"

  const announcementColor = config.announcementBarColorOverride || colors.primary
  const boldAnnouncement = announcementStyle === "bold"

  const ctaInline = ctaArrangement === "inline"
  const statsProminent = statsSize === "prominent"
  const hasGlass = !!config.heroImageUrl

  return (
    <div className="relative min-h-dvh flex flex-col">
      {/* Background */}
      {config.heroImageUrl ? (
        <HeroImageSurface
          imageUrl={config.heroImageUrl}
          className="absolute inset-0"
          fallback={null}
          overlay={<HeroOverlay intense opacity={config.heroOverlayOpacity} />}
          scale={config.heroImageScale}
          positionX={config.heroImagePositionX}
          positionY={config.heroImagePositionY}
        />
      ) : (
        <HeroBackground colors={colors} gradientPrimary={config.heroGradientPrimary} gradientAccent={config.heroGradientAccent} className="z-0" />
      )}

      {/* Announcement */}
      {config.showAnnouncement ? (
        boldAnnouncement ? (
          <div
            className="relative z-10 shrink-0 border-b"
            style={{
              backgroundColor: announcementColor,
              color: contrastTextColor(announcementColor),
              borderColor: `${contrastTextColor(announcementColor)}1A`,
            }}
          >
            <div className="flex min-h-12 items-center justify-center gap-2 px-4 py-2 text-center">
              <slots.Text field="announcementText" value={config.announcementText} placeholder="Your announcement message" className="text-xs font-semibold tracking-widest opacity-90" tag="span" />
            </div>
          </div>
        ) : (
          <div
            className="relative z-10 shrink-0 border-b border-[var(--campaign-border)] px-4 py-2 text-center"
            style={{
              backgroundColor: `${announcementColor}14`,
              color: announcementColor,
            }}
          >
            <slots.Text field="announcementText" value={config.announcementText} placeholder="Your announcement message" className="text-xs font-semibold tracking-widest" tag="span" />
          </div>
        )
      ) : null}

      {/* Header */}
      <header className="relative z-20 flex shrink-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          {config.logoUrl ? (
            <div className="flex h-9 items-center shrink-0">
              <img src={config.logoUrl} alt={`${config.brandName} logo`} className="h-full w-auto max-w-[8.5rem] object-contain sm:max-w-[10rem]" />
            </div>
          ) : null}
          {!config.logoUrl || config.showBrandNameWithLogo ? (
            <slots.Text
              field="brandName"
              value={config.brandName}
              placeholder="Your Brand"
              className="min-w-0 break-words font-semibold tracking-tight text-base leading-tight text-[var(--campaign-foreground)] sm:text-lg"
              style={config.brandNameColor ? { color: config.brandNameColor } : undefined}
              tag="span"
            />
          ) : null}
        </div>
        <slots.Button
          field="connectWallet"
          label={config.connectWalletLabel}
          className={`hidden self-end justify-center rounded-[var(--campaign-radius-sm)] px-3.5 py-2 text-xs font-semibold sm:flex sm:w-auto sm:shrink-0 sm:px-4 sm:text-sm ${config.heroImageUrl ? "bg-white/15 text-white border border-white/25 backdrop-blur-sm hover:bg-white/25" : "border border-[var(--campaign-border)] text-[var(--campaign-foreground)] bg-transparent hover:bg-[var(--campaign-input)]"}`}
        />
      </header>

      {/* Main content */}
      <main className={`relative z-10 flex-1 flex flex-col items-center justify-start text-center ${hasGlass ? MAIN_PADDING_GLASS[density] : MAIN_PADDING[density]}`}>
        <div
          className={`w-full ${WIDTH_CLASS[width]}${hasGlass ? ` rounded-[var(--campaign-radius-xl)] px-4 py-8 sm:px-10 sm:py-10` : ""}`}
          style={hasGlass ? getGlassPanelStyle(config.heroGlassBlur, config.heroGlassPanelColor, config.heroGlassPanelOpacity) as React.CSSProperties : undefined}
        >
          {/* Status badge — always visible, independent of showCountdown */}
          <StatusBadge
            startDate={config.countdownStartDate}
            endDate={config.countdownEndDate}
            startLabel={config.statusBadgeStartLabel}
            liveLabel={config.statusBadgeLiveLabel}
            endedLabel={config.statusBadgeEndedLabel}
            accentColor={colors.accent}
            backgroundColor={colors.background}
            slots={slots}
            className="mb-4"
          />

          {/* Countdown */}
          {config.showCountdown ? (
            <CountdownBlock
              startEyebrow={config.countdownStartEyebrow}
              endEyebrow={config.countdownEndEyebrow}
              endedLabel={config.countdownEndedLabel}
              hoursLabel={config.countdownHoursLabel}
              minutesLabel={config.countdownMinutesLabel}
              secondsLabel={config.countdownSecondsLabel}
              startDate={config.countdownStartDate}
              endDate={config.countdownEndDate}
              accentColor={colors.accent}
              variant={countdownEmphasis === "hero" ? "hero" : undefined}
              compact={countdownEmphasis === "compact"}
              glass={hasGlass}
              glassBlur={config.heroGlassBlur}
              glassPanelColor={config.heroGlassPanelColor}
              glassPanelOpacity={config.heroGlassPanelOpacity}
              className={countdownEmphasis === "hero" ? undefined : "mb-4"}
              slots={slots}
            />
          ) : null}

          <div className={`flex flex-col items-center ${CONTENT_GAP[density]} w-full`}>
            <slots.Text
              field="heroTitle"
              value={config.heroTitle}
              placeholder="Your Headline Here"
              className={`${TITLE_CLASS[density]} text-[var(--campaign-foreground)] text-balance`}
              style={{
                fontSize: TITLE_FONT_SIZE[density],
                ...(config.heroTitleColor ? { color: config.heroTitleColor } : {}),
              }}
              tag="h1"
            />

            <slots.Text
              field="heroBody"
              value={config.heroBody}
              placeholder="Describe your campaign to potential claimants."
              className={`text-[var(--campaign-muted-foreground)] leading-relaxed ${density === "compact" ? "text-sm" : "text-base sm:text-xl max-w-md mx-auto"}`}
              tag="p"
              multiline
            />

            <TokenIdentity
              symbolUrl={config.symbolUrl}
              tokenName={config.tokenName}
              tokenSymbol={config.tokenSymbol}
              mintAddress={config.mintAddress}
              networkCluster={config.networkCluster}
              imageClassName={density === "compact" ? "w-16 h-16" : "w-20 h-20"}
            />

            {/* CTA */}
            <div
              className={`w-full max-w-md mx-auto flex ${
                ctaInline ? "flex-col sm:flex-row items-stretch gap-3" : "flex-col items-stretch gap-3"
              }`}
            >
              <slots.Button
                field="claimButton"
                label={config.claimButtonLabel}
                className={`w-full ${ctaInline ? "sm:flex-1" : ""} px-8 py-3 rounded-[var(--campaign-radius-lg)] font-semibold text-sm`}
                style={getPrimaryCtaStyle(colors.primary)}
                disabled={claimOutsideWindow}
              />
              <slots.Button
                field="eligibilityButton"
                label={config.eligibilityButtonLabel}
                className={`w-full ${ctaInline ? "sm:flex-1" : ""} px-8 py-3 rounded-[var(--campaign-radius-lg)] font-medium text-sm border border-[var(--campaign-border)] text-[var(--campaign-foreground)] bg-transparent`}
              />
            </div>
          </div>

          <slots.AllocationSection colors={colors} tokenSymbol={config.tokenSymbol} />

          {hasAnyStats ? (
            <div className={`w-full ${statsProminent ? "mt-10" : "mt-6"}`}>
              <div
                className={`grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center ${
                  statsProminent ? "sm:gap-8 pt-8" : "sm:gap-6 pt-4"
                } border-t border-[var(--campaign-border)]`}
              >
                {config.statTotalClaimsVisible ? (
                  <div className="text-center">
                    <slots.Stat field="totalClaims" value="—" className={statsProminent ? "text-2xl font-bold" : "text-lg font-bold"} />
                    <slots.Text field="statTotalClaimsLabel" value={config.statTotalClaimsLabel} className="mt-1 text-xs text-[var(--campaign-muted-foreground)]" tag="p" />
                  </div>
                ) : null}
                {config.statAllocatedVisible ? (
                  <div className="text-center">
                    <slots.Stat
                      field="totalAllocation"
                      value="—"
                      className={`${statsProminent ? "text-2xl font-bold" : "text-lg font-bold"} block`}
                      style={{ color: colors.accent }}
                    />
                    <slots.Text field="statAllocatedLabel" value={config.statAllocatedLabel} className="mt-1 text-xs text-[var(--campaign-muted-foreground)]" tag="p" />
                  </div>
                ) : null}
                {config.statClaimedVisible ? (
                  <div className="text-center">
                    <slots.Stat field="claimed" value="—" className={statsProminent ? "text-2xl font-bold" : "text-lg font-bold"} />
                    <slots.Text field="statClaimedLabel" value={config.statClaimedLabel} className="mt-1 text-xs text-[var(--campaign-muted-foreground)]" tag="p" />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <FooterBlock config={config} slots={slots} className="relative z-10" immersive />

      {/* Mobile wallet CTA */}
      <div className="fixed inset-x-4 bottom-4 z-40 sm:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}>
        <slots.Button
          field="connectWallet"
          label={config.connectWalletLabel}
          className="w-full justify-center rounded-[var(--campaign-radius-lg)] px-4 py-3 text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
          style={{ backgroundColor: colors.primary, color: contrastTextColor(colors.primary) }}
          stretch
        />
      </div>
    </div>
  )
}
