import type { CampaignConfig } from "../config/schema.js";
import { isLightBg } from "./derive.js";

export type ThemeTokens = {
  primary: string;
  primaryForeground: string;
  secondary: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  inputHover: string;
  ring: string;
  radius: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  colorScheme: "light" | "dark";
};

function deriveRadiusScale(radius: string) {
  const parsed = Number.parseFloat(radius.replace("px", ""));
  const base = Number.isFinite(parsed) ? parsed : 20;
  if (base <= 0) {
    return {
      radius: "0px",
      radiusSm: "0px",
      radiusMd: "0px",
      radiusLg: "0px",
      radiusXl: "0px"
    };
  }
  return {
    radius: `${base}px`,
    radiusSm: `${Math.max(0, base - 8)}px`,
    radiusMd: `${Math.max(0, base - 4)}px`,
    radiusLg: `${base}px`,
    radiusXl: `${base + 8}px`
  };
}

const darkDefaults = {
  foreground: "#F5F7FF",
  primaryForeground: "#081018",
  card: "#151A2A",
  cardForeground: "#F5F7FF",
  muted: "#1B2234",
  mutedForeground: "rgba(245, 247, 255, 0.72)",
  border: "rgba(245, 247, 255, 0.12)",
  input: "rgba(245, 247, 255, 0.08)",
  inputHover: "rgba(255, 255, 255, 0.10)",
  ring: "rgba(245, 247, 255, 0.32)",
};

const lightDefaults = {
  foreground: "#0F172A",
  primaryForeground: "#FFFFFF",
  card: "#FFFFFF",
  cardForeground: "#0F172A",
  muted: "#F1F5F9",
  mutedForeground: "rgba(15, 23, 42, 0.60)",
  border: "rgba(15, 23, 42, 0.12)",
  input: "rgba(15, 23, 42, 0.08)",
  inputHover: "rgba(15, 23, 42, 0.08)",
  ring: "rgba(15, 23, 42, 0.20)",
};

export function getThemeTokens(config: CampaignConfig): ThemeTokens {
  const radii = deriveRadiusScale(config.ui?.radius ?? "20px");
  const bg = config.brand.colors.background ?? "#0F1320";
  const isLight = isLightBg(bg);
  const defaults = isLight ? lightDefaults : darkDefaults;

  return {
    primary: config.brand.colors.primary,
    primaryForeground: config.ui?.colors?.primaryForeground ?? defaults.primaryForeground,
    secondary: config.brand.colors.secondary ?? "#C8D0FF",
    background: bg,
    foreground: config.brand.colors.foreground ?? defaults.foreground,
    card: config.ui?.colors?.card ?? defaults.card,
    cardForeground: config.ui?.colors?.cardForeground ?? defaults.cardForeground,
    muted: config.ui?.colors?.muted ?? defaults.muted,
    mutedForeground: config.ui?.colors?.mutedForeground ?? defaults.mutedForeground,
    border: config.ui?.colors?.border ?? defaults.border,
    input: config.ui?.colors?.input ?? defaults.input,
    inputHover: defaults.inputHover,
    ring: config.ui?.colors?.ring ?? defaults.ring,
    radius: radii.radius,
    radiusSm: radii.radiusSm,
    radiusMd: radii.radiusMd,
    radiusLg: radii.radiusLg,
    radiusXl: radii.radiusXl,
    colorScheme: isLight ? "light" : "dark"
  };
}
