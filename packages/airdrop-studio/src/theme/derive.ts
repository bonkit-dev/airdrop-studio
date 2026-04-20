/**
 * Derives semantic theme tokens from brand colors + radius.
 * Single source of truth for both studio preview (PreviewContent) and
 * generator (generateThemeFile). Keep in sync with preview-canvas.tsx.
 */

export type DerivedTheme = {
  foreground: string
  mutedForeground: string
  border: string
  surfaceElevated: string
  tintSubtle: string
  tintStrong: string
  ring: string
  shadow: string
  primaryForeground: string
  card: string
  cardForeground: string
  muted: string
  radiusSm: string
  radiusMd: string
  radiusLg: string
  radiusXl: string
}

export type BrandColors = {
  primary: string
  secondary: string
  background: string
  surface: string
}

export function isLightBg(hex: string): boolean {
  const raw = hex.replace("#", "")
  if (raw.length < 6) return false
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b) > 0.4
}

export function mixHex(a: string, b: string, ratio: number): string {
  const parse = (hex: string) => {
    const raw = hex.replace("#", "")
    return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)]
  }
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0")
  return `#${toHex(ar + (br - ar) * ratio)}${toHex(ag + (bg - ag) * ratio)}${toHex(ab + (bb - ab) * ratio)}`
}

export function deriveSemanticTokens(colors: BrandColors, globalRadius: number): DerivedTheme {
  const isLight = isLightBg(colors.background)

  const fg = isLight ? "#0F172A" : "#F5F7FF"
  const fgMuted = isLight ? "rgba(15, 23, 42, 0.55)" : "rgba(245, 247, 255, 0.50)"
  const border = isLight ? "rgba(15, 23, 42, 0.12)" : "rgba(245, 247, 255, 0.10)"
  const surfaceElevated = isLight ? mixHex(colors.surface, "#FFFFFF", 0.5) : mixHex(colors.surface, "#FFFFFF", 0.04)
  const tintSubtle = isLight ? "rgba(15, 23, 42, 0.04)" : "rgba(255, 255, 255, 0.05)"
  const tintStrong = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.10)"
  const ring = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.10)"
  const shadow = isLight
    ? "0 1px 3px rgba(15,23,42,0.08), 0 8px 24px rgba(15,23,42,0.06)"
    : "0 1px 3px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.3)"
  const primaryFg = isLight ? "#FFFFFF" : "#081018"
  const muted = isLight ? mixHex(colors.surface, "#000000", 0.03) : mixHex(colors.surface, "#FFFFFF", 0.04)

  const r = globalRadius
  const radiusSm = `${r <= 0 ? 0 : Math.max(0, r - 8)}px`
  const radiusMd = `${r <= 0 ? 0 : Math.max(0, r - 4)}px`
  const radiusLg = `${r <= 0 ? 0 : r}px`
  const radiusXl = `${r <= 0 ? 0 : r + 8}px`

  return {
    foreground: fg,
    mutedForeground: fgMuted,
    border,
    surfaceElevated,
    tintSubtle,
    tintStrong,
    ring,
    shadow,
    primaryForeground: primaryFg,
    card: colors.surface,
    cardForeground: fg,
    muted,
    radiusSm,
    radiusMd,
    radiusLg,
    radiusXl,
  }
}
