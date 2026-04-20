import type { Connection } from "@solana/web3.js"

import type { OnchainAppendBatchDraft, OnchainAppendChunk } from "./airdrop-batch-types"

export type ReconcileOutcome = {
  draft: OnchainAppendBatchDraft
  changed: boolean
  summary: {
    confirmed: number
    failed: number
    dropped: number
    stillPending: number
  }
}

export async function reconcileBatchDraft(
  draft: OnchainAppendBatchDraft,
  connection: Connection,
): Promise<ReconcileOutcome> {
  const targets = draft.chunks
    .map((chunk, idx) => ({ chunk, idx }))
    .filter(({ chunk }) => chunk.status === "in_progress" && typeof chunk.signature === "string")

  if (targets.length === 0) {
    return {
      draft,
      changed: false,
      summary: { confirmed: 0, failed: 0, dropped: 0, stillPending: 0 },
    }
  }

  const signatures = targets.map(({ chunk }) => chunk.signature!)
  let statuses: Awaited<ReturnType<Connection["getSignatureStatuses"]>>
  try {
    statuses = await connection.getSignatureStatuses(signatures, { searchTransactionHistory: true })
  } catch {
    // RPC unreachable or rate-limited — keep state as-is; user can retry.
    return {
      draft,
      changed: false,
      summary: { confirmed: 0, failed: 0, dropped: 0, stillPending: targets.length },
    }
  }

  let confirmed = 0
  let failed = 0
  let dropped = 0
  let stillPending = 0
  let changed = false

  const nextChunks: OnchainAppendChunk[] = [...draft.chunks]
  targets.forEach(({ chunk, idx }, i) => {
    const status = statuses.value[i]
    if (!status) {
      nextChunks[idx] = {
        ...chunk,
        status: "pending",
        signature: null,
        errorMessage: "Transaction not found on-chain after reload. Retry.",
      }
      dropped++
      changed = true
      return
    }
    if (status.err) {
      nextChunks[idx] = {
        ...chunk,
        status: "failed",
        errorMessage: typeof status.err === "string" ? status.err : JSON.stringify(status.err),
      }
      failed++
      changed = true
      return
    }
    if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
      nextChunks[idx] = { ...chunk, status: "success", errorMessage: null }
      confirmed++
      changed = true
      return
    }
    // "processed" or null confirmationStatus — still in flight
    stillPending++
  })

  return {
    draft: changed ? { ...draft, chunks: nextChunks, updatedAt: Date.now() } : draft,
    changed,
    summary: { confirmed, failed, dropped, stillPending },
  }
}
