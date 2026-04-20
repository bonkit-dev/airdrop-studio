"use client"

import { TwoColumnLayout } from "../../../../../src/runtime/layouts/two-column"
import type { LayoutConfig, LayoutColors } from "../../../../../src/runtime/layouts/slots"
import { useStudioStore } from "../../../lib/studio-store"
import { derivePreviewCountdownDates } from "../../../lib/preview-countdown"
import { studioSlots } from "./studio-slots"
import { HeroImageRequiredState } from "./shared"
import type { LayoutProps } from "./shared"

export function LayoutTwoColumn({ colors }: LayoutProps) {
  const { config, airdrop } = useStudioStore()
  const currentSection = useStudioStore((s) => s.currentSection)
  const scenario = useStudioStore((s) => s.previewCountdownScenario)
  const useLiveData = currentSection === "review" || currentSection === "generate-app"
  const previewDates = useLiveData ? null : derivePreviewCountdownDates(scenario)

  const layoutConfig: LayoutConfig = {
    brandName: config.brandName,
    brandNameColor: config.brandNameColor,
    heroTitle: config.heroTitle,
    heroTitleColor: config.heroTitleColor,
    heroBody: config.heroBody,
    heroImageUrl: config.heroImageUrl,
    symbolUrl: config.symbolUrl,
    heroGradientPrimary: config.heroGradientPrimary,
    heroGradientAccent: config.heroGradientAccent,
    heroImageScale: config.heroImageScale,
    heroImagePositionX: config.heroImagePositionX,
    heroImagePositionY: config.heroImagePositionY,
    heroOverlayOpacity: config.heroOverlayOpacity,
    heroGlassBlur: config.heroGlassBlur,
    heroGlassPanelColor: config.heroGlassPanelColor,
    heroGlassPanelOpacity: config.heroGlassPanelOpacity,

    showAnnouncement: config.showAnnouncement,
    announcementText: config.announcementText,
    announcementBarColorOverride: config.useAnnouncementBarColorOverride ? config.announcementBarColorOverride : undefined,

    connectWalletLabel: config.connectWalletLabel,
    claimButtonLabel: config.claimButtonLabel,
    eligibilityButtonLabel: config.eligibilityButtonLabel,

    showCountdown: config.showCountdown,
    countdownStartEyebrow: config.countdownStartEyebrow,
    countdownEndEyebrow: config.countdownEndEyebrow,
    countdownEndedLabel: config.countdownEndedLabel,
    countdownHoursLabel: config.countdownHoursLabel,
    countdownMinutesLabel: config.countdownMinutesLabel,
    countdownSecondsLabel: config.countdownSecondsLabel,
    countdownStartDate: previewDates?.start ?? airdrop.startDate ?? undefined,
    countdownEndDate: previewDates?.end ?? airdrop.endDate ?? undefined,

    statusBadgeStartLabel: config.statusBadgeStartLabel,
    statusBadgeLiveLabel: config.statusBadgeLiveLabel,
    statusBadgeEndedLabel: config.statusBadgeEndedLabel,

    showStats: config.showStats,
    statTotalClaimsVisible: config.statTotalClaimsVisible,
    statAllocatedVisible: config.statAllocatedVisible,
    statClaimedVisible: config.statClaimedVisible,
    statTotalClaimsLabel: config.statTotalClaimsLabel,
    statAllocatedLabel: config.statAllocatedLabel,
    statClaimedLabel: config.statClaimedLabel,

    showTagline: config.showTagline,
    tagline: config.tagline,
    showFooter: config.showFooter,
    footerLinks: config.footerLinks,

    logoUrl: config.logoUrl,
    showBrandNameWithLogo: config.showBrandNameWithLogo,

    rpcUrl: "",
    airdropAddress: "",
    mintAddress: airdrop.mintAddress,
    claimMode: "onchain",
    networkCluster: config.network,
    tokenSymbol: airdrop.tokenSymbol,
    tokenName: airdrop.tokenName,
  }

  const layoutColors: LayoutColors = {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
  }

  const heroFallback = !config.heroImageUrl ? (
    <HeroImageRequiredState
      className="absolute inset-0 border-x-0 border-y-0"
      message="Two Column needs a hero image"
      hint="A 4:5 portrait visual fills the left column and balances the split."
    />
  ) : undefined

  return (
    <TwoColumnLayout
      config={layoutConfig}
      colors={layoutColors}
      slots={studioSlots}
      heroFallback={heroFallback}
    />
  )
}
