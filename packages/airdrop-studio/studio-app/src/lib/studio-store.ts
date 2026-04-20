"use client"

import { create } from "zustand"
import { toast } from "../hooks/use-toast"
import {
  isLayoutPresetId,
  type LayoutPresetId,
} from "./layout-registry"
import { DEFAULT_RPC_BY_NETWORK, type NetworkCluster } from "./rpc-endpoints"
import type { OnchainAppendBatchDraft } from "./airdrop-batch-types"
import type { ThemePreset, FontPreset, AirdropStep } from "../../../src/workspace/schema"
import type { ClaimMode } from "../../../src/config/schema"

export { BLOCK_METADATA, LAYOUT_PRESET_LABELS } from "./layout-registry"
export type { ThemePreset, FontPreset, AirdropStep } from "../../../src/workspace/schema"
export type { ClaimMode } from "../../../src/config/schema"

export type StudioSection = "layout" | "brand" | "theme" | "create-airdrop" | "review" | "generate-app"
export type PreviewMode = "desktop" | "tablet" | "mobile" | "fullscreen"
export type PreviewCountdownScenario = "starts-in" | "ends-in" | "ended"
export type LayoutPreset = LayoutPresetId
export type SignerMode = "extension" | "keypair"
export type KeypairSession = {
  status: "locked" | "unlocked"
  publicKey: string | null
  expiresAt: number | null
  idleTimeoutMs: number
}
export type PreviewField =
  | "brandName"
  | "tagline"
  | "announcementText"
  | "countdownStartEyebrow"
  | "countdownEndEyebrow"
  | "countdownEndedLabel"
  | "countdownHoursLabel"
  | "countdownMinutesLabel"
  | "countdownSecondsLabel"
  | "statusBadgeStartLabel"
  | "statusBadgeLiveLabel"
  | "statusBadgeEndedLabel"
  | "statTotalClaimsLabel"
  | "statAllocatedLabel"
  | "statClaimedLabel"
  | "heroTitle"
  | "heroBody"
  | "logo"
  | "symbol"
  | "heroImage"
  | "claimButton"
  | "eligibilityButton"
  | "connectWallet"
  | null

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
}

export type FooterLinkCategory = "telegram" | "x" | "discord" | "medium" | "custom"

export interface FooterLinkDraft {
  id: string
  label: string
  href: string
  category: FooterLinkCategory
  iconOnly: boolean
}

export interface CampaignConfigDraft {
  brandName: string
  brandNameColor: string
  tagline: string
  showTagline: boolean
  announcementText: string
  showAnnouncement: boolean
  showCountdown: boolean
  showFooter: boolean
  useAnnouncementBarColorOverride: boolean
  announcementBarColorOverride: string
  countdownStartEyebrow: string
  countdownEndEyebrow: string
  countdownEndedLabel: string
  countdownHoursLabel: string
  countdownMinutesLabel: string
  countdownSecondsLabel: string
  statusBadgeStartLabel: string
  statusBadgeLiveLabel: string
  statusBadgeEndedLabel: string
  heroTitle: string
  heroTitleColor: string
  heroBody: string
  connectWalletLabel: string
  claimButtonLabel: string
  eligibilityButtonLabel: string
  statTotalClaimsLabel: string
  statAllocatedLabel: string
  statClaimedLabel: string
  statTotalClaimsVisible: boolean
  statAllocatedVisible: boolean
  statClaimedVisible: boolean
  showStats: boolean
  logoUrl: string
  showBrandNameWithLogo: boolean
  heroImageUrl: string
  heroImageScale: number
  heroImagePositionX: number
  heroImagePositionY: number
  heroOverlayOpacity: number
  heroGlassBlur: number
  heroGlassPanelColor: string
  heroGlassPanelOpacity: number
  heroGradientPrimary: string
  heroGradientAccent: string
  symbolUrl: string
  layoutPreset: LayoutPreset | null
  themePreset: ThemePreset | null
  fontPreset: FontPreset
  customColors: ThemeColors
  useCustomColors: boolean
  globalRadius: number
  // Common layout options — applied across layouts that render these blocks.
  ctaArrangement: "inline" | "stacked"
  countdownEmphasis: "compact" | "hero"
  statsSize: "compact" | "prominent"
  // Hero Banner layout-local options.
  heroBannerStatsPlacement: "top-bar" | "inline"
  // Centered layout-local options.
  centeredContentWidth: "narrow" | "medium" | "wide"
  centeredDensity: "compact" | "comfortable"
  centeredAnnouncementStyle: "subtle" | "bold"
  network: "mainnet-beta" | "devnet"
  claimMode: ClaimMode
  rpcUrl: string
  footerLinks: FooterLinkDraft[]
}

export interface AirdropConfig {
  airdropAddress: string | null
  creatorWallet: string | null
  mintAddress: string
  tokenName: string
  tokenSymbol: string
  startDate: string
  endDate: string
  currentStep: AirdropStep
  recipients: Array<{ address: string; amount: string }>
  draftSignature: string | null
  recipientsSignature: string | null
  depositSignature: string | null
  startSignature: string | null
}

export interface WorkspaceState {
  path: string
  exists: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  lastExportedAt: Date | null
}

export interface ArtifactState {
  campaignConfig: { exists: boolean; lastModified: Date | null }
  workspaceJson: { exists: boolean; lastModified: Date | null }
  exportManifest: { exists: boolean; lastModified: Date | null }
}

export interface ChecklistItem {
  id: string
  label: string
  description: string
  completed: boolean
  section: StudioSection
}

type StudioStatePayload = {
  rootDir: string
  config: {
    brand: {
      name: string
      tagline?: string
      logoUrl?: string
      colors: {
        primary: string
        secondary?: string
        background?: string
        foreground?: string
      }
    }
    network: {
      cluster: "mainnet-beta" | "devnet"
      rpcUrl: string
    }
    campaign: {
      claimMode: ClaimMode
      airdropAddress: string
      mintAddress: string
    }
    ui?: {
      layout?: { preset?: "default" | "centered" | "immersive" }
      radius?: string
      colors?: {
        announcement?: string
        card?: string
        muted?: string
        border?: string
        input?: string
        ring?: string
      }
    }
    content?: {
      heroTitle?: string
      heroBody?: string
      claimButtonLabel?: string
      announcementText?: string
      countdownStartEyebrow?: string
      countdownEndEyebrow?: string
      countdownEndedLabel?: string
      countdownHoursLabel?: string
      countdownMinutesLabel?: string
      countdownSecondsLabel?: string
      statusBadgeStartLabel?: string
      statusBadgeLiveLabel?: string
      statusBadgeEndedLabel?: string
      statTotalClaimsLabel?: string
      statAllocatedLabel?: string
      statClaimedLabel?: string
    }
    links?: {
      support?: string
      legal?: string
      twitter?: string
      discord?: string
      custom?: Array<{ label?: string; href?: string }>
    }
  }
  workspace: {
    updatedAt: string
    studio: {
      layoutPreset?: LayoutPreset
      themePreset?: ThemePreset
      fontPreset?: FontPreset
      useCustomColors?: boolean
      customColors?: ThemeColors
      globalRadius?: number
      preview?: {
        ctaArrangement?: "inline" | "stacked"
        countdownEmphasis?: "compact" | "hero"
        statsSize?: "compact" | "prominent"
        heroBannerStatsPlacement?: "top-bar" | "inline"
        centeredContentWidth?: "narrow" | "medium" | "wide"
        centeredDensity?: "compact" | "comfortable"
        centeredAnnouncementStyle?: "subtle" | "bold"
      }
      connectWalletLabel?: string
      eligibilityButtonLabel?: string
      showTagline?: boolean
      countdownStartEyebrow?: string
      countdownEndEyebrow?: string
      countdownEndedLabel?: string
      countdownHoursLabel?: string
      countdownMinutesLabel?: string
      countdownSecondsLabel?: string
      statusBadgeStartLabel?: string
      statusBadgeLiveLabel?: string
      statusBadgeEndedLabel?: string
      statTotalClaimsLabel?: string
      statAllocatedLabel?: string
      statClaimedLabel?: string
      statTotalClaimsVisible?: boolean
      statAllocatedVisible?: boolean
      statClaimedVisible?: boolean
      showStats?: boolean
      showAnnouncement?: boolean
      showCountdown?: boolean
      showFooter?: boolean
      useAnnouncementBarColorOverride?: boolean
      announcementBarColorOverride?: string
      brandNameColor?: string
      heroTitleColor?: string
      logoUrl?: string
      showBrandNameWithLogo?: boolean
      heroImageUrl?: string
      heroImageScale?: number
      heroImagePositionX?: number
      heroImagePositionY?: number
      heroOverlayOpacity?: number
      heroGlassBlur?: number
      heroGlassPanelColor?: string
      heroGlassPanelOpacity?: number
      heroGradientPrimary?: string
      heroGradientAccent?: string
      symbolUrl?: string
      announcementText?: string
      footerLinks?: Array<Partial<FooterLinkDraft>>
      lastExportedAt?: string
    }
    airdrop: {
      tokenName?: string
      tokenSymbol?: string
      startDate?: string
      endDate?: string
      airdropStep?: AirdropStep
      creatorWallet?: string | null
      draftSignature?: string | null
      recipientsSignature?: string | null
      depositSignature?: string | null
      startSignature?: string | null
    }
  }
}

export const fontPresets: Record<FontPreset, { label: string; heading: string; body: string; googleImport: string | null }> = {
  geometric: { label: "Geometric", heading: "'Space Grotesk', sans-serif", body: "'DM Sans', sans-serif", googleImport: "Space+Grotesk:wght@400;500;700|DM+Sans:wght@400;500" },
  modern: { label: "Modern", heading: "'Plus Jakarta Sans', sans-serif", body: "'Plus Jakarta Sans', sans-serif", googleImport: "Plus+Jakarta+Sans:wght@400;500;600;700" },
  rounded: { label: "Rounded", heading: "'Outfit', sans-serif", body: "'Outfit', sans-serif", googleImport: "Outfit:wght@400;500;600;700" },
  mono: { label: "Mono", heading: "'JetBrains Mono', monospace", body: "'Inter', sans-serif", googleImport: "JetBrains+Mono:wght@400;500;700|Inter:wght@400;500;600" },
  system: { label: "System", heading: "system-ui, sans-serif", body: "system-ui, sans-serif", googleImport: null },
}

export const themePresets: Record<
  ThemePreset,
  ThemeColors & { label: string; mode: "dark" | "light"; description: string }
> = {
  midnight: {
    label: "Midnight",
    mode: "dark",
    description: "Cyan-on-near-black. The default crypto vibe — neutral enough for any project, deep enough to read at night.",
    primary: "#00D9FF",
    secondary: "#7B61FF",
    accent: "#38BDF8",
    background: "#09090B",
    surface: "#1A1A1F",
  },
  slate: {
    label: "Slate",
    mode: "dark",
    description: "Indigo on cool slate. Reads like an L1/L2 product page — measured, technical, confident.",
    primary: "#818CF8",
    secondary: "#6366F1",
    accent: "#A5B4FC",
    background: "#0F172A",
    surface: "#1E293B",
  },
  carbon: {
    label: "Carbon",
    mode: "dark",
    description: "Emerald on near-pitch-black. Suits eco / sustainability / low-noise launches that want a single distinctive accent.",
    primary: "#10B981",
    secondary: "#059669",
    accent: "#34D399",
    background: "#030712",
    surface: "#0D1A14",
  },
  neon: {
    label: "Neon",
    mode: "dark",
    description: "Violet + cyan over deep space. Memecoin / playful launch energy — Phantom and pump.fun adjacent.",
    primary: "#A855F7",
    secondary: "#22D3EE",
    accent: "#F472B6",
    background: "#0A0A0F",
    surface: "#13131C",
  },
  minimal: {
    label: "Minimal",
    mode: "dark",
    description: "White on black, no accent gymnastics. Vercel/Linear discipline — only pick this if your logo carries the weight.",
    primary: "#FFFFFF",
    secondary: "#A1A1AA",
    accent: "#737373",
    background: "#000000",
    surface: "#0A0A0A",
  },
  daylight: {
    label: "Daylight",
    mode: "light",
    description: "Indigo on neutral white. Clean professional look — Notion / Linear adjacent. Good for tools, dashboards, DAOs.",
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#4F46E5",
    background: "#FAFAFA",
    surface: "#F4F4F5",
  },
  paper: {
    label: "Paper",
    mode: "light",
    description: "Black ink + saffron accent on pure white. Editorial / magazine. Works when the logo and copy are the star.",
    primary: "#0F172A",
    secondary: "#475569",
    accent: "#F97316",
    background: "#FFFFFF",
    surface: "#F8FAFC",
  },
  fresh: {
    label: "Fresh",
    mode: "light",
    description: "Teal on cool white. Clean and modern — suits DeFi dashboards, eco projects, and consumer dApps.",
    primary: "#0D9488",
    secondary: "#0891B2",
    accent: "#F59E0B",
    background: "#F8FFFE",
    surface: "#F0FDFA",
  },
}

function createFooterLinkDraft(input?: Partial<FooterLinkDraft>): FooterLinkDraft {
  const fallbackId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `footer-link-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return {
    id: input?.id?.trim() || fallbackId,
    label: input?.label ?? "",
    href: input?.href ?? "",
    category: input?.category ?? "custom",
    iconOnly: input?.iconOnly ?? false,
  }
}

export async function fetchActivityLogFromServer(): Promise<ActivityLogEntry[]> {
  try {
    const response = await fetch("/api/activity-log")
    if (!response.ok) return []
    const body = (await response.json()) as { entries: ActivityLogEntry[] }
    if (!Array.isArray(body.entries)) return []
    return body.entries.map((entry) => ({ ...entry, timestamp: new Date(entry.timestamp) })).slice(0, 100)
  } catch {
    return []
  }
}

export const PREVIEW_PLACEHOLDERS = {
  brandName: "Your Brand",
  tagline: "Your tagline here",
  heroTitle: "Your Headline Here",
  heroBody: "Describe your campaign to potential claimants.",
  announcementText: "Your announcement message",
  connectWalletLabel: "Connect Wallet",
  claimButtonLabel: "Claim",
} as const

const defaultConfig: CampaignConfigDraft = {
  brandName: "",
  brandNameColor: "",
  tagline: "",
  showTagline: false,
  announcementText: "",
  showAnnouncement: false,
  showCountdown: false,
  showFooter: false,
  useAnnouncementBarColorOverride: false,
  announcementBarColorOverride: "#00D9FF",
  countdownStartEyebrow: "Airdrop starts in",
  countdownEndEyebrow: "Airdrop ends in",
  countdownEndedLabel: "Claim window closed",
  countdownHoursLabel: "Hours",
  countdownMinutesLabel: "Minutes",
  countdownSecondsLabel: "Seconds",
  statusBadgeStartLabel: "Starting Soon",
  statusBadgeLiveLabel: "Claim Live",
  statusBadgeEndedLabel: "Ended",
  heroTitle: "",
  heroTitleColor: "",
  heroBody: "",
  connectWalletLabel: "Connect Wallet",
  claimButtonLabel: "Claim",
  eligibilityButtonLabel: "Check Eligibility",
  statTotalClaimsLabel: "Total Claims",
  statAllocatedLabel: "Allocated",
  statClaimedLabel: "Claimed",
  statTotalClaimsVisible: true,
  statAllocatedVisible: true,
  statClaimedVisible: true,
  showStats: true,
  logoUrl: "",
  showBrandNameWithLogo: false,
  heroImageUrl: "",
  heroImageScale: 1,
  heroImagePositionX: 50,
  heroImagePositionY: 50,
  heroOverlayOpacity: 50,
  heroGlassBlur: 50,
  heroGlassPanelColor: "",
  heroGlassPanelOpacity: 50,
  heroGradientPrimary: "",
  heroGradientAccent: "",
  symbolUrl: "",
  layoutPreset: null,
  themePreset: null,
  fontPreset: "geometric",
  customColors: {
    primary: "#00D9FF",
    secondary: "#7B61FF",
    accent: "#00D9FF",
    background: "#09090B",
    surface: "#18181B",
  },
  useCustomColors: false,
  globalRadius: 12,
  ctaArrangement: "inline",
  countdownEmphasis: "compact",
  statsSize: "prominent",
  heroBannerStatsPlacement: "top-bar",
  centeredContentWidth: "medium",
  centeredDensity: "comfortable",
  centeredAnnouncementStyle: "subtle",
  network: "mainnet-beta",
  claimMode: "onchain",
  rpcUrl: "https://api.mainnet.solana.com",
  footerLinks: [],
}

const defaultAirdrop: AirdropConfig = {
  airdropAddress: null,
  creatorWallet: null,
  mintAddress: "",
  tokenName: "",
  tokenSymbol: "",
  startDate: "",
  endDate: "",
  currentStep: "draft",
  recipients: [],
  draftSignature: null,
  recipientsSignature: null,
  depositSignature: null,
  startSignature: null,
}

function buildChecklist(
  savedConfig: CampaignConfigDraft,
  airdrop: AirdropConfig,
  artifacts: ArtifactState,
): ChecklistItem[] {
  return [
    {
      id: "layout-selected",
      label: "Layout Selected",
      description: "Choose your DApp layout template",
      completed: Boolean(savedConfig.layoutPreset),
      section: "layout",
    },
    {
      id: "theme-colors",
      label: "Theme Colors",
      description: "Configure color scheme",
      completed: Boolean(savedConfig.themePreset) || savedConfig.useCustomColors,
      section: "theme",
    },
    {
      id: "brand-name",
      label: "Brand Identity",
      description: "Set your brand name and logo",
      completed: Boolean(savedConfig.brandName),
      section: "brand",
    },
    {
      id: "hero-content",
      label: "Hero Content",
      description: "Configure hero title and body text",
      completed: Boolean(savedConfig.heroTitle && savedConfig.heroBody),
      section: "brand",
    },
    {
      id: "brand-content-complete",
      label: "Brand Content",
      description: "Fill in all enabled content fields",
      completed:
        (!savedConfig.showAnnouncement || Boolean(savedConfig.announcementText)) &&
        (!savedConfig.showTagline || Boolean(savedConfig.tagline)),
      section: "brand",
    },
    {
      id: "draft-created",
      label: "Draft Created",
      description: "Create the on-chain airdrop draft",
      completed: Boolean(airdrop.airdropAddress && airdrop.draftSignature),
      section: "create-airdrop",
    },
    {
      id: "recipients-added",
      label: "Recipients Registered",
      description: "Register recipients on-chain",
      completed: Boolean(airdrop.recipientsSignature),
      section: "create-airdrop",
    },
    {
      id: "deposit-completed",
      label: "Tokens Deposited",
      description: "Deposit tokens into the airdrop vault",
      completed: Boolean(airdrop.depositSignature),
      section: "create-airdrop",
    },
    {
      id: "airdrop-started",
      label: "Airdrop Started",
      description: "Launch the airdrop on-chain",
      completed: Boolean(airdrop.startSignature),
      section: "create-airdrop",
    },
    {
      id: "review",
      label: "Configuration Verified",
      description: "Verify all settings before generating",
      completed:
        Boolean(savedConfig.layoutPreset) &&
        (Boolean(savedConfig.themePreset) || savedConfig.useCustomColors) &&
        Boolean(savedConfig.brandName) &&
        Boolean(airdrop.startSignature),
      section: "review",
    },
    {
      id: "generate-app",
      label: "App Generated",
      description: "Generate deployable DApp source code",
      completed: artifacts.exportManifest.exists,
      section: "generate-app",
    },
  ]
}

function defaultArtifacts(): ArtifactState {
  return {
    campaignConfig: { exists: true, lastModified: null },
    workspaceJson: { exists: true, lastModified: null },
    exportManifest: { exists: false, lastModified: null },
  }
}

export type ActivityLogType = "save" | "transaction" | "generate" | "error" | "info"

export interface ActivityLogEntry {
  id: string
  timestamp: Date
  type: ActivityLogType
  title: string
  detail?: string
  explorerUrl?: string
}

interface StudioStore {
  hydrated: boolean
  currentSection: StudioSection
  setCurrentSection: (section: StudioSection) => void
  activeField: PreviewField
  setActiveField: (field: PreviewField) => void
  previewMode: PreviewMode
  setPreviewMode: (mode: PreviewMode) => void
  previewCountdownScenario: PreviewCountdownScenario
  setPreviewCountdownScenario: (scenario: PreviewCountdownScenario) => void
  rpcCheckStatus: "idle" | "loading" | "ok" | "mismatch" | "error"
  setRpcCheckStatus: (status: "idle" | "loading" | "ok" | "mismatch" | "error") => void
  config: CampaignConfigDraft
  savedConfig: CampaignConfigDraft
  updateConfig: <K extends keyof CampaignConfigDraft>(key: K, value: CampaignConfigDraft[K]) => void
  applyThemePreset: (preset: ThemePreset) => void
  airdrop: AirdropConfig
  updateAirdrop: <K extends keyof AirdropConfig>(key: K, value: AirdropConfig[K]) => void
  advanceAirdropStep: () => void
  resetAirdrop: () => Promise<void>
  addRecipient: (address: string, amount: string) => void
  removeRecipient: (index: number) => void
  workspace: WorkspaceState
  artifacts: ArtifactState
  checklist: ChecklistItem[]
  completedBatches: OnchainAppendBatchDraft[]
  setCompletedBatches: (batches: OnchainAppendBatchDraft[]) => void
  pushCompletedBatch: (batch: OnchainAppendBatchDraft) => void
  activityLog: ActivityLogEntry[]
  pushLog: (entry: Omit<ActivityLogEntry, "id" | "timestamp">) => void
  clearLog: () => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  signerMode: SignerMode
  setSignerMode: (mode: SignerMode) => void
  keypairSession: KeypairSession
  setKeypairSession: (session: KeypairSession) => void
  hydrateFromServer: (payload: StudioStatePayload) => void
  hydrateFromSnapshot: (snapshot: Partial<StudioStoreSnapshot>) => void
  saveConfig: () => Promise<void>
  generateApp: () => Promise<void>
}

export type StudioStoreSnapshot = Pick<
  StudioStore,
  | "currentSection"
  | "previewMode"
  | "config"
  | "airdrop"
  | "workspace"
  | "artifacts"
  | "checklist"
  | "drawerOpen"
  | "previewCountdownScenario"
  | "completedBatches"
>

function toDate(value?: string) {
  return value ? new Date(value) : null
}

function normalizeAirdropAddress(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function serializeAirdropAddress(value?: string | null) {
  return normalizeAirdropAddress(value) ?? ""
}

function touchArtifacts(state: StudioStore): ArtifactState {
  const now = new Date()
  return {
    ...state.artifacts,
    campaignConfig: { exists: true, lastModified: now },
    workspaceJson: { exists: true, lastModified: now },
  }
}

function getEffectiveColors(config: CampaignConfigDraft): ThemeColors {
  if (config.useCustomColors) {
    return config.customColors
  }
  const preset = themePresets[config.themePreset ?? "midnight"]
  return {
    primary: preset.primary,
    secondary: preset.secondary,
    accent: preset.accent,
    background: preset.background,
    surface: preset.surface,
  }
}

const SIGNER_MODE_STORAGE_KEY = "bonkit:signer-mode"

function loadPersistedSignerMode(): SignerMode {
  try {
    const value = window.localStorage.getItem(SIGNER_MODE_STORAGE_KEY)
    if (value === "keypair") return "keypair"
  } catch {}
  return "extension"
}

export const useStudioStore = create<StudioStore>((set, get) => ({
  hydrated: false,
  currentSection: "layout",
  setCurrentSection: (section) => set({ currentSection: section }),
  activeField: null,
  setActiveField: (field) => set({ activeField: field }),
  previewMode: "desktop",
  setPreviewMode: (mode) => set({ previewMode: mode }),
  previewCountdownScenario: "ends-in",
  setPreviewCountdownScenario: (scenario) => set({ previewCountdownScenario: scenario }),
  rpcCheckStatus: "idle",
  setRpcCheckStatus: (status) => set({ rpcCheckStatus: status }),
  config: defaultConfig,
  savedConfig: defaultConfig,
  updateConfig: (key, value) =>
    set((state) => {
      const nextConfig = { ...state.config, [key]: value } as CampaignConfigDraft
      if (key === "network" && value !== state.config.network) {
        nextConfig.rpcUrl = DEFAULT_RPC_BY_NETWORK[value as NetworkCluster]
      }
      return {
        config: nextConfig,
        workspace: { ...state.workspace, hasUnsavedChanges: true },
      }
    }),
  applyThemePreset: (preset) =>
    set((state) => {
      const nextConfig = {
        ...state.config,
        themePreset: preset,
        customColors: {
          primary: themePresets[preset].primary,
          secondary: themePresets[preset].secondary,
          accent: themePresets[preset].accent,
          background: themePresets[preset].background,
          surface: themePresets[preset].surface,
        },
        useCustomColors: false,
      }
      return {
        config: nextConfig,
        workspace: { ...state.workspace, hasUnsavedChanges: true },
      }
    }),
  airdrop: defaultAirdrop,
  updateAirdrop: (key, value) =>
    set((state) => {
      const nextAirdrop = { ...state.airdrop, [key]: value } as AirdropConfig
      // recipients is memory-only (persisted in .bonkit/onchain-batch-*.json, not workspace.json).
      // Changing it should not mark the workspace dirty.
      const shouldMarkDirty = key !== "recipients"
      return {
        airdrop: nextAirdrop,
        workspace: shouldMarkDirty
          ? { ...state.workspace, hasUnsavedChanges: true }
          : state.workspace,
        checklist: buildChecklist(state.savedConfig, nextAirdrop, state.artifacts),
      }
    }),
  advanceAirdropStep: () =>
    set((state) => {
      const steps: AirdropStep[] = ["draft", "recipients", "deposit", "start", "complete"]
      const currentIndex = steps.indexOf(state.airdrop.currentStep)
      const nextStep = steps[Math.min(currentIndex + 1, steps.length - 1)]
      const nextAirdrop = { ...state.airdrop, currentStep: nextStep }
      return {
        airdrop: nextAirdrop,
        workspace: { ...state.workspace, hasUnsavedChanges: true },
        checklist: buildChecklist(state.savedConfig, nextAirdrop, state.artifacts),
      }
    }),
  resetAirdrop: async () => {
    const state = get()
    const nextAirdrop = { ...defaultAirdrop }
    set({
      airdrop: nextAirdrop,
      workspace: { ...state.workspace, hasUnsavedChanges: false },
      checklist: buildChecklist(state.savedConfig, nextAirdrop, state.artifacts),
    })
    await fetch("/api/reset-airdrop", { method: "POST" })
  },
  addRecipient: (address, amount) =>
    set((state) => {
      const nextAirdrop = {
        ...state.airdrop,
        recipients: [...state.airdrop.recipients, { address, amount }],
      }
      return {
        airdrop: nextAirdrop,
        checklist: buildChecklist(state.savedConfig, nextAirdrop, state.artifacts),
      }
    }),
  removeRecipient: (index) =>
    set((state) => {
      const nextAirdrop = {
        ...state.airdrop,
        recipients: state.airdrop.recipients.filter((_, i) => i !== index),
      }
      return {
        airdrop: nextAirdrop,
        checklist: buildChecklist(state.savedConfig, nextAirdrop, state.artifacts),
      }
    }),
  workspace: {
    path: ".",
    exists: true,
    lastSaved: null,
    hasUnsavedChanges: false,
    lastExportedAt: null,
  },
  artifacts: defaultArtifacts(),
  checklist: buildChecklist(defaultConfig, defaultAirdrop, defaultArtifacts()),
  completedBatches: [],
  setCompletedBatches: (batches) => set({ completedBatches: batches }),
  pushCompletedBatch: (batch) =>
    set((state) => ({ completedBatches: [...state.completedBatches, batch] })),
  activityLog: [],
  pushLog: (entry) => {
    const fullEntry: ActivityLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
    }
    const next = [fullEntry, ...get().activityLog].slice(0, 100)
    set({ activityLog: next })
    void fetch("/api/activity-log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entry: fullEntry }),
    }).catch(() => {})
  },
  clearLog: () => {
    set({ activityLog: [] })
    void fetch("/api/activity-log", { method: "DELETE" }).catch(() => {})
  },
  drawerOpen: false,
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  signerMode: loadPersistedSignerMode(),
  setSignerMode: (mode) => {
    set({ signerMode: mode })
    try {
      window.localStorage.setItem(SIGNER_MODE_STORAGE_KEY, mode)
    } catch {}
  },
  keypairSession: {
    status: "locked",
    publicKey: null,
    expiresAt: null,
    idleTimeoutMs: 30 * 60 * 1000,
  },
  setKeypairSession: (session) => set({ keypairSession: session }),
  hydrateFromServer: (payload) => {
    // Hydration policy: workspace.studio is the single source of truth for everything the
    // studio writes. Reads from payload.config are limited to fields the studio doesn't own
    // — brand identity (name), network/RPC, campaign (claim mode, on-chain addresses), and
    // the runtime claim button label that lives in config.content.
    const config: CampaignConfigDraft = {
      brandName: payload.config.brand.name ?? "",
      brandNameColor: payload.workspace.studio.brandNameColor ?? "",
      tagline: payload.config.brand.tagline ?? "",
      showTagline: payload.workspace.studio.showTagline ?? true,
      announcementText: payload.workspace.studio.announcementText ?? "",
      showAnnouncement: payload.workspace.studio.showAnnouncement ?? false,
      showCountdown: payload.workspace.studio.showCountdown ?? false,
      showFooter: payload.workspace.studio.showFooter ?? false,
      useAnnouncementBarColorOverride: payload.workspace.studio.useAnnouncementBarColorOverride ?? false,
      announcementBarColorOverride:
        payload.workspace.studio.announcementBarColorOverride ?? payload.config.brand.colors.primary,
      countdownStartEyebrow: payload.workspace.studio.countdownStartEyebrow ?? "Airdrop starts in",
      countdownEndEyebrow: payload.workspace.studio.countdownEndEyebrow ?? "Airdrop ends in",
      countdownEndedLabel: payload.workspace.studio.countdownEndedLabel ?? "Claim window closed",
      countdownHoursLabel: payload.workspace.studio.countdownHoursLabel ?? "Hours",
      countdownMinutesLabel: payload.workspace.studio.countdownMinutesLabel ?? "Minutes",
      countdownSecondsLabel: payload.workspace.studio.countdownSecondsLabel ?? "Seconds",
      statusBadgeStartLabel: payload.workspace.studio.statusBadgeStartLabel ?? "Starting Soon",
      statusBadgeLiveLabel: payload.workspace.studio.statusBadgeLiveLabel ?? "Claim Live",
      statusBadgeEndedLabel: payload.workspace.studio.statusBadgeEndedLabel ?? "Ended",
      heroTitle: payload.config.content?.heroTitle ?? "",
      heroTitleColor: payload.workspace.studio.heroTitleColor ?? "",
      heroBody: payload.config.content?.heroBody ?? "",
      connectWalletLabel: payload.workspace.studio.connectWalletLabel ?? "Connect Wallet",
      claimButtonLabel: payload.config.content?.claimButtonLabel || "Claim",
      eligibilityButtonLabel: payload.workspace.studio.eligibilityButtonLabel ?? "Check Eligibility",
      statTotalClaimsLabel: payload.workspace.studio.statTotalClaimsLabel ?? "Total Claims",
      statAllocatedLabel: payload.workspace.studio.statAllocatedLabel ?? "Allocated",
      statClaimedLabel: payload.workspace.studio.statClaimedLabel ?? "Claimed",
      statTotalClaimsVisible: payload.workspace.studio.statTotalClaimsVisible ?? true,
      statAllocatedVisible: payload.workspace.studio.statAllocatedVisible ?? true,
      statClaimedVisible: payload.workspace.studio.statClaimedVisible ?? true,
      showStats: payload.workspace.studio.showStats ?? true,
      logoUrl: payload.workspace.studio.logoUrl ?? "",
      showBrandNameWithLogo: payload.workspace.studio.showBrandNameWithLogo ?? false,
      heroImageUrl: payload.workspace.studio.heroImageUrl ?? "",
      heroImageScale: payload.workspace.studio.heroImageScale ?? 1,
      heroImagePositionX: payload.workspace.studio.heroImagePositionX ?? 50,
      heroImagePositionY: payload.workspace.studio.heroImagePositionY ?? 50,
      heroOverlayOpacity: payload.workspace.studio.heroOverlayOpacity ?? 50,
      heroGlassBlur: payload.workspace.studio.heroGlassBlur ?? 50,
      heroGlassPanelColor: payload.workspace.studio.heroGlassPanelColor ?? "",
      heroGlassPanelOpacity: payload.workspace.studio.heroGlassPanelOpacity ?? 50,
      heroGradientPrimary: payload.workspace.studio.heroGradientPrimary ?? "",
      heroGradientAccent: payload.workspace.studio.heroGradientAccent ?? "",
      symbolUrl: payload.workspace.studio.symbolUrl ?? "",
      layoutPreset: isLayoutPresetId(payload.workspace.studio.layoutPreset)
        ? payload.workspace.studio.layoutPreset
        : null,
      themePreset: payload.workspace.studio.themePreset ?? null,
      fontPreset: payload.workspace.studio.fontPreset ?? "geometric",
      customColors: payload.workspace.studio.customColors ?? {
        primary: "#00D9FF",
        secondary: "#7B61FF",
        accent: "#00D9FF",
        background: "#09090B",
        surface: "#18181B",
      },
      useCustomColors: payload.workspace.studio.useCustomColors ?? false,
      globalRadius: payload.workspace.studio.globalRadius ?? 12,
      ctaArrangement: payload.workspace.studio.preview?.ctaArrangement ?? "inline",
      countdownEmphasis: payload.workspace.studio.preview?.countdownEmphasis ?? "compact",
      statsSize: payload.workspace.studio.preview?.statsSize ?? "prominent",
      heroBannerStatsPlacement: payload.workspace.studio.preview?.heroBannerStatsPlacement ?? "top-bar",
      centeredContentWidth: payload.workspace.studio.preview?.centeredContentWidth ?? "medium",
      centeredDensity: payload.workspace.studio.preview?.centeredDensity ?? "comfortable",
      centeredAnnouncementStyle: payload.workspace.studio.preview?.centeredAnnouncementStyle ?? "subtle",
      network: payload.config.network.cluster,
      claimMode: payload.config.campaign.claimMode,
      rpcUrl: payload.config.network.rpcUrl,
      footerLinks: payload.workspace.studio.footerLinks?.length
        ? payload.workspace.studio.footerLinks.map((link) => createFooterLinkDraft(link))
        : [],
    }

    const airdrop: AirdropConfig = {
      airdropAddress: normalizeAirdropAddress(payload.config.campaign.airdropAddress),
      mintAddress: payload.config.campaign.mintAddress ?? "",
      tokenName: payload.workspace.airdrop.tokenName ?? "",
      tokenSymbol: payload.workspace.airdrop.tokenSymbol ?? "",
      startDate: payload.workspace.airdrop.startDate ?? "",
      endDate: payload.workspace.airdrop.endDate ?? "",
      currentStep: payload.workspace.airdrop.airdropStep ?? "draft",
      recipients: [],
      creatorWallet: payload.workspace.airdrop.creatorWallet ?? null,
      draftSignature: payload.workspace.airdrop.draftSignature ?? null,
      recipientsSignature: payload.workspace.airdrop.recipientsSignature ?? null,
      depositSignature: payload.workspace.airdrop.depositSignature ?? null,
      startSignature: payload.workspace.airdrop.startSignature ?? null,
    }

    const artifacts: ArtifactState = {
      campaignConfig: { exists: true, lastModified: toDate(payload.workspace.updatedAt) },
      workspaceJson: { exists: true, lastModified: toDate(payload.workspace.updatedAt) },
      exportManifest: {
        exists: Boolean(payload.workspace.studio.lastExportedAt),
        lastModified: toDate(payload.workspace.studio.lastExportedAt),
      },
    }

    set({
      hydrated: true,
      config,
      airdrop,
      workspace: {
        path: payload.rootDir,
        exists: true,
        lastSaved: toDate(payload.workspace.updatedAt),
        hasUnsavedChanges: false,
        lastExportedAt: toDate(payload.workspace.studio.lastExportedAt),
      },
      artifacts,
      savedConfig: config,
      activityLog: [],
      checklist: buildChecklist(config, airdrop, artifacts),
    })
  },
  hydrateFromSnapshot: (snapshot) =>
    set((state) => ({
      ...state,
      ...snapshot,
      hydrated: true,
    })),
  saveConfig: async () => {
    const state = get()
    if (state.rpcCheckStatus === "mismatch" || state.rpcCheckStatus === "error") {
      toast({
        title: "RPC validation failed",
        description: "Fix the RPC URL before saving. Mainnet/Devnet must match the configured network.",
        variant: "destructive",
      })
      return
    }
    if (state.rpcCheckStatus === "loading") {
      toast({
        title: "RPC validation in progress",
        description: "Wait for the RPC cluster check to finish, then save.",
        variant: "warning",
      })
      return
    }
    const payload = {
      brandName: state.config.brandName,
      brandNameColor: state.config.brandNameColor,
      tagline: state.config.tagline,
      showTagline: state.config.showTagline,
      announcementText: state.config.announcementText,
      showAnnouncement: state.config.showAnnouncement,
      showCountdown: state.config.showCountdown,
      showFooter: state.config.showFooter,
      useAnnouncementBarColorOverride: state.config.useAnnouncementBarColorOverride,
      announcementBarColorOverride: state.config.announcementBarColorOverride,
      countdownStartEyebrow: state.config.countdownStartEyebrow,
      countdownEndEyebrow: state.config.countdownEndEyebrow,
      countdownEndedLabel: state.config.countdownEndedLabel,
      countdownHoursLabel: state.config.countdownHoursLabel,
      countdownMinutesLabel: state.config.countdownMinutesLabel,
      countdownSecondsLabel: state.config.countdownSecondsLabel,
      statusBadgeStartLabel: state.config.statusBadgeStartLabel,
      statusBadgeLiveLabel: state.config.statusBadgeLiveLabel,
      statusBadgeEndedLabel: state.config.statusBadgeEndedLabel,
      heroTitle: state.config.heroTitle,
      heroTitleColor: state.config.heroTitleColor,
      heroBody: state.config.heroBody,
      claimButtonLabel: state.config.claimButtonLabel,
      primary: getEffectiveColors(state.config).primary,
      secondary: getEffectiveColors(state.config).secondary,
      background: getEffectiveColors(state.config).background,
      foreground: "#F5F7FA",
      card: getEffectiveColors(state.config).surface,
      cardForeground: "#F5F7FA",
      muted: "#18181B",
      mutedForeground: "#A1A1AA",
      border: "#27272A",
      input: "#18181B",
      ring: getEffectiveColors(state.config).primary,
      layoutPreset: state.config.layoutPreset,
      themePreset: state.config.themePreset,
      fontPreset: state.config.fontPreset,
      useCustomColors: state.config.useCustomColors,
      customColors: state.config.customColors,
      globalRadius: state.config.globalRadius,
      preview: {
        ctaArrangement: state.config.ctaArrangement,
        countdownEmphasis: state.config.countdownEmphasis,
        statsSize: state.config.statsSize,
        heroBannerStatsPlacement: state.config.heroBannerStatsPlacement,
        centeredContentWidth: state.config.centeredContentWidth,
        centeredDensity: state.config.centeredDensity,
        centeredAnnouncementStyle: state.config.centeredAnnouncementStyle,
      },
      network: state.config.network,
      rpcUrl: state.config.rpcUrl,
      claimMode: state.config.claimMode,
      airdropAddress: serializeAirdropAddress(state.airdrop.airdropAddress),
      mintAddress: state.airdrop.mintAddress,
      connectWalletLabel: state.config.connectWalletLabel,
      eligibilityButtonLabel: state.config.eligibilityButtonLabel,
      statTotalClaimsLabel: state.config.statTotalClaimsLabel,
      statAllocatedLabel: state.config.statAllocatedLabel,
      statClaimedLabel: state.config.statClaimedLabel,
      statTotalClaimsVisible: state.config.statTotalClaimsVisible,
      statAllocatedVisible: state.config.statAllocatedVisible,
      statClaimedVisible: state.config.statClaimedVisible,
      showStats: state.config.showStats,
      logoUrl: state.config.logoUrl,
      showBrandNameWithLogo: state.config.showBrandNameWithLogo,
      heroImageUrl: state.config.heroImageUrl,
      heroImageScale: state.config.heroImageScale,
      heroImagePositionX: state.config.heroImagePositionX,
      heroImagePositionY: state.config.heroImagePositionY,
      heroOverlayOpacity: state.config.heroOverlayOpacity,
      heroGlassBlur: state.config.heroGlassBlur,
      heroGlassPanelColor: state.config.heroGlassPanelColor,
      heroGlassPanelOpacity: state.config.heroGlassPanelOpacity,
      heroGradientPrimary: state.config.heroGradientPrimary,
      heroGradientAccent: state.config.heroGradientAccent,
      symbolUrl: state.config.symbolUrl,
      tokenSymbol: state.airdrop.tokenSymbol,
      tokenName: state.airdrop.tokenName,
      startDate: state.airdrop.startDate,
      endDate: state.airdrop.endDate,
      airdropStep: state.airdrop.currentStep,
      creatorWallet: state.airdrop.creatorWallet,
      draftSignature: state.airdrop.draftSignature,
      recipientsSignature: state.airdrop.recipientsSignature,
      depositSignature: state.airdrop.depositSignature,
      startSignature: state.airdrop.startSignature,
      footerLinks: state.config.footerLinks,
    }
    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = "Could not save configuration to disk."
      try {
        const body = await response.json()
        if (body?.error) detail = body.error
      } catch {}
      toast({ title: "Save failed", description: detail, variant: "destructive" })
      return
    }

    const now = new Date()
    const nextArtifacts = touchArtifacts(state)
    const nextSavedConfig = { ...state.config }
    set({
      savedConfig: nextSavedConfig,
      artifacts: nextArtifacts,
      workspace: {
        ...state.workspace,
        lastSaved: now,
        hasUnsavedChanges: false,
      },
      checklist: buildChecklist(nextSavedConfig, state.airdrop, nextArtifacts),
    })
    get().pushLog({ type: "save", title: "Configuration saved" })
    toast({ title: "Saved", variant: "success" })
  },
  generateApp: async () => {
    get().pushLog({ type: "generate", title: "Generating app..." })
    try {
      const res = await fetch("/api/generate-app", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      const now = new Date()
      set((state) => {
        const nextArtifacts = {
          ...state.artifacts,
          exportManifest: { exists: true, lastModified: now },
        }
        return {
          artifacts: nextArtifacts,
          workspace: { ...state.workspace, lastExportedAt: now },
          checklist: buildChecklist(state.savedConfig, state.airdrop, nextArtifacts),
        }
      })
      get().pushLog({ type: "generate", title: "App generated", detail: "Run pnpm dev to preview" })
    } catch (error) {
      get().pushLog({
        type: "error",
        title: "App generation failed",
        detail: error instanceof Error ? error.message : undefined,
      })
    }
  },
}))
