import { applyCampaignDefaults } from "./defaults.js";
import { campaignConfigSchema, type CampaignConfig } from "./schema.js";

export function loadCampaignConfig(input: unknown): CampaignConfig {
  const result = campaignConfigSchema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid campaign.config.json\n${issues}`);
  }

  return applyCampaignDefaults(result.data);
}
