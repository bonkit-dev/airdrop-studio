import type { CampaignConfig } from "./schema.js";

const defaultColors = {
  secondary: "#C8D0FF",
  background: "#0F1320",
  foreground: "#F5F7FF"
};

const defaultUiColors = {
  primaryForeground: "#081018",
  card: "#151A2A",
  cardForeground: "#F5F7FF",
  muted: "#1B2234",
  mutedForeground: "rgba(245, 247, 255, 0.72)",
  border: "rgba(245, 247, 255, 0.12)",
  input: "rgba(245, 247, 255, 0.08)",
  ring: "rgba(245, 247, 255, 0.32)",
  announcement: "#00D9FF"
};

// Content defaults (heroTitle, heroBody, claimButtonLabel, etc.) are NOT applied here.
// The studio is the single writer for content; the runtime app falls back to placeholder
// strings at render time when a field is empty. This keeps "user explicitly set vs default"
// distinguishable without sentinel detection.
export function applyCampaignDefaults(config: CampaignConfig): CampaignConfig {
  return {
    ...config,
    brand: {
      ...config.brand,
      colors: {
        ...defaultColors,
        ...config.brand.colors
      }
    },
    ui: {
      ...config.ui,
      radius: config.ui?.radius ?? "12px",
      layout: {
        preset: "default",
        ...config.ui?.layout
      },
      colors: {
        ...defaultUiColors,
        ...config.ui?.colors
      }
    },
    content: config.content ?? {}
  };
}
