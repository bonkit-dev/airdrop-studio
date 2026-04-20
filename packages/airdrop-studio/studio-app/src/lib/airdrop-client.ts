"use client"

import { AirdropStudioClient, type AirdropStudioNetwork } from "@bonkit/airdrop-sdk"
import type { Commitment, Connection } from "@solana/web3.js"

type ConnectionLike = {
  rpcEndpoint?: string
  commitment?: Commitment
}

let cachedClient: AirdropStudioClient | null = null
let cachedKey: string | null = null
let cachedInit: Promise<AirdropStudioClient> | null = null

export function getAirdropStudioClientCacheKey(connection: ConnectionLike, network: AirdropStudioNetwork) {
  const endpoint = connection.rpcEndpoint ?? ""
  const commitment = connection.commitment ?? "confirmed"
  return `${network}:${endpoint}:${commitment}`
}

export async function initAirdropStudioClient(
  connection: Connection,
  network: AirdropStudioNetwork,
): Promise<AirdropStudioClient> {
  const key = getAirdropStudioClientCacheKey(connection, network)
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
    defaultCommitment: connection.commitment ?? "confirmed",
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
