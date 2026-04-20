import { loadCampaignConfig } from "../config/load.js"
import type { CampaignAnswers } from "../types.js"
import { toPackageName } from "../utils/naming.js"

export function buildCampaignConfig(answers: CampaignAnswers) {
  return loadCampaignConfig({
    brand: {
      name: answers.brandName,
      colors: {
        primary: "#78F5B8",
        secondary: "#C8D0FF",
        background: "#0F1320",
        foreground: "#F5F7FF",
      },
    },
    network: {
      cluster: answers.network,
      rpcUrl: answers.rpcUrl,
    },
    campaign: {
      type: "airdrop",
      claimMode: answers.claimMode,
      airdropAddress: answers.airdropAddress,
      mintAddress: answers.mintAddress,
    },
    ui: {
      layout: {
        preset: "default",
      },
      colors: {
        primaryForeground: "#081018",
        card: "#151A2A",
        cardForeground: "#F5F7FF",
        muted: "#1B2234",
        mutedForeground: "rgba(245, 247, 255, 0.72)",
        border: "rgba(245, 247, 255, 0.12)",
        input: "rgba(245, 247, 255, 0.08)",
        ring: "rgba(245, 247, 255, 0.32)",
      },
    },
    content: {},
    links: {},
  })
}

export function createTemplateVariables(answers: CampaignAnswers): Record<string, string> {
  const packageName = toPackageName(answers.projectName)
  const config = buildCampaignConfig(answers)

  return {
    projectName: answers.projectName,
    packageName,
    brandName: answers.brandName,
    network: answers.network,
    rpcUrl: answers.rpcUrl,
    claimMode: answers.claimMode,
    airdropAddress: answers.airdropAddress,
    mintAddress: answers.mintAddress,
    campaignConfigJson: JSON.stringify(config, null, 2),
  }
}
