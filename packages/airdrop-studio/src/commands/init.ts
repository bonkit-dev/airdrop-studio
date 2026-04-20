import { initWorkspace } from "../generators/project.js"
import type { CampaignAnswers } from "../types.js"

export async function runInit(targetPath: string): Promise<string> {
  const answers = defaultBootstrapAnswers(targetPath)
  const targetDir = await initWorkspace(answers)
  process.stdout.write(`Workspace created at ${targetDir}\n`)
  return targetDir
}

function defaultBootstrapAnswers(targetPath: string): CampaignAnswers {
  return {
    projectName: targetPath,
    template: "default",
    brandName: "",
    network: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
    claimMode: "onchain",
    airdropAddress: "",
    mintAddress: "",
    browser: false,
    skipInstall: true,
  }
}
