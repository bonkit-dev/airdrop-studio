import type { CampaignAnswers } from "../types.js"

export function createEnvVariables(answers: CampaignAnswers): Record<string, string> {
  return {
    exampleRpcUrl: answers.rpcUrl,
  }
}
