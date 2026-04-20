import type { LayoutColors, LayoutConfig, LayoutSlots } from "./slots"
import { getPrimaryCtaStyle } from "./shared/theme-utils"
import { HeroImageSurface, HeroOverlay } from "./shared/HeroImageSurface"
import { CountdownBlock, useCountdownPhase } from "./shared/CountdownBlock"
import { StatusBadge } from "./shared/StatusBadge"
import { FooterBlock } from "./shared/FooterBlock"
import { TokenIdentity } from "./shared/TokenIdentity"

type StepCardProps = {
  config: LayoutConfig
  colors: LayoutColors
  slots: LayoutSlots
}

const steps = [
  { n: 1, label: "Connect Wallet", state: "active", hint: "Current focus in the claim flow" },
  { n: 2, label: "Verify Eligibility", state: "pending", hint: "Follows after the previous step" },
  { n: 3, label: "Claim Tokens", state: "pending", hint: "Follows after the previous step" },
]

function ElevatedCardStyle(colors: LayoutColors): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${colors.primary}0D 0%, transparent 100%), var(--campaign-card)`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  }
}

export function StepCardLayout({ config, colors, slots }: StepCardProps) {
  const hasAnyStats =
    config.showStats && (config.statTotalClaimsVisible || config.statAllocatedVisible || config.statClaimedVisible)

  const schedulePhase = useCountdownPhase(config.countdownStartDate, config.countdownEndDate)
  const claimOutsideWindow = schedulePhase === "starts-in" || schedulePhase === "ended"

  return (
    <div className="min-h-dvh flex flex-col justify-center px-3 py-3 pb-28 sm:px-6 sm:py-6 sm:pb-6">
      <div className="mx-auto flex w-full max-w-md flex-col lg:max-w-lg">
        <div
          className="flex flex-col overflow-hidden rounded-[var(--campaign-radius-xl)] border shadow-[0_14px_42px_rgba(0,0,0,0.28)] sm:shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          style={{ backgroundColor: colors.surface, borderColor: `${colors.primary}20` }}
        >
          {/* Announcement */}
          {config.showAnnouncement ? (
            <div
              className="shrink-0 border-b border-[var(--campaign-border)] px-4 py-2 text-center"
              style={{
                backgroundColor: `${config.announcementBarColorOverride || colors.primary}14`,
                color: config.announcementBarColorOverride || colors.primary,
              }}
            >
              <slots.Text field="announcementText" value={config.announcementText} placeholder="Your announcement message" className="text-xs font-semibold tracking-widest" tag="span" />
            </div>
          ) : null}

          {/* Header */}
          <div className="border-b border-[var(--campaign-border)] px-3 py-3 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                {config.logoUrl ? (
                  <div className="flex h-8 items-center shrink-0 sm:h-9">
                    <img src={config.logoUrl} alt={`${config.brandName} logo`} className="h-full w-auto max-w-[7.5rem] object-contain sm:max-w-[9rem]" />
                  </div>
                ) : null}
                {!config.logoUrl || config.showBrandNameWithLogo ? (
                  <slots.Text
                    field="brandName"
                    value={config.brandName}
                    placeholder="Your Brand"
                    className="break-words text-base font-semibold leading-tight text-[var(--campaign-foreground)] sm:text-lg"
                    style={config.brandNameColor ? { color: config.brandNameColor } : undefined}
                    tag="span"
                  />
                ) : null}
              </div>
              <slots.Button
                field="connectWallet"
                label={config.connectWalletLabel}
                className="hidden self-end justify-center rounded-[var(--campaign-radius-sm)] px-3 py-2 text-[11px] font-semibold sm:flex sm:w-auto sm:shrink-0 sm:px-4 sm:py-2 sm:text-xs"
                style={{
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}30`,
                }}
              />
            </div>
          </div>

          {/* Status badge — always visible */}
          <div className="flex justify-center border-b border-[var(--campaign-border)] px-3 py-2 sm:px-5 sm:py-2.5">
            <StatusBadge
              startDate={config.countdownStartDate}
              endDate={config.countdownEndDate}
              startLabel={config.statusBadgeStartLabel}
              liveLabel={config.statusBadgeLiveLabel}
              endedLabel={config.statusBadgeEndedLabel}
              accentColor={colors.accent}
              backgroundColor={colors.background}
              slots={slots}
              compact
            />
          </div>

          {/* Hero image + countdown */}
          {config.heroImageUrl ? (
            <div className="relative h-44 w-full shrink-0 border-b border-[var(--campaign-border)] sm:h-48">
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
                    className="w-full max-w-[18rem] origin-bottom scale-[0.82] sm:max-w-[20rem] sm:scale-90"
                    slots={slots}
                  />
                </div>
              ) : null}
            </div>
          ) : config.showCountdown ? (
            <div className="border-b border-[var(--campaign-border)] px-3 py-3 sm:px-6 sm:py-4">
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
                className="mx-auto w-full max-w-sm"
                slots={slots}
              />
            </div>
          ) : null}

          <div className="flex flex-1 flex-col sm:flex-none">
            {/* Title + body */}
            <div className="flex flex-1 flex-col justify-center px-3 py-4 sm:block sm:px-6 sm:py-6">
              <div className="min-w-0">
                <slots.Text
                  field="heroTitle"
                  value={config.heroTitle}
                  placeholder="Your Headline Here"
                  className="font-bold leading-[1.05] tracking-tight text-[var(--campaign-foreground)] text-balance"
                  style={{
                    fontSize: "clamp(1.25rem, 4.5vw, 1.875rem)",
                    ...(config.heroTitleColor ? { color: config.heroTitleColor } : {}),
                  }}
                  tag="h2"
                />
                <slots.Text
                  field="heroBody"
                  value={config.heroBody}
                  placeholder="Describe your campaign to potential claimants."
                  className="mt-1.5 text-[13px] leading-relaxed text-[var(--campaign-muted-foreground)] sm:mt-2 sm:text-[15px]"
                  tag="p"
                  multiline
                />
                <TokenIdentity
                  symbolUrl={config.symbolUrl}
                  tokenName={config.tokenName}
                  tokenSymbol={config.tokenSymbol}
                  mintAddress={config.mintAddress}
                  networkCluster={config.networkCluster}
                  imageClassName="h-12 w-12 sm:h-14 sm:w-14"
                  className="mt-3 shrink-0"
                />
              </div>
            </div>

            {/* Steps */}
            <div className="flex flex-1 flex-col justify-center border-t border-[var(--campaign-border)] px-3 py-3 sm:block sm:flex-none sm:px-6 sm:py-4">
              <div className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.n}
                    className="flex items-center gap-3 rounded-[var(--campaign-radius-lg)] p-2.5 sm:p-3"
                    style={{
                      backgroundColor: step.state === "active" ? `${colors.primary}12` : `${colors.primary}08`,
                      border: `1px solid ${step.state === "active" ? `${colors.primary}25` : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold sm:h-8 sm:w-8 sm:text-xs"
                      style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                    >
                      {step.n}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--campaign-foreground)] sm:text-sm">{step.label}</p>
                      <p className="text-[11px] text-[var(--campaign-muted-foreground)]">{step.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-1 flex-col justify-center border-t border-[var(--campaign-border)] px-3 py-3 sm:block sm:flex-none sm:px-6 sm:py-4">
              <div className="space-y-2">
                <slots.Button
                  field="claimButton"
                  label={config.claimButtonLabel}
                  className="w-full rounded-[var(--campaign-radius-lg)] py-3 font-semibold text-sm"
                  style={getPrimaryCtaStyle(colors.primary)}
                  disabled={claimOutsideWindow}
                />
                <slots.Button
                  field="eligibilityButton"
                  label={config.eligibilityButtonLabel}
                  className="w-full rounded-[var(--campaign-radius-lg)] border border-[var(--campaign-border)] py-2.5 text-sm font-medium text-[var(--campaign-foreground)]"
                />
                <slots.AllocationSection colors={colors} tokenSymbol={config.tokenSymbol} />
              </div>
            </div>
          </div>

          {/* Stats */}
          {hasAnyStats ? (
            <div
              className="border-t border-[var(--campaign-border)] px-3 py-3 sm:px-6 sm:py-4"
              style={ElevatedCardStyle(colors)}
            >
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
                {config.statTotalClaimsVisible ? (
                  <div className="rounded-[var(--campaign-radius-sm)] bg-[var(--campaign-input)] px-2 py-2 text-center sm:min-w-[5rem] sm:bg-transparent sm:px-0 sm:py-0">
                    <slots.Stat field="totalClaims" value="—" className="text-sm font-bold sm:text-base" />
                    <slots.Text field="statTotalClaimsLabel" value={config.statTotalClaimsLabel} className="text-[10px] text-[var(--campaign-muted-foreground)]" tag="p" />
                  </div>
                ) : null}
                {config.statAllocatedVisible ? (
                  <div className="rounded-[var(--campaign-radius-sm)] bg-[var(--campaign-input)] px-2 py-2 text-center sm:min-w-[5rem] sm:bg-transparent sm:px-0 sm:py-0">
                    <slots.Stat field="totalAllocation" value="—" className="block text-sm font-bold sm:text-base" style={{ color: colors.accent }} />
                    <slots.Text field="statAllocatedLabel" value={config.statAllocatedLabel} className="text-[10px] text-[var(--campaign-muted-foreground)]" tag="p" />
                  </div>
                ) : null}
                {config.statClaimedVisible ? (
                  <div className="rounded-[var(--campaign-radius-sm)] bg-[var(--campaign-input)] px-2 py-2 text-center sm:min-w-[5rem] sm:bg-transparent sm:px-0 sm:py-0">
                    <slots.Stat field="claimed" value="—" className="text-sm font-bold sm:text-base" />
                    <slots.Text field="statClaimedLabel" value={config.statClaimedLabel} className="text-[10px] text-[var(--campaign-muted-foreground)]" tag="p" />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <FooterBlock config={config} slots={slots} className="mx-auto mt-3 w-full max-w-md lg:max-w-lg" />

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
