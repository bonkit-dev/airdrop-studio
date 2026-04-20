export type NetworkCluster = "mainnet-beta" | "devnet"

export const DEFAULT_RPC_BY_NETWORK: Record<NetworkCluster, string> = {
  "mainnet-beta": "https://api.mainnet.solana.com",
  devnet: "https://api.devnet.solana.com",
}

export const EXPECTED_GENESIS_HASH_PREFIX: Record<NetworkCluster, string> = {
  "mainnet-beta": "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  devnet: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
}

const TESTNET_GENESIS_HASH_PREFIX = "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z"

export type DetectedCluster = NetworkCluster | "testnet" | "unknown"

const KNOWN_CLUSTER_BY_GENESIS_PREFIX: Array<{ cluster: DetectedCluster; prefix: string }> = [
  { cluster: "mainnet-beta", prefix: EXPECTED_GENESIS_HASH_PREFIX["mainnet-beta"] },
  { cluster: "devnet", prefix: EXPECTED_GENESIS_HASH_PREFIX.devnet },
  { cluster: "testnet", prefix: TESTNET_GENESIS_HASH_PREFIX },
]

export function resolveClusterFromGenesisHash(genesisHash: string): DetectedCluster {
  for (const candidate of KNOWN_CLUSTER_BY_GENESIS_PREFIX) {
    if (genesisHash.startsWith(candidate.prefix)) {
      return candidate.cluster
    }
  }
  return "unknown"
}

export async function fetchGenesisHash(endpoint: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getGenesisHash",
      params: [],
    }),
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    throw new Error(`RPC responded with status ${response.status}`)
  }

  const payload = (await response.json().catch(() => null)) as unknown
  const genesisHash =
    payload && typeof payload === "object" && "result" in payload && typeof payload.result === "string"
      ? payload.result
      : null
  if (!genesisHash) {
    throw new Error("Missing genesis hash in RPC response")
  }

  return genesisHash
}

export function describeDetectedCluster(detected: DetectedCluster): string {
  if (detected === "unknown") return "an unknown cluster"
  if (detected === "testnet") return "testnet"
  if (detected === "mainnet-beta") return "mainnet"
  return "devnet"
}
