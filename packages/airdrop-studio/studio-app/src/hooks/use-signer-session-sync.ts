import { useEffect } from "react"

import { useStudioStore } from "../lib/studio-store"
import { fetchSignerStatus } from "../lib/signer-client"

const POLL_INTERVAL_MS = 20_000

export function useSignerSessionSync(): void {
  const setKeypairSession = useStudioStore((state) => state.setKeypairSession)

  useEffect(() => {
    let cancelled = false

    const sync = async () => {
      try {
        const status = await fetchSignerStatus()
        if (cancelled) return
        setKeypairSession({
          status: status.state,
          publicKey: status.publicKey ?? null,
          expiresAt: status.expiresAt ?? null,
          idleTimeoutMs: status.idleTimeoutMs,
        })
      } catch {
        // ignore; server may be transient
      }
    }

    void sync()
    const intervalId = window.setInterval(() => void sync(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [setKeypairSession])
}
