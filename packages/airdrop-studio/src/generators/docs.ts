import type { CampaignAnswers } from "../types.js"

export function createDocVariables(answers: CampaignAnswers): Record<string, string> {
  return {
    brandName: answers.brandName,
    projectName: answers.projectName,
    network: answers.network,
    claimMode: answers.claimMode,
  }
}
