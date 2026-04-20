import { z } from "zod"

// schemaVersion is locked to 1 for the v1 launch. There is no version-migration framework
// yet — old workspaces with mismatched shapes will fail Zod validation. Once a real first
// release is in users' hands, introduce a discriminated union per version + migration
// functions before bumping schemaVersion.

export const studioLayoutPresetSchema = z.enum([
  "two-column",
  "hero-banner",
  "centered",
  "step-card",
])
export const themePresetSchema = z.enum([
  "midnight",
  "slate",
  "carbon",
  "neon",
  "minimal",
  "daylight",
  "paper",
  "fresh",
])
export const fontPresetSchema = z.enum(["system", "modern", "rounded", "geometric", "mono"])
export const airdropStepSchema = z.enum(["draft", "recipients", "deposit", "start", "complete"])

const customColorsSchema = z.object({
  primary: z.string().default("#00D9FF"),
  secondary: z.string().default("#7B61FF"),
  accent: z.string().default("#00D9FF"),
  background: z.string().default("#09090B"),
  surface: z.string().default("#18181B"),
})

const footerLinkCategorySchema = z.enum(["telegram", "x", "discord", "medium", "custom"])

const footerLinkSchema = z.object({
  id: z.string().optional(),
  label: z.string().default(""),
  href: z.string().default(""),
  category: footerLinkCategorySchema.default("custom"),
  iconOnly: z.boolean().default(false),
})

// Studio preview-only options: render hints that the studio preview reads but the runtime
// app does NOT consume. Layout-specific tweaks live here so they're clearly separated from
// fields that affect the deployed app.
const previewOptionsSchema = z.object({
  // Common options — applicable across layouts that render these blocks.
  ctaArrangement: z.enum(["inline", "stacked"]).default("inline"),
  countdownEmphasis: z.enum(["compact", "hero"]).default("compact"),
  statsSize: z.enum(["compact", "prominent"]).default("prominent"),
  // Hero banner layout-local options.
  heroBannerStatsPlacement: z.enum(["top-bar", "inline"]).default("top-bar"),
  // Centered layout-local options.
  centeredContentWidth: z.enum(["narrow", "medium", "wide"]).default("medium"),
  centeredDensity: z.enum(["compact", "comfortable"]).default("comfortable"),
  centeredAnnouncementStyle: z.enum(["subtle", "bold"]).default("subtle"),
})

// Studio sub-schema: UI design state. Anything the user toggles or styles in the studio editor
// lives here. Persistent across sessions but never read by the runtime app.
const studioSubSchema = z.object({
  layoutPreset: studioLayoutPresetSchema.nullable().default(null),
  themePreset: themePresetSchema.nullable().default(null),
  fontPreset: fontPresetSchema.default("geometric"),
  useCustomColors: z.boolean().default(false),
  customColors: customColorsSchema.default({
    primary: "#00D9FF",
    secondary: "#7B61FF",
    accent: "#00D9FF",
    background: "#09090B",
    surface: "#18181B",
  }),
  globalRadius: z.number().min(0).max(32).default(12),
  preview: previewOptionsSchema.default({
    ctaArrangement: "inline",
    countdownEmphasis: "compact",
    statsSize: "prominent",
    heroBannerStatsPlacement: "top-bar",
    centeredContentWidth: "medium",
    centeredDensity: "comfortable",
    centeredAnnouncementStyle: "subtle",
  }),
  connectWalletLabel: z.string().default("Connect Wallet"),
  eligibilityButtonLabel: z.string().default("Check Eligibility"),
  showTagline: z.boolean().default(true),
  showAnnouncement: z.boolean().default(false),
  showCountdown: z.boolean().default(false),
  showFooter: z.boolean().default(false),
  useAnnouncementBarColorOverride: z.boolean().default(false),
  announcementBarColorOverride: z.string().default("#00D9FF"),
  countdownStartEyebrow: z.string().default("Airdrop starts in"),
  countdownEndEyebrow: z.string().default("Airdrop ends in"),
  countdownEndedLabel: z.string().default("Claim window closed"),
  countdownHoursLabel: z.string().default("Hours"),
  countdownMinutesLabel: z.string().default("Minutes"),
  countdownSecondsLabel: z.string().default("Seconds"),
  statusBadgeStartLabel: z.string().default("Starting Soon"),
  statusBadgeLiveLabel: z.string().default("Claim Live"),
  statusBadgeEndedLabel: z.string().default("Ended"),
  statTotalClaimsLabel: z.string().default("Total Claims"),
  statAllocatedLabel: z.string().default("Allocated"),
  statClaimedLabel: z.string().default("Claimed"),
  statTotalClaimsVisible: z.boolean().default(true),
  statAllocatedVisible: z.boolean().default(true),
  statClaimedVisible: z.boolean().default(true),
  showStats: z.boolean().default(true),
  brandNameColor: z.string().default(""),
  heroTitleColor: z.string().default(""),
  logoUrl: z.string().default(""),
  showBrandNameWithLogo: z.boolean().default(false),
  heroImageUrl: z.string().default(""),
  heroImageScale: z.number().min(1).max(2.5).default(1),
  heroImagePositionX: z.number().min(0).max(100).default(50),
  heroImagePositionY: z.number().min(0).max(100).default(50),
  heroOverlayOpacity: z.number().min(0).max(100).default(50),
  heroGlassBlur: z.number().min(0).max(100).default(50),
  heroGlassPanelColor: z.string().default(""),
  heroGlassPanelOpacity: z.number().min(0).max(100).default(50),
  heroGradientPrimary: z.string().default(""),
  heroGradientAccent: z.string().default(""),
  symbolUrl: z.string().default(""),
  announcementText: z.string().default(""),
  footerLinks: z.array(footerLinkSchema).default([]),
  lastExportedAt: z.string().optional(),
})

// Airdrop sub-schema: on-chain lifecycle state. Token metadata, schedule, transaction
// signatures, current step. Recipients / totalAllocation live in .bonkit/onchain-batch-*.json
// (history) and memory (pending). onchainStatus is fetched live from the chain.
const airdropSubSchema = z.object({
  tokenName: z.string().default(""),
  tokenSymbol: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  airdropStep: airdropStepSchema.default("draft"),
  creatorWallet: z.string().nullable().default(null),
  draftSignature: z.string().nullable().default(null),
  recipientsSignature: z.string().nullable().default(null),
  depositSignature: z.string().nullable().default(null),
  startSignature: z.string().nullable().default(null),
})

export const workspaceStateSchema = z.object({
  schemaVersion: z.literal(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  studio: studioSubSchema,
  airdrop: airdropSubSchema,
})

export type WorkspaceState = z.infer<typeof workspaceStateSchema>
export type StudioLayoutPreset = z.infer<typeof studioLayoutPresetSchema>
export type ThemePreset = z.infer<typeof themePresetSchema>
export type FontPreset = z.infer<typeof fontPresetSchema>
export type AirdropStep = z.infer<typeof airdropStepSchema>
