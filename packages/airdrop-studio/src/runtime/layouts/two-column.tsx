import type { LayoutColors, LayoutConfig, LayoutSlots } from "./slots"
import { getPrimaryCtaStyle } from "./shared/theme-utils"
import { HeroImageSurface, HeroOverlay } from "./shared/HeroImageSurface"
import { HeroBackground } from "./shared/HeroBackground"
import { CountdownBlock, useCountdownPhase } from "./shared/CountdownBlock"
import { StatusBadge } from "./shared/StatusBadge"
import { FooterBlock } from "./shared/FooterBlock"
import { TokenIdentity } from "./shared/TokenIdentity"

type TwoColumnProps = {
  config: LayoutConfig
  colors: LayoutColors
  slots: LayoutSlots
  heroFallback?: React.ReactNode
}

export function TwoColumnLayout({ config, colors, slots, heroFallback }: TwoColumnProps) {
  const hasAnyStats =
    config.showStats && (config.statTotalClaimsVisible || config.statAllocatedVisible || config.statClaimedVisible)

  const schedulePhase = useCountdownPhase(config.countdownStartDate, config.countdownEndDate)
  const claimOutsideWindow = schedulePhase === "starts-in" || schedulePhase === "ended"

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

      <main className="relative flex-1 flex flex-col pb-28 xl:flex-row xl:pb-0">
        {/* Header — positioned over both columns */}
        <header className="absolute inset-x-0 top-0 z-20 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 xl:px-8">
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

        {/* Left column — hero image */}
        <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] border-b border-[var(--campaign-border)] pt-18 xl:aspect-auto xl:w-1/2 xl:border-b-0 xl:border-r xl:border-[var(--campaign-border)] xl:pt-0">
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
                <div className="relative z-10 flex h-full flex-col items-center justify-end p-4 sm:p-6 xl:p-8">
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

        {/* Right column — content */}
        <div className="w-full xl:w-1/2 p-5 pt-6 sm:p-8 sm:pt-8 xl:pt-24 flex flex-col items-center text-center xl:items-start xl:text-left justify-start xl:justify-center">
          <StatusBadge
            startDate={config.countdownStartDate}
            endDate={config.countdownEndDate}
            startLabel={config.statusBadgeStartLabel}
            liveLabel={config.statusBadgeLiveLabel}
            endedLabel={config.statusBadgeEndedLabel}
            accentColor={colors.accent}
            backgroundColor={colors.background}
            slots={slots}
            className="mb-4 xl:self-start"
          />
          <slots.Text
            field="heroTitle"
            value={config.heroTitle}
            placeholder="Your Headline Here"
            className="font-bold text-[var(--campaign-foreground)] mb-3 sm:mb-4 leading-[1.05] tracking-tight text-balance"
            style={{
              fontSize: "clamp(1.75rem, 5.5vw, 3rem)",
              ...(config.heroTitleColor ? { color: config.heroTitleColor } : {}),
            }}
            tag="h1"
          />
          <slots.Text
            field="heroBody"
            value={config.heroBody}
            placeholder="Describe your campaign to potential claimants."
            className="text-[var(--campaign-muted-foreground)] text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed max-w-xl"
            tag="p"
            multiline
          />

          <TokenIdentity
            symbolUrl={config.symbolUrl}
            tokenName={config.tokenName}
            tokenSymbol={config.tokenSymbol}
            mintAddress={config.mintAddress}
            networkCluster={config.networkCluster}
            imageClassName="h-16 w-16"
            className="mb-4 shrink-0"
          />

          <div className="space-y-3 w-full max-w-md">
            <slots.Button
              field="claimButton"
              label={config.claimButtonLabel}
              className="w-full py-3 sm:py-4 rounded-[var(--campaign-radius-lg)] font-bold text-sm sm:text-base"
              style={getPrimaryCtaStyle(colors.primary)}
              disabled={claimOutsideWindow}
            />
            <slots.Button
              field="eligibilityButton"
              label={config.eligibilityButtonLabel}
              className="w-full py-3 sm:py-4 rounded-[var(--campaign-radius-lg)] font-medium text-sm sm:text-base border-2 border-[var(--campaign-border)] text-[var(--campaign-foreground)] bg-transparent"
            />
          </div>

          <slots.AllocationSection colors={colors} tokenSymbol={config.tokenSymbol} className="self-start" />

          {hasAnyStats ? (
            <div className="w-full mt-6 sm:mt-8">
              <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:justify-center xl:justify-start sm:gap-6 pt-5 sm:pt-6 border-t border-[var(--campaign-border)]">
                {config.statTotalClaimsVisible ? (
                  <div className="text-center xl:text-left">
                    <slots.Stat field="totalClaims" value="—" className="text-2xl sm:text-3xl font-bold" />
                    <slots.Text field="statTotalClaimsLabel" value={config.statTotalClaimsLabel} className="text-xs sm:text-sm text-[var(--campaign-muted-foreground)]" tag="p" />
                  </div>
                ) : null}
                {config.statAllocatedVisible ? (
                  <div className="text-center xl:text-left">
                    <slots.Stat field="totalAllocation" value="—" className="block text-2xl sm:text-3xl font-bold" style={{ color: colors.accent }} />
                    <slots.Text field="statAllocatedLabel" value={config.statAllocatedLabel} className="text-xs sm:text-sm text-[var(--campaign-muted-foreground)]" tag="p" />
                  </div>
                ) : null}
                {config.statClaimedVisible ? (
                  <div className="text-center xl:text-left">
                    <slots.Stat field="claimed" value="—" className="text-2xl sm:text-3xl font-bold" />
                    <slots.Text field="statClaimedLabel" value={config.statClaimedLabel} className="text-xs sm:text-sm text-[var(--campaign-muted-foreground)]" tag="p" />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <FooterBlock config={config} slots={slots} className="relative z-10" />

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
