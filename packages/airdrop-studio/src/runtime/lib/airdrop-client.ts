import { AirdropStudioClient } from "@bonkit/airdrop-sdk"
import type { Connection, Commitment } from "@solana/web3.js"

let cachedClient: AirdropStudioClient | null = null
let cachedKey: string | null = null
let cachedInit: Promise<AirdropStudioClient> | null = null

function getCacheKey(connection: Connection): string {
  const endpoint = connection.rpcEndpoint ?? ""
  const commitment = connection.commitment ?? "confirmed"
  return `production:${endpoint}:${commitment}`
}

export async function initAirdropClient(
  connection: Connection,
  network: "devnet" | "mainnet-beta",
): Promise<AirdropStudioClient> {
  const key = getCacheKey(connection)

  if (cachedClient && cachedKey === key) {
    return cachedClient
  }
  if (cachedInit && cachedKey === key) {
    return await cachedInit
  }

  cachedKey = key
  cachedInit = AirdropStudioClient.init({
    connection,
    network,
    deployment: "production",
    defaultCommitment: (connection.commitment as Commitment) ?? "confirmed",
  })

  try {
    cachedClient = await cachedInit
    return cachedClient
  } catch (error) {
    cachedClient = null
    cachedInit = null
    throw error
  }
}
