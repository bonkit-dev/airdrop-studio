export type TextSlotProps = {
  field: string
  value: string
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  tag?: React.ElementType
  multiline?: boolean
}

export type ButtonSlotProps = {
  field: string
  label: string
  className?: string
  style?: React.CSSProperties
  stretch?: boolean
  disabled?: boolean
}

export type StatSlotProps = {
  field?: string
  value: string
  className?: string
  style?: React.CSSProperties
}

export type AllocationSlotProps = {
  colors: LayoutColors
  tokenSymbol?: string
  className?: string
  maxWidthClass?: string
}

export function getAllocationClassName(className?: string, maxWidthClass: string = "max-w-md"): string {
  return `w-full ${maxWidthClass} mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${className ?? "mx-auto"}`
}

export type LayoutSlots = {
  Text: React.ComponentType<TextSlotProps>
  Button: React.ComponentType<ButtonSlotProps>
  Stat: React.ComponentType<StatSlotProps>
  AllocationSection: React.ComponentType<AllocationSlotProps>
}

export type LayoutColors = {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
}

export type LayoutConfig = {
  brandName: string
  brandNameColor?: string
  heroTitle: string
  heroTitleColor?: string
  heroBody: string
  heroImageUrl?: string
  symbolUrl?: string
  heroGradientPrimary?: string
  heroGradientAccent?: string

  showAnnouncement: boolean
  announcementText: string
  announcementBarColorOverride?: string

  connectWalletLabel: string
  claimButtonLabel: string
  eligibilityButtonLabel: string

  showCountdown: boolean
  countdownStartEyebrow: string
  countdownEndEyebrow: string
  countdownEndedLabel: string
  countdownHoursLabel: string
  countdownMinutesLabel: string
  countdownSecondsLabel: string
  countdownStartDate?: string
  countdownEndDate?: string

  statusBadgeStartLabel: string
  statusBadgeLiveLabel: string
  statusBadgeEndedLabel: string

  showStats: boolean
  statTotalClaimsVisible: boolean
  statAllocatedVisible: boolean
  statClaimedVisible: boolean
  statTotalClaimsLabel: string
  statAllocatedLabel: string
  statClaimedLabel: string

  showTagline: boolean
  tagline: string
  showFooter: boolean
  footerLinks: Array<{
    id?: string
    label: string
    href: string
    category?: "telegram" | "x" | "discord" | "medium" | "custom"
    iconOnly?: boolean
  }>

  logoUrl?: string
  showBrandNameWithLogo: boolean

  heroImageScale?: number
  heroImagePositionX?: number
  heroImagePositionY?: number
  heroOverlayOpacity?: number
  heroGlassBlur?: number
  heroGlassPanelColor?: string
  heroGlassPanelOpacity?: number

  // Common layout options — read by any layout that renders the matching blocks.
  ctaArrangement?: "inline" | "stacked"
  countdownEmphasis?: "compact" | "hero"
  statsSize?: "compact" | "prominent"

  heroBannerStatsPlacement?: "top-bar" | "inline"

  centeredContentWidth?: "narrow" | "medium" | "wide"
  centeredDensity?: "compact" | "comfortable"
  centeredAnnouncementStyle?: "subtle" | "bold"

  rpcUrl: string
  airdropAddress: string
  mintAddress: string
  claimMode: "onchain" | "merkle"
  networkCluster: "devnet" | "mainnet-beta"
  tokenSymbol: string
  tokenName: string
}

