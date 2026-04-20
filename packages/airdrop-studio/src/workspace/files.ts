import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { loadCampaignConfig } from "../config/load.js"
import type { CampaignConfig, LayoutPreset } from "../config/schema.js"
import { workspaceStateSchema, type WorkspaceState } from "./schema.js"

type StudioLayoutPreset = WorkspaceState["studio"]["layoutPreset"]

const defaultStudioColors: WorkspaceState["studio"]["customColors"] = {
  primary: "#00D9FF",
  secondary: "#7B61FF",
  accent: "#00D9FF",
  background: "#09090B",
  surface: "#18181B",
}

function toRuntimeLayoutPreset(layoutPreset: StudioLayoutPreset | null): LayoutPreset {
  if (!layoutPreset) return "default"
  switch (layoutPreset) {
    case "centered":
      return "centered"
    case "two-column":
      return "immersive"
    case "hero-banner":
    case "step-card":
    default:
      return "default"
  }
}

export type WorkspaceBundle = {
  rootDir: string
  configPath: string
  workspacePath: string
  exportManifestPath: string
  config: CampaignConfig
  workspace: WorkspaceState
}

export async function initializeWorkspaceFiles(rootDir: string, config: CampaignConfig): Promise<void> {
  const workspaceDir = path.join(rootDir, ".bonkit")
  await mkdir(workspaceDir, { recursive: true })
  const now = new Date().toISOString()
  const initialWorkspace: WorkspaceState = {
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    studio: {
      layoutPreset: null,
      themePreset: null,
      fontPreset: "geometric",
      useCustomColors: false,
      customColors: defaultStudioColors,
      globalRadius: 12,
      preview: {
        ctaArrangement: "inline",
        countdownEmphasis: "compact",
        statsSize: "prominent",
        heroBannerStatsPlacement: "top-bar",
        centeredContentWidth: "medium",
        centeredDensity: "comfortable",
        centeredAnnouncementStyle: "subtle",
      },
      connectWalletLabel: "Connect Wallet",
      eligibilityButtonLabel: "Check Eligibility",
      showTagline: true,
      showAnnouncement: false,
      showCountdown: false,
      showFooter: false,
      useAnnouncementBarColorOverride: false,
      announcementBarColorOverride: config.brand.colors.primary,
      countdownStartEyebrow: "Airdrop starts in",
      countdownEndEyebrow: "Airdrop ends in",
      countdownEndedLabel: "Claim window closed",
      countdownHoursLabel: "Hours",
      countdownMinutesLabel: "Minutes",
      countdownSecondsLabel: "Seconds",
      statusBadgeStartLabel: "Starting Soon",
      statusBadgeLiveLabel: "Claim Live",
      statusBadgeEndedLabel: "Ended",
      statTotalClaimsLabel: "Total Claims",
      statAllocatedLabel: "Allocated",
      statClaimedLabel: "Claimed",
      statTotalClaimsVisible: true,
      statAllocatedVisible: true,
      statClaimedVisible: true,
      showStats: true,
      brandNameColor: "",
      heroTitleColor: "",
      logoUrl: config.brand.logoUrl ?? "",
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
      announcementText: "",
      footerLinks: [],
    },
    airdrop: {
      tokenName: "",
      tokenSymbol: "",
      startDate: "",
      endDate: "",
      airdropStep: "draft",
      creatorWallet: null,
      draftSignature: null,
      recipientsSignature: null,
      depositSignature: null,
      startSignature: null,
    },
  }

  await writeFile(path.join(rootDir, "campaign.config.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8")
  await writeFile(path.join(workspaceDir, "workspace.json"), JSON.stringify(initialWorkspace, null, 2), "utf8")
}

export async function loadWorkspaceBundle(inputPath: string): Promise<WorkspaceBundle> {
  const rootDir = path.resolve(inputPath)
  const configPath = path.join(rootDir, "campaign.config.json")
  const workspacePath = path.join(rootDir, ".bonkit", "workspace.json")
  const exportManifestPath = path.join(rootDir, ".bonkit", "export-manifest.json")

  try {
    await access(rootDir)
  } catch {
    throw new Error(
      [
        `Bonkit studio could not find the target directory: ${rootDir}`,
        `Current working directory: ${process.cwd()}`,
        "Pass the path to an existing generated app directory.",
        "Examples:",
        "  airdrop-studio /absolute/path/to/my-app",
        "  cd /absolute/path/to/my-app && airdrop-studio .",
      ].join("\n"),
    )
  }

  try {
    await access(configPath)
  } catch {
    throw new Error(
      [
        `Bonkit studio could not find \`campaign.config.json\` in: ${rootDir}`,
        `Current working directory: ${process.cwd()}`,
        "Pass the path to an existing generated app directory, or run `airdrop-studio <dir>` first.",
      ].join("\n"),
    )
  }

  const config = loadCampaignConfig(JSON.parse(await readFile(configPath, "utf8")))

  try {
    await access(workspacePath)
  } catch {
    await initializeWorkspaceFiles(rootDir, config)
  }

  const workspaceRaw = JSON.parse(await readFile(workspacePath, "utf8"))
  const workspace = workspaceStateSchema.parse(workspaceRaw)

  return {
    rootDir,
    configPath,
    workspacePath,
    exportManifestPath,
    config,
    workspace,
  }
}

export function resetAirdropFields(bundle: WorkspaceBundle): WorkspaceBundle {
  const config = loadCampaignConfig({
    ...bundle.config,
    campaign: {
      ...bundle.config.campaign,
      airdropAddress: "",
      mintAddress: "",
    },
  })

  return {
    ...bundle,
    config,
    workspace: {
      ...bundle.workspace,
      airdrop: {
        ...bundle.workspace.airdrop,
        tokenName: "",
        tokenSymbol: "",
        startDate: "",
        endDate: "",
        airdropStep: "draft",
        creatorWallet: null,
        draftSignature: null,
        recipientsSignature: null,
        depositSignature: null,
        startSignature: null,
      },
    },
  }
}

export async function saveWorkspaceBundle(
  bundle: WorkspaceBundle,
  opts?: { preserveUpdatedAt?: boolean },
): Promise<void> {
  const nextWorkspace = {
    ...bundle.workspace,
    updatedAt: opts?.preserveUpdatedAt ? bundle.workspace.updatedAt : new Date().toISOString(),
    studio: bundle.workspace.studio,
  }

  await writeFile(bundle.configPath, `${JSON.stringify(bundle.config, null, 2)}\n`, "utf8")
  await writeFile(bundle.workspacePath, `${JSON.stringify(nextWorkspace, null, 2)}\n`, "utf8")
}

export async function exportWorkspaceBundle(bundle: WorkspaceBundle): Promise<void> {
  // Use a single timestamp for both updatedAt and lastExportedAt so the studio doesn't
  // incorrectly flag the config as "changed since last export" right after a fresh generate.
  const now = new Date().toISOString()
  const exportManifest = {
    schemaVersion: 1,
    exportedAt: now,
    rootDir: bundle.rootDir,
    runtimeDependency: bundle.config.campaign.claimMode,
    layoutPreset: bundle.workspace.studio.layoutPreset,
    runtimeLayoutPreset: bundle.config.ui?.layout?.preset ?? "default",
    brandName: bundle.config.brand.name,
    network: bundle.config.network.cluster,
    claimMode: bundle.config.campaign.claimMode,
  }

  bundle.workspace = {
    ...bundle.workspace,
    updatedAt: now,
    studio: {
      ...bundle.workspace.studio,
      lastExportedAt: now,
    },
  }

  await writeFile(bundle.exportManifestPath, `${JSON.stringify(exportManifest, null, 2)}\n`, "utf8")
  await saveWorkspaceBundle(bundle, { preserveUpdatedAt: true })
}

// Save payload mirrors WorkspaceState["studio"] + WorkspaceState["airdrop"] for the persisted
// fields, plus a small set of fields that the studio writes back to campaign.config.json
// (brand identity, runtime UI tokens, network/campaign config, runtime content overrides).
export type ApplyStudioEditsPayload = WorkspaceState["studio"] &
  WorkspaceState["airdrop"] & {
    // Runtime brand identity (lives in campaign.config.brand, not workspace)
    brandName: string
    tagline?: string
    // Runtime content overrides (lives in campaign.config.content)
    heroTitle?: string
    heroBody?: string
    claimButtonLabel?: string
    // Runtime theme color tokens (derived from custom colors / theme preset)
    primary: string
    secondary: string
    background: string
    foreground: string
    card: string
    cardForeground: string
    muted: string
    mutedForeground: string
    border: string
    input: string
    ring: string
    // Network / campaign config (lives in campaign.config.network and campaign.config.campaign)
    network: "mainnet-beta" | "devnet"
    rpcUrl: string
    claimMode: "onchain" | "merkle"
    airdropAddress: string
    mintAddress: string
  }

export function applyStudioEdits(bundle: WorkspaceBundle, payload: ApplyStudioEditsPayload): WorkspaceBundle {
  const config = loadCampaignConfig({
    ...bundle.config,
    brand: {
      ...bundle.config.brand,
      name: payload.brandName,
      tagline: payload.tagline || undefined,
      logoUrl: payload.logoUrl || undefined,
      colors: {
        primary: payload.primary,
        secondary: payload.secondary,
        background: payload.background,
        foreground: payload.foreground,
      },
    },
    network: {
      cluster: payload.network,
      rpcUrl: payload.rpcUrl,
    },
    campaign: {
      type: "airdrop",
      claimMode: payload.claimMode,
      airdropAddress: payload.airdropAddress,
      mintAddress: payload.mintAddress,
    },
    ui: {
      radius: `${payload.globalRadius}px`,
      layout: {
        preset: toRuntimeLayoutPreset(payload.layoutPreset),
      },
      colors: {
        announcement: payload.useAnnouncementBarColorOverride ? payload.announcementBarColorOverride : undefined,
        primaryForeground: bundle.config.ui?.colors?.primaryForeground,
        card: payload.card,
        cardForeground: payload.cardForeground,
        muted: payload.muted,
        mutedForeground: payload.mutedForeground,
        border: payload.border,
        input: payload.input,
        ring: payload.ring,
      },
    },
    content: {
      heroTitle: payload.heroTitle || undefined,
      heroBody: payload.heroBody || undefined,
      claimButtonLabel: payload.claimButtonLabel || undefined,
      announcementText: payload.announcementText || undefined,
      countdownStartEyebrow: payload.countdownStartEyebrow || undefined,
      countdownEndEyebrow: payload.countdownEndEyebrow || undefined,
      countdownEndedLabel: payload.countdownEndedLabel || undefined,
      countdownHoursLabel: payload.countdownHoursLabel || undefined,
      countdownMinutesLabel: payload.countdownMinutesLabel || undefined,
      countdownSecondsLabel: payload.countdownSecondsLabel || undefined,
      statusBadgeStartLabel: payload.statusBadgeStartLabel || undefined,
      statusBadgeLiveLabel: payload.statusBadgeLiveLabel || undefined,
      statusBadgeEndedLabel: payload.statusBadgeEndedLabel || undefined,
      statTotalClaimsLabel: payload.statTotalClaimsLabel || undefined,
      statAllocatedLabel: payload.statAllocatedLabel || undefined,
      statClaimedLabel: payload.statClaimedLabel || undefined,
    },
    links: {
      custom: payload.footerLinks
        .map((link) => ({
          label: link.label.trim(),
          href: link.href.trim(),
          category: link.category ?? "custom",
          iconOnly: link.iconOnly ?? false,
        }))
        .filter((link) => link.label.length > 0 && link.href.length > 0),
    },
  })

  return {
    ...bundle,
    config,
    workspace: {
      ...bundle.workspace,
      studio: {
        ...bundle.workspace.studio,
        layoutPreset: payload.layoutPreset,
        themePreset: payload.themePreset,
        fontPreset: payload.fontPreset,
        useCustomColors: payload.useCustomColors,
        customColors: payload.customColors,
        globalRadius: payload.globalRadius,
        preview: payload.preview,
        connectWalletLabel: payload.connectWalletLabel,
        eligibilityButtonLabel: payload.eligibilityButtonLabel,
        showTagline: payload.showTagline,
        showAnnouncement: payload.showAnnouncement,
        showCountdown: payload.showCountdown,
        showFooter: payload.showFooter,
        useAnnouncementBarColorOverride: payload.useAnnouncementBarColorOverride,
        announcementBarColorOverride: payload.announcementBarColorOverride,
        countdownStartEyebrow: payload.countdownStartEyebrow,
        countdownEndEyebrow: payload.countdownEndEyebrow,
        countdownEndedLabel: payload.countdownEndedLabel,
        countdownHoursLabel: payload.countdownHoursLabel,
        countdownMinutesLabel: payload.countdownMinutesLabel,
        countdownSecondsLabel: payload.countdownSecondsLabel,
        statusBadgeStartLabel: payload.statusBadgeStartLabel,
        statusBadgeLiveLabel: payload.statusBadgeLiveLabel,
        statusBadgeEndedLabel: payload.statusBadgeEndedLabel,
        statTotalClaimsLabel: payload.statTotalClaimsLabel,
        statAllocatedLabel: payload.statAllocatedLabel,
        statClaimedLabel: payload.statClaimedLabel,
        statTotalClaimsVisible: payload.statTotalClaimsVisible,
        statAllocatedVisible: payload.statAllocatedVisible,
        statClaimedVisible: payload.statClaimedVisible,
        showStats: payload.showStats,
        brandNameColor: payload.brandNameColor,
        heroTitleColor: payload.heroTitleColor,
        logoUrl: payload.logoUrl,
        showBrandNameWithLogo: payload.showBrandNameWithLogo,
        heroImageUrl: payload.heroImageUrl,
        heroImageScale: payload.heroImageScale,
        heroImagePositionX: payload.heroImagePositionX,
        heroImagePositionY: payload.heroImagePositionY,
        heroOverlayOpacity: payload.heroOverlayOpacity,
        heroGlassBlur: payload.heroGlassBlur,
        heroGlassPanelColor: payload.heroGlassPanelColor,
        heroGlassPanelOpacity: payload.heroGlassPanelOpacity,
        heroGradientPrimary: payload.heroGradientPrimary,
        heroGradientAccent: payload.heroGradientAccent,
        symbolUrl: payload.symbolUrl,
        announcementText: payload.announcementText ?? "",
        footerLinks: payload.footerLinks,
      },
      airdrop: {
        ...bundle.workspace.airdrop,
        tokenName: payload.tokenName,
        tokenSymbol: payload.tokenSymbol,
        startDate: payload.startDate,
        endDate: payload.endDate,
        airdropStep: payload.airdropStep,
        creatorWallet: payload.creatorWallet !== undefined ? payload.creatorWallet : bundle.workspace.airdrop.creatorWallet ?? null,
        draftSignature: payload.draftSignature !== undefined ? payload.draftSignature : bundle.workspace.airdrop.draftSignature ?? null,
        recipientsSignature: payload.recipientsSignature !== undefined ? payload.recipientsSignature : bundle.workspace.airdrop.recipientsSignature ?? null,
        depositSignature: payload.depositSignature !== undefined ? payload.depositSignature : bundle.workspace.airdrop.depositSignature ?? null,
        startSignature: payload.startSignature !== undefined ? payload.startSignature : bundle.workspace.airdrop.startSignature ?? null,
      },
    },
  }
}
