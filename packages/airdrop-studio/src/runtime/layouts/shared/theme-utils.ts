import type { LayoutColors } from "../slots"

export function contrastTextColor(hex: string): string {
  const raw = hex.replace("#", "")
  if (raw.length < 6) return "#FFFFFF"
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return lum > 0.4 ? "#000000" : "#FFFFFF"
}

export function lightenHex(hex: string, amount: number): string {
  const raw = hex.replace("#", "")
  if (raw.length < 6) return hex
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  const lr = Math.round(r + (255 - r) * amount)
  const lg = Math.round(g + (255 - g) * amount)
  const lb = Math.round(b + (255 - b) * amount)
  const toHex = (n: number) => n.toString(16).padStart(2, "0")
  return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`
}

export function isLightHex(hex: string): boolean {
  const raw = hex.replace("#", "")
  if (raw.length < 6) return false
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b) > 0.4
}

function saturationDim(hex: string): number {
  const raw = hex.replace("#", "")
  if (raw.length < 6) return 1
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturation = max === 0 ? 0 : (max - min) / max
  return 1 - saturation * 0.55
}

/**
 * CSS variable overrides for glass panel context.
 * Makes card/border/input semi-transparent so children (allocation, shimmer, etc.)
 * blend naturally with the frosted glass instead of rendering opaque boxes.
 */
export function getGlassPanelStyle(blurValue?: number, customColor?: string, opacityValue?: number): React.CSSProperties {
  const blurPx = ((blurValue ?? 50) / 100) * 24
  const opacityPct = opacityValue ?? 50
  const alpha = Math.round((opacityPct / 100) * 255).toString(16).padStart(2, "0")
  const backgroundColor = customColor
    ? `${customColor}${alpha}`
    : `color-mix(in srgb, var(--campaign-background) ${opacityPct}%, transparent)`
  return {
    backdropFilter: `blur(${blurPx}px)`,
    WebkitBackdropFilter: `blur(${blurPx}px)`,
    backgroundColor,
    ...getGlassPanelVars(),
  }
}

function getGlassPanelVars(): Record<string, string> {
  return {
    "--campaign-card": "color-mix(in oklab, var(--campaign-foreground) 10%, transparent)",
    "--campaign-border": "color-mix(in oklab, var(--campaign-foreground) 15%, transparent)",
    "--campaign-input": "color-mix(in oklab, var(--campaign-foreground) 8%, transparent)",
    "--campaign-input-hover": "color-mix(in oklab, var(--campaign-foreground) 14%, transparent)",
    // Shimmer: brighter base so the primary sweep is clearly visible on glass
    "--campaign-shimmer-base": "color-mix(in oklab, var(--campaign-foreground) 30%, transparent)",
    // Glow: much stronger on glass to cut through the backdrop
    "--campaign-glow-lo": "color-mix(in srgb, var(--campaign-primary) 70%, transparent)",
    "--campaign-glow-hi": "color-mix(in srgb, var(--campaign-primary) 90%, transparent)",
  }
}

export function getPrimaryCtaStyle(primary: string): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${lightenHex(primary, 0.1)} 0%, ${primary} 100%)`,
    color: contrastTextColor(primary),
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 28px ${primary}40, 0 2px 6px ${primary}30`,
  }
}

export function getHeroFallbackLayers(colors: LayoutColors, gradientPrimary?: string, gradientAccent?: string) {
  const gp = gradientPrimary || colors.primary
  const ga = gradientAccent || colors.accent
  const isLight = isLightHex(colors.background)

  const baseGradient = isLight
    ? `linear-gradient(160deg, color-mix(in srgb, ${gp} 6%, ${colors.background}) 0%, ${colors.surface} 38%, color-mix(in srgb, ${ga} 5%, ${colors.background}) 100%)`
    : `linear-gradient(160deg, ${colors.background} 0%, ${colors.surface} 58%, rgba(255,255,255,0.02) 100%)`

  const pDim = isLight ? saturationDim(gp) : 1
  const aDim = isLight ? saturationDim(ga) : 1
  const sDim = isLight ? saturationDim(colors.secondary) : 1
  const fade = isLight ? 88 : 72

  return { baseGradient, gp, ga, pDim, aDim, sDim, fade, isLight, secondary: colors.secondary }
}
