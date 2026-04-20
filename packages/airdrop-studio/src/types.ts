import type { ClaimMode, SolanaCluster } from "./config/schema.js"

export type CampaignAnswers = {
  projectName: string
  template: string
  brandName: string
  network: SolanaCluster
  rpcUrl: string
  claimMode: ClaimMode
  airdropAddress: string
  mintAddress: string
  browser: boolean
  skipInstall: boolean
}

