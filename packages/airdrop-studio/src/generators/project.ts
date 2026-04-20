import { readdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getThemeTokens } from "../theme/tokens.js"
import { deriveSemanticTokens, isLightBg } from "../theme/derive.js"
import { createDocVariables } from "./docs.js"
import { createEnvVariables } from "./env.js"
import { buildCampaignConfig, createTemplateVariables } from "./config.js"
import { getTemplate } from "../templates/manifest.js"
import type { CampaignAnswers } from "../types.js"
import { copyRenderedTemplateDirectory, ensureDirectory, ensureEmptyDirectory } from "../utils/fs.js"
import { initializeWorkspaceFiles, type WorkspaceBundle } from "../workspace/files.js"

// --- Init: workspace-only scaffolding ---

export async function initWorkspace(answers: CampaignAnswers): Promise<string> {
  const targetDir = path.resolve(process.cwd(), answers.projectName)
  await ensureEmptyDirectory(targetDir)
  await initializeWorkspaceFiles(targetDir, buildCampaignConfig(answers))
  return targetDir
}

// --- Generate App: full project from existing workspace ---

export async function generateProjectApp(bundle: WorkspaceBundle): Promise<void> {
  const answers = bundleToAnswers(bundle)
  const template = getTemplate(answers.template)
  const variables = {
    ...createTemplateVariables(answers),
    ...createEnvVariables(answers),
    ...createDocVariables(answers),
    // Override with the actual workspace config instead of rebuilt defaults
    campaignConfigJson: JSON.stringify(bundle.config, null, 2),
  }

  await copyRenderedTemplateDirectory(template.templatePath, bundle.rootDir, variables)
  const runtimeRoot = resolveRuntimeSourceRoot()
  process.stdout.write(`[generate] Runtime source root: ${runtimeRoot}\n`)
  await copyCampaignWebSources(bundle.rootDir)
  process.stdout.write(`[generate] Source files copied\n`)
  const imageOverrides = await extractDataUrlImages(bundle.rootDir, bundle.workspace.studio)
  await generateThemeFile(bundle.rootDir, bundle.config, bundle.workspace)
  process.stdout.write(`[generate] Theme file generated\n`)
  await generateLayoutConfigFile(bundle.rootDir, bundle.config, bundle.workspace, imageOverrides)
  process.stdout.write(`[generate] Layout config generated\n`)
  await generateAppFile(bundle.rootDir, bundle.workspace.studio.layoutPreset)
  process.stdout.write(`[generate] App file generated\n`)
  await generateIndexHtml(bundle.rootDir, bundle.config, bundle.workspace, imageOverrides)
  process.stdout.write(`[generate] index.html generated\n`)
  await generateRobotsTxt(bundle.rootDir)
  process.stdout.write(`[generate] robots.txt generated\n`)
  await generateEnvFile(bundle.rootDir, bundle.config)
  process.stdout.write(`[generate] .env file generated\n`)
}

function bundleToAnswers(bundle: WorkspaceBundle): CampaignAnswers {
  return {
    projectName: path.basename(bundle.rootDir),
    template: "default",
    brandName: bundle.config.brand.name,
    network: bundle.config.network.cluster,
    rpcUrl: bundle.config.network.rpcUrl,
    claimMode: bundle.config.campaign.claimMode,
    airdropAddress: bundle.config.campaign.airdropAddress,
    mintAddress: bundle.config.campaign.mintAddress,
    browser: false,
    skipInstall: true,
  }
}

// --- Data URL image extraction ---

const dataUrlImageFields = [
  { studioKey: "heroImageUrl", fileName: "hero" },
  { studioKey: "logoUrl", fileName: "logo" },
  { studioKey: "symbolUrl", fileName: "symbol" },
] as const

type ImageOverrides = Record<string, string>

async function extractDataUrlImages(
  targetDir: string,
  studio: Record<string, unknown>,
): Promise<ImageOverrides> {
  const publicDir = path.join(targetDir, "public")
  const overrides: ImageOverrides = {}

  for (const { studioKey, fileName } of dataUrlImageFields) {
    const value = studio[studioKey]
    if (typeof value !== "string" || !value.startsWith("data:")) continue

    const match = value.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!match) continue

    const ext = match[1] === "jpeg" ? "jpg" : match[1]
    const buffer = Buffer.from(match[2], "base64")
    const outputName = `${fileName}.${ext}`

    await ensureDirectory(publicDir)
    await writeFile(path.join(publicDir, outputName), buffer)

    overrides[studioKey] = `/${outputName}`
  }

  if (Object.keys(overrides).length > 0) {
    process.stdout.write(`[generate] Extracted ${Object.keys(overrides).length} data URL image(s) to public/\n`)
  }

  return overrides
}

// --- Runtime source ejection ---

function stripJsExtensions(content: string): string {
  // Only strip .js from relative imports (./  ../) — never from package names like @solana/web3.js
  return content.replace(/(from\s+["']\.\.?\/[^"']+)\.js(["'])/g, "$1$2")
}

function resolveRuntimeSourceRoot(): string {
  // In dev (tsx): import.meta.url → src/generators/project.ts → ../runtime = src/runtime ✓
  // In dist: import.meta.url → dist/generators/project.js → need to find src/runtime
  const candidate = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "runtime")
  if (existsSync(candidate)) return candidate
  // Fallback: walk up to package root and use src/runtime
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
  const srcRuntime = path.join(packageRoot, "src", "runtime")
  if (existsSync(srcRuntime)) return srcRuntime
  throw new Error("Could not locate runtime source directory.")
}

async function copyCampaignWebSources(targetDir: string): Promise<void> {
  const sourceRoot = resolveRuntimeSourceRoot()

  const copyTargets = [
    { from: "components/ui", to: "src/components/ui" },
    { from: "components/wallet", to: "src/components/wallet" },
    { from: "hooks", to: "src/hooks" },
    { from: "lib", to: "src/lib" },
    { from: "layouts", to: "src/layouts" },
    { from: "styles", to: "src/styles" },
  ]

  for (const target of copyTargets) {
    await copySourceDirectory(
      path.join(sourceRoot, target.from),
      path.join(targetDir, target.to),
    )
  }
}

async function copySourceDirectory(sourceDir: string, destDir: string): Promise<void> {
  await ensureDirectory(destDir)
  const entries = await readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await copySourceDirectory(path.join(sourceDir, entry.name), path.join(destDir, entry.name))
      continue
    }
    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx") && !entry.name.endsWith(".css")) continue

    const content = await readFile(path.join(sourceDir, entry.name), "utf8")
    await writeFile(path.join(destDir, entry.name), stripJsExtensions(content), "utf8")
  }
}

// --- Theme baking ---

const fontPresets: Record<string, { heading: string; body: string; googleImport: string | null }> = {
  geometric: { heading: "'Space Grotesk', sans-serif", body: "'DM Sans', sans-serif", googleImport: "Space+Grotesk:wght@400;500;700|DM+Sans:wght@400;500" },
  modern: { heading: "'Plus Jakarta Sans', sans-serif", body: "'Plus Jakarta Sans', sans-serif", googleImport: "Plus+Jakarta+Sans:wght@400;500;600;700" },
  rounded: { heading: "'Outfit', sans-serif", body: "'Outfit', sans-serif", googleImport: "Outfit:wght@400;500;600;700" },
  mono: { heading: "'JetBrains Mono', monospace", body: "'Inter', sans-serif", googleImport: "JetBrains+Mono:wght@400;500;700|Inter:wght@400;500;600" },
  system: { heading: "system-ui, sans-serif", body: "system-ui, sans-serif", googleImport: null },
}

async function generateThemeFile(
  targetDir: string,
  config: import("../config/schema.js").CampaignConfig,
  workspace?: import("../workspace/files.js").WorkspaceBundle["workspace"],
): Promise<void> {
  // Derive theme from workspace colors using the same logic as the studio
  // preview, not from campaign.config.json which may contain stale values.
  const ws = workspace?.studio
  const theme = ws
    ? (() => {
        const colors = ws.customColors
        const derived = deriveSemanticTokens(colors, ws.globalRadius)
        return {
          primary: colors.primary,
          primaryForeground: derived.primaryForeground,
          secondary: colors.secondary,
          background: colors.background,
          foreground: derived.foreground,
          card: derived.card,
          cardForeground: derived.cardForeground,
          muted: derived.muted,
          mutedForeground: derived.mutedForeground,
          border: derived.border,
          input: derived.tintSubtle,
          inputHover: derived.tintStrong,
          ring: derived.ring,
          radius: derived.radiusLg,
          radiusSm: derived.radiusSm,
          radiusMd: derived.radiusMd,
          radiusLg: derived.radiusLg,
          radiusXl: derived.radiusXl,
          colorScheme: isLightBg(colors.background) ? "light" : "dark",
        }
      })()
    : getThemeTokens(config)
  const entries = Object.entries(theme)
    .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
    .join(",\n")

  const fontPresetId = workspace?.studio.fontPreset ?? "geometric"
  const font = fontPresets[fontPresetId] ?? fontPresets.geometric

  const content = [
    `import type { ThemeTokens } from "./types"`,
    ``,
    `export const theme: ThemeTokens = {`,
    entries,
    `}`,
    ``,
    `export const fonts = {`,
    `  heading: ${JSON.stringify(font.heading)},`,
    `  body: ${JSON.stringify(font.body)},`,
    `  googleImport: ${JSON.stringify(font.googleImport)},`,
    `}`,
    ``,
  ].join("\n")

  await writeFile(path.join(targetDir, "src", "theme.ts"), content, "utf8")
}

// --- Layout config baking ---

async function generateLayoutConfigFile(
  targetDir: string,
  config: import("../config/schema.js").CampaignConfig,
  workspace: import("../workspace/files.js").WorkspaceBundle["workspace"],
  imageOverrides: ImageOverrides = {},
): Promise<void> {
  const s = workspace.studio
  const a = workspace.airdrop

  const layoutConfig = {
    brandName: config.brand.name || "",
    brandNameColor: s.brandNameColor || undefined,
    heroTitle: config.content?.heroTitle || "",
    heroTitleColor: s.heroTitleColor || undefined,
    heroBody: config.content?.heroBody || "",
    heroImageUrl: imageOverrides.heroImageUrl || s.heroImageUrl || undefined,
    symbolUrl: imageOverrides.symbolUrl || s.symbolUrl || undefined,
    heroGradientPrimary: s.heroGradientPrimary || undefined,
    heroGradientAccent: s.heroGradientAccent || undefined,
    heroImageScale: s.heroImageScale !== 1 ? s.heroImageScale : undefined,
    heroImagePositionX: s.heroImagePositionX !== 50 ? s.heroImagePositionX : undefined,
    heroImagePositionY: s.heroImagePositionY !== 50 ? s.heroImagePositionY : undefined,
    heroOverlayOpacity: s.heroOverlayOpacity !== 50 ? s.heroOverlayOpacity : undefined,
    heroGlassBlur: s.heroGlassBlur !== 50 ? s.heroGlassBlur : undefined,
    heroGlassPanelColor: s.heroGlassPanelColor || undefined,
    heroGlassPanelOpacity: s.heroGlassPanelOpacity !== 50 ? s.heroGlassPanelOpacity : undefined,

    showAnnouncement: s.showAnnouncement,
    announcementText: s.announcementText || config.content?.announcementText || "",
    announcementBarColorOverride: s.useAnnouncementBarColorOverride ? s.announcementBarColorOverride : undefined,

    connectWalletLabel: s.connectWalletLabel || "Connect Wallet",
    claimButtonLabel: config.content?.claimButtonLabel || "Claim",
    eligibilityButtonLabel: s.eligibilityButtonLabel || "",

    showCountdown: s.showCountdown,
    countdownStartEyebrow: s.countdownStartEyebrow || config.content?.countdownStartEyebrow || "Airdrop starts in",
    countdownEndEyebrow: s.countdownEndEyebrow || config.content?.countdownEndEyebrow || "Airdrop ends in",
    countdownEndedLabel: s.countdownEndedLabel || config.content?.countdownEndedLabel || "Claim window closed",
    countdownHoursLabel: s.countdownHoursLabel || "Hours",
    countdownMinutesLabel: s.countdownMinutesLabel || "Minutes",
    countdownSecondsLabel: s.countdownSecondsLabel || "Seconds",
    countdownStartDate: a.startDate || undefined,
    countdownEndDate: a.endDate || undefined,

    statusBadgeStartLabel: s.statusBadgeStartLabel || config.content?.statusBadgeStartLabel || "Starting Soon",
    statusBadgeLiveLabel: s.statusBadgeLiveLabel || config.content?.statusBadgeLiveLabel || "Claim Live",
    statusBadgeEndedLabel: s.statusBadgeEndedLabel || config.content?.statusBadgeEndedLabel || "Ended",

    showStats: s.showStats,
    statTotalClaimsVisible: s.statTotalClaimsVisible,
    statAllocatedVisible: s.statAllocatedVisible,
    statClaimedVisible: s.statClaimedVisible,
    statTotalClaimsLabel: s.statTotalClaimsLabel || "Total Claims",
    statAllocatedLabel: s.statAllocatedLabel || "Allocated",
    statClaimedLabel: s.statClaimedLabel || "Claimed",

    showTagline: s.showTagline,
    tagline: config.brand.tagline || "",
    showFooter: s.showFooter,
    footerLinks: s.footerLinks.filter((l: { label: string; href: string }) => l.label && l.href),

    logoUrl: imageOverrides.logoUrl || s.logoUrl || undefined,
    showBrandNameWithLogo: s.showBrandNameWithLogo,

    ctaArrangement: s.preview?.ctaArrangement || undefined,
    countdownEmphasis: s.preview?.countdownEmphasis || undefined,
    statsSize: s.preview?.statsSize || undefined,

    heroBannerStatsPlacement: s.preview?.heroBannerStatsPlacement || undefined,

    centeredContentWidth: s.preview?.centeredContentWidth || undefined,
    centeredDensity: s.preview?.centeredDensity || undefined,
    centeredAnnouncementStyle: s.preview?.centeredAnnouncementStyle || undefined,

    rpcUrl: config.network.rpcUrl,
    airdropAddress: config.campaign.airdropAddress,
    mintAddress: config.campaign.mintAddress,
    claimMode: config.campaign.claimMode,
    networkCluster: config.network.cluster,
    tokenSymbol: a.tokenSymbol || "",
    tokenName: a.tokenName || "",
  }

  // workspace.studio.customColors always reflects the resolved theme colors
  // (updated by studio when switching presets or editing custom colors)
  const colors = s.customColors

  // Remove undefined values for clean JSON
  const clean = JSON.parse(JSON.stringify(layoutConfig))

  const content = [
    `import type { LayoutConfig, LayoutColors } from "./layouts/slots"`,
    ``,
    `export const layoutConfig: LayoutConfig = ${JSON.stringify(clean, null, 2)}`,
    ``,
    `export const layoutColors: LayoutColors = ${JSON.stringify(colors, null, 2)}`,
    ``,
  ].join("\n")

  await writeFile(path.join(targetDir, "src", "layout-config.ts"), content, "utf8")
}

// --- App file generation (layout-aware) ---

type StudioLayoutPreset = string | null

const layoutMap: Record<string, { importPath: string; componentName: string }> = {
  "centered": { importPath: "./layouts/centered", componentName: "CenteredLayout" },
  "two-column": { importPath: "./layouts/two-column", componentName: "TwoColumnLayout" },
  "hero-banner": { importPath: "./layouts/hero-banner", componentName: "HeroBannerLayout" },
  "step-card": { importPath: "./layouts/step-card", componentName: "StepCardLayout" },
}

async function generateAppFile(targetDir: string, layoutPreset: StudioLayoutPreset): Promise<void> {
  const layout = layoutMap[layoutPreset ?? ""] ?? layoutMap["centered"]
  if (layoutPreset && !layoutMap[layoutPreset]) {
    process.stdout.write(`[generate] Unknown layout preset '${layoutPreset}', falling back to centered\n`)
  }

  const content = `import { Component, useEffect, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { theme, fonts } from "./theme"
import { layoutConfig, layoutColors } from "./layout-config"
import { walletSlots } from "./layouts/wallet-slots"
import { ${layout.componentName} } from "${layout.importPath}"
import { CampaignWalletProvider } from "./components/wallet/wallet-provider"
import { useAirdrop } from "./hooks/use-airdrop"
import { AirdropContext } from "./hooks/use-airdrop-context"
import { Toaster } from "./components/ui/toaster"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  },
})

const themeVarsCss = Object.entries({
  "--campaign-primary": theme.primary,
  "--campaign-primary-foreground": theme.primaryForeground,
  "--campaign-secondary": theme.secondary,
  "--campaign-background": theme.background,
  "--campaign-foreground": theme.foreground,
  "--campaign-card": theme.card,
  "--campaign-card-foreground": theme.cardForeground,
  "--campaign-muted": theme.muted,
  "--campaign-muted-foreground": theme.mutedForeground,
  "--campaign-border": theme.border,
  "--campaign-input": theme.input,
  "--campaign-input-hover": theme.inputHover,
  "--campaign-ring": theme.ring,
  "--campaign-radius": theme.radius,
  "--campaign-radius-sm": theme.radiusSm,
  "--campaign-radius-md": theme.radiusMd,
  "--campaign-radius-lg": theme.radiusLg,
  "--campaign-radius-xl": theme.radiusXl,
  "color-scheme": theme.colorScheme,
  "--campaign-font-body": fonts.body,
  "--campaign-font-heading": fonts.heading,
})
  .map(([k, v]) => \`\${k}:\${v}\`)
  .join(";")

function CampaignApp() {
  const airdrop = useAirdrop({
    airdropAddress: layoutConfig.airdropAddress,
    mintAddress: layoutConfig.mintAddress,
    claimMode: layoutConfig.claimMode,
    networkCluster: layoutConfig.networkCluster,
  })

  return (
    <AirdropContext.Provider value={airdrop}>
      <div
        style={{
          backgroundColor: theme.background,
          color: theme.foreground,
          minHeight: "100dvh",
        }}
      >
        <${layout.componentName}
          config={layoutConfig}
          colors={layoutColors}
          slots={walletSlots}
        />
      </div>
    </AirdropContext.Provider>
  )
}

export function App() {
  useEffect(() => {
    if (!fonts.googleImport) return
    const id = "campaign-google-fonts"
    if (document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    const families = fonts.googleImport.split("|").map((f: string) => \`family=\${f}\`).join("&")
    link.href = \`https://fonts.googleapis.com/css2?\${families}&display=swap\`
    document.head.appendChild(link)
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CampaignWalletProvider endpoint={import.meta.env.VITE_RPC_URL || layoutConfig.rpcUrl}>
          <style>{\`:root{\${themeVarsCss}}\`}</style>
          <CampaignApp />
          <Toaster />
        </CampaignWalletProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: theme.background, color: theme.foreground, padding: "2rem", textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Something went wrong</h1>
            <p style={{ opacity: 0.6 }}>Please refresh the page and try again.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
`

  await writeFile(path.join(targetDir, "src", "App.tsx"), content, "utf8")
}

// --- index.html generation ---

async function generateIndexHtml(
  targetDir: string,
  config: import("../config/schema.js").CampaignConfig,
  workspace: import("../workspace/files.js").WorkspaceBundle["workspace"],
  imageOverrides: ImageOverrides,
): Promise<void> {
  const brandName = config.brand.name || "Airdrop"
  const tokenName = workspace.airdrop.tokenName || ""
  const heroBody = config.content?.heroBody || ""
  const description = heroBody
    ? heroBody.slice(0, 160)
    : tokenName
      ? `${tokenName} Airdrop on Solana`
      : `${brandName} Token Airdrop on Solana`

  const ws = workspace.studio
  const bgColor = ws.customColors?.background || "#000000"
  const fontPresetId = ws.fontPreset ?? "geometric"
  const font = fontPresets[fontPresetId] ?? fontPresets.geometric
  const usesGoogleFonts = font.googleImport !== null

  // Favicon: symbol > logo > none
  const faviconPath = imageOverrides.symbolUrl || imageOverrides.logoUrl || null
  const faviconExt = faviconPath ? path.extname(faviconPath).slice(1) : null
  const faviconType = faviconExt === "svg" ? "image/svg+xml"
    : faviconExt === "png" ? "image/png"
    : faviconExt === "jpg" || faviconExt === "jpeg" ? "image/jpeg"
    : faviconExt === "webp" ? "image/webp"
    : null

  const metaTags: string[] = [
    `<meta charset="UTF-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    `<title>${escapeHtml(brandName)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="theme-color" content="${escapeHtml(bgColor)}" />`,
    ``,
    `<!-- Open Graph -->`,
    `<meta property="og:title" content="${escapeHtml(brandName)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(brandName)}" />`,
    `<meta property="og:url" content="%VITE_SITE_URL%" />`,
    ``,
    `<!-- Twitter Card -->`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(brandName)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    ``,
    `<link rel="canonical" href="%VITE_SITE_URL%" />`,
  ]

  if (faviconPath && faviconType) {
    metaTags.push(`<link rel="icon" type="${faviconType}" href="${faviconPath}" />`)
  }

  if (usesGoogleFonts) {
    metaTags.push(`<link rel="preconnect" href="https://fonts.googleapis.com" />`)
    metaTags.push(`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`)
  }

  const head = metaTags.map((line) => line ? `    ${line}` : "").join("\n")

  const content = `<!doctype html>
<html lang="en">
  <head>
${head}
  </head>
  <body>
    <div id="root"></div>
    <noscript>This page requires JavaScript to run.</noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

  await writeFile(path.join(targetDir, "index.html"), content, "utf8")
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// --- robots.txt generation ---

async function generateRobotsTxt(targetDir: string): Promise<void> {
  const content = `User-agent: *\nAllow: /\n`
  await writeFile(path.join(targetDir, "robots.txt"), content, "utf8")
}

// --- .env generation ---

async function generateEnvFile(
  targetDir: string,
  config: import("../config/schema.js").CampaignConfig,
): Promise<void> {
  const content = [
    `VITE_RPC_URL=${config.network.rpcUrl}`,
    `VITE_SITE_URL=`,
    ``,
  ].join("\n")
  await writeFile(path.join(targetDir, ".env"), content, "utf8")
}

