import { z } from "zod";

const clusterSchema = z.enum(["mainnet-beta", "devnet"]);
const claimModeSchema = z.enum(["onchain", "merkle"]);
const layoutPresetSchema = z.enum(["default", "centered", "immersive"]);
const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
const uiColorsSchema = z.object({
  primaryForeground: z.string().optional(),
  card: z.string().optional(),
  cardForeground: z.string().optional(),
  muted: z.string().optional(),
  mutedForeground: z.string().optional(),
  border: z.string().optional(),
  input: z.string().optional(),
  ring: z.string().optional(),
  announcement: z.string().optional()
});
const uiRadiusSchema = z.string().regex(/^\d+(\.\d+)?px$/, "ui.radius must be a pixel value like `20px`").optional();
const footerLinkCategorySchema = z.enum(["telegram", "x", "discord", "medium", "custom"]);
const footerLinkSchema = z.object({
  label: z.string().min(1, "links.custom[].label is required"),
  href: z
    .string()
    .min(1, "links.custom[].href is required")
    .refine(isHttpUrl, "links.custom[].href must start with http:// or https://"),
  category: footerLinkCategorySchema.optional(),
  iconOnly: z.boolean().optional()
});

export const campaignConfigSchema = z.object({
  brand: z.object({
    // brand.name, mintAddress, airdropAddress all default to empty string. The runtime app
    // detects empty values and renders placeholder UI ("Configure your campaign", disabled
    // claim button, etc.) so users can save incomplete state without sentinel hacks.
    name: z.string().default(""),
    tagline: z.string().optional(),
    logoUrl: z.string().optional(),
    colors: z.object({
      primary: z.string().min(1, "brand.colors.primary is required"),
      secondary: z.string().optional(),
      background: z.string().optional(),
      foreground: z.string().optional()
    })
  }),
  network: z.object({
    cluster: clusterSchema,
    rpcUrl: z.string().url("network.rpcUrl must be a valid URL")
  }),
  campaign: z.object({
    type: z.literal("airdrop"),
    claimMode: claimModeSchema,
    airdropAddress: z.string().default(""),
    mintAddress: z.string().default("")
  }),
  ui: z.object({
    layout: z.object({
      preset: layoutPresetSchema.optional()
    }).optional(),
    colors: uiColorsSchema.optional(),
    radius: uiRadiusSchema
  }).optional(),
  content: z.object({
    heroTitle: z.string().optional(),
    heroBody: z.string().optional(),
    claimButtonLabel: z.string().optional(),
    announcementText: z.string().optional(),
    countdownStartEyebrow: z.string().optional(),
    countdownEndEyebrow: z.string().optional(),
    countdownEndedLabel: z.string().optional(),
    statusBadgeStartLabel: z.string().optional(),
    statusBadgeLiveLabel: z.string().optional(),
    statusBadgeEndedLabel: z.string().optional(),
    countdownHoursLabel: z.string().optional(),
    countdownMinutesLabel: z.string().optional(),
    countdownSecondsLabel: z.string().optional(),
    statTotalClaimsLabel: z.string().optional(),
    statAllocatedLabel: z.string().optional(),
    statClaimedLabel: z.string().optional()
  }).optional(),
  links: z.object({
    custom: z.array(footerLinkSchema).optional()
  }).optional()
});

export type CampaignConfig = z.infer<typeof campaignConfigSchema>;
export type ClaimMode = z.infer<typeof claimModeSchema>;
export type SolanaCluster = z.infer<typeof clusterSchema>;
export type LayoutPreset = z.infer<typeof layoutPresetSchema>;
