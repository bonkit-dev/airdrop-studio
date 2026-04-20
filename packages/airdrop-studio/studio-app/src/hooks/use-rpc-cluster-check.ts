import { useEffect, useState } from "react"

import {
  EXPECTED_GENESIS_HASH_PREFIX,
  fetchGenesisHash,
  resolveClusterFromGenesisHash,
  type DetectedCluster,
  type NetworkCluster,
} from "../lib/rpc-endpoints"

export type RpcClusterCheckState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok" }
  | { status: "mismatch"; detected: DetectedCluster }
  | { status: "error"; message: string }

const DEBOUNCE_MS = 600
const REQUEST_TIMEOUT_MS = 7_000

export function useRpcClusterCheck(network: NetworkCluster, rpcUrl: string): RpcClusterCheckState {
  const [state, setState] = useState<RpcClusterCheckState>({ status: "idle" })

  useEffect(() => {
    const trimmed = rpcUrl.trim()
    if (!trimmed) {
      setState({ status: "idle" })
      return
    }

    let parsed: URL
    try {
      parsed = new URL(trimmed)
    } catch {
      setState({ status: "error", message: "Invalid URL" })
      return
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      setState({ status: "error", message: "RPC URL must use http or https" })
      return
    }

    const abort = new AbortController()
    const requestTimeoutId = setTimeout(() => abort.abort(), DEBOUNCE_MS + REQUEST_TIMEOUT_MS)

    const debounceId = setTimeout(() => {
      setState({ status: "loading" })
      void (async () => {
        try {
          const hash = await fetchGenesisHash(parsed.toString(), abort.signal)
          if (abort.signal.aborted) return
          const expectedPrefix = EXPECTED_GENESIS_HASH_PREFIX[network]
          if (hash.startsWith(expectedPrefix)) {
            setState({ status: "ok" })
          } else {
            setState({ status: "mismatch", detected: resolveClusterFromGenesisHash(hash) })
          }
        } catch (error) {
          if (abort.signal.aborted) return
          const message = error instanceof Error ? error.message : "Unable to validate RPC endpoint"
          setState({ status: "error", message })
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(debounceId)
      clearTimeout(requestTimeoutId)
      abort.abort()
    }
  }, [network, rpcUrl])

  return state
}
