import type { LayoutColors, LayoutConfig, LayoutSlots } from "./slots"
import { getPrimaryCtaStyle } from "./shared/theme-utils"
import { HeroImageSurface, HeroOverlay } from "./shared/HeroImageSurface"
import { HeroBackground } from "./shared/HeroBackground"
import { CountdownBlock, useCountdownPhase } from "./shared/CountdownBlock"
import { StatusBadge } from "./shared/StatusBadge"
import { FooterBlock } from "./shared/FooterBlock"
import { TokenIdentity } from "./shared/TokenIdentity"

type HeroBannerProps = {
  config: LayoutConfig
  colors: LayoutColors
  slots: LayoutSlots
  heroFallback?: React.ReactNode
}

function ElevatedCardStyle(colors: LayoutColors): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${colors.primary}0D 0%, transparent 100%), var(--campaign-card)`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  }
}

export function HeroBannerLayout({ config, colors, slots, heroFallback }: HeroBannerProps) {
  const hasAnyStats =
    config.showStats && (config.statTotalClaimsVisible || config.statAllocatedVisible || config.statClaimedVisible)
  const statsAtTop = config.heroBannerStatsPlacement === "top-bar"
  const ctaInline = config.ctaArrangement === "inline"

  const schedulePhase = useCountdownPhase(config.countdownStartDate, config.countdownEndDate)
  const claimOutsideWindow = schedulePhase === "starts-in" || schedulePhase === "ended"

  const renderStats = (variant: "top-bar" | "inline") => {
    if (variant === "top-bar") {
      return (
        <div
          className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:justify-center sm:gap-8 border-b border-[var(--campaign-border)] py-3 px-4"
          style={ElevatedCardStyle(colors)}
        >
          {config.statTotalClaimsVisible ? (
            <div className="text-center">
              <slots.Stat field="totalClaims" value="—" className="text-xl font-bold" />
              <slots.Text field="statTotalClaimsLabel" value={config.statTotalClaimsLabel} className="text-xs text-[var(--campaign-muted-foreground)]" tag="p" />
            </div>
          ) : null}
          {config.statAllocatedVisible ? (
            <div className="text-center">
              <slots.Stat field="totalAllocation" value="—" className="block text-xl font-bold" style={{ color: colors.accent }} />
              <slots.Text field="statAllocatedLabel" value={config.statAllocatedLabel} className="text-xs text-[var(--campaign-muted-foreground)]" tag="p" />
            </div>
          ) : null}
          {config.statClaimedVisible ? (
            <div className="text-center">
              <slots.Stat field="claimed" value="—" className="text-xl font-bold" />
              <slots.Text field="statClaimedLabel" value={config.statClaimedLabel} className="text-xs text-[var(--campaign-muted-foreground)]" tag="p" />
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {config.statTotalClaimsVisible ? (
            <div className="p-4 rounded-[var(--campaign-radius-lg)] text-center" style={ElevatedCardStyle(colors)}>
              <slots.Stat field="totalClaims" value="—" className="text-xl font-bold" />
              <slots.Text field="statTotalClaimsLabel" value={config.statTotalClaimsLabel} className="text-xs text-[var(--campaign-muted-foreground)]" tag="p" />
            </div>
          ) : null}
          {config.statAllocatedVisible ? (
            <div className="p-4 rounded-[var(--campaign-radius-lg)] text-center" style={ElevatedCardStyle(colors)}>
              <slots.Stat field="totalAllocation" value="—" className="block text-xl font-bold" style={{ color: colors.accent }} />
              <slots.Text field="statAllocatedLabel" value={config.statAllocatedLabel} className="text-xs text-[var(--campaign-muted-foreground)]" tag="p" />
            </div>
          ) : null}
          {config.statClaimedVisible ? (
            <div className="p-4 rounded-[var(--campaign-radius-lg)] text-center" style={ElevatedCardStyle(colors)}>
              <slots.Stat field="claimed" value="—" className="text-xl font-bold" />
              <slots.Text field="statClaimedLabel" value={config.statClaimedLabel} className="text-xs text-[var(--campaign-muted-foreground)]" tag="p" />
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {config.showAnnouncement ? (
        <div
          className="relative z-10 shrink-0 border-b border-[var(--campaign-border)] px-4 py-2 text-center"
          style={{
            backgroundColor: `${config.announcementBarColorOverride || colors.primary}14`,
            color: config.announcementBarColorOverride || colors.primary,
          }}
        >
          <slots.Text field="announcementText" value={config.announcementText} placeholder="Your announcement message" className="text-xs font-semibold tracking-widest" tag="span" />
        </div>
      ) : null}

      {/* Header */}
      <header className="relative z-20 flex shrink-0 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
          className="hidden self-end justify-center rounded-[var(--campaign-radius-sm)] px-3.5 py-2 text-xs font-semibold border border-[var(--campaign-border)] text-[var(--campaign-foreground)] bg-transparent hover:bg-[var(--campaign-input)] sm:flex sm:w-auto sm:shrink-0 sm:px-4 sm:text-sm"
        />
      </header>

      {/* Hero image band */}
      <div className="relative h-64 w-full shrink-0 border-y border-[var(--campaign-border)] sm:h-80 lg:h-96">
        {config.heroImageUrl ? (
          <>
            <HeroImageSurface
              imageUrl={config.heroImageUrl}
              className="absolute inset-0"
              fallback={null}
              overlay={<HeroOverlay opacity={config.heroOverlayOpacity} />}
              scale={config.heroImageScale}
              positionX={config.heroImagePositionX}
              positionY={config.heroImagePositionY}
            />
            {config.showCountdown ? (
              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-3 sm:pb-4">
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
                  compact
                  glass
                  glassPanel
                  glassBlur={config.heroGlassBlur}
                  glassPanelColor={config.heroGlassPanelColor}
                  glassPanelOpacity={config.heroGlassPanelOpacity}
                  className="w-full max-w-sm"
                  slots={slots}
                />
              </div>
            ) : null}
          </>
        ) : heroFallback ? (
          heroFallback
        ) : (
          <HeroBackground colors={colors} gradientPrimary={config.heroGradientPrimary} gradientAccent={config.heroGradientAccent} />
        )}
      </div>

      {hasAnyStats && statsAtTop ? renderStats("top-bar") : null}

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start px-5 py-6 pb-28 sm:p-6">
        <div className="w-full max-w-lg text-center">
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
          <slots.Text
            field="heroTitle"
            value={config.heroTitle}
            placeholder="Your Headline Here"
            className="font-bold text-[var(--campaign-foreground)] mb-3 leading-[1.05] tracking-tight text-balance"
            style={{
              fontSize: "clamp(1.75rem, 6vw, 3rem)",
              ...(config.heroTitleColor ? { color: config.heroTitleColor } : {}),
            }}
            tag="h1"
          />
          <slots.Text
            field="heroBody"
            value={config.heroBody}
            placeholder="Describe your campaign to potential claimants."
            className="text-[var(--campaign-muted-foreground)] mb-6 sm:mb-8 leading-relaxed"
            tag="p"
            multiline
          />

          <TokenIdentity
            symbolUrl={config.symbolUrl}
            tokenName={config.tokenName}
            tokenSymbol={config.tokenSymbol}
            mintAddress={config.mintAddress}
            networkCluster={config.networkCluster}
            imageClassName="h-20 w-20"
            className="justify-center mb-5 sm:mb-6"
          />

          {hasAnyStats && !statsAtTop ? renderStats("inline") : null}

          <div className={ctaInline ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-2"}>
            <slots.Button
              field="claimButton"
              label={config.claimButtonLabel}
              className="w-full py-4 rounded-[var(--campaign-radius-lg)] font-semibold text-sm"
              style={getPrimaryCtaStyle(colors.primary)}
              disabled={claimOutsideWindow}
            />
            <slots.Button
              field="eligibilityButton"
              label={config.eligibilityButtonLabel}
              className="w-full py-4 rounded-[var(--campaign-radius-lg)] font-medium text-sm border border-[var(--campaign-border)] text-[var(--campaign-foreground)] bg-[var(--campaign-input)] hover:bg-[var(--campaign-input-hover)]"
            />
          </div>

          <slots.AllocationSection colors={colors} tokenSymbol={config.tokenSymbol} maxWidthClass="max-w-lg" />
        </div>
      </main>

      <FooterBlock config={config} slots={slots} />

      {/* Mobile wallet CTA */}
      <div className="fixed inset-x-4 bottom-4 z-40 sm:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}>
        <slots.Button
          field="connectWallet"
          label={config.connectWalletLabel}
          className="w-full justify-center rounded-[var(--campaign-radius-lg)] px-4 py-3 text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
          style={{ backgroundColor: colors.primary, color: "var(--campaign-primary-foreground)" }}
          stretch
        />
      </div>
    </div>
  )
}
