import type { OnchainAppendBatchDraft } from "./airdrop-batch-types"

// --- Batch ID ---

export function createBatchId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// --- Normalization ---

function normalizeBatchDraft(draft: OnchainAppendBatchDraft): OnchainAppendBatchDraft {
  const chunks = draft.chunks.map((chunk) => {
    if (chunk.status !== "in_progress") return chunk
    // Has signature → keep as in_progress so reconciliation can query on-chain status.
    if (chunk.signature) return chunk
    // No signature → interrupted before wallet approval completed. Safe to retry.
    return { ...chunk, status: "pending" as const, errorMessage: null }
  })
  return { ...draft, chunks, updatedAt: Date.now() }
}

function isSameScope(draft: OnchainAppendBatchDraft, walletAddress: string, airdropAddress: string): boolean {
  return (
    draft.version === 1 &&
    draft.walletAddress === walletAddress &&
    draft.airdropAddress === airdropAddress
  )
}

// --- Active batch draft (.bonkit/onchain-batch-draft.json, one per workspace) ---

export async function saveBatchDraft(
  _walletAddress: string,
  _airdropAddress: string,
  draft: OnchainAppendBatchDraft,
): Promise<void> {
  try {
    await fetch("/api/batch-draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ draft }),
    })
  } catch {
    // network failure — state will re-save on next write
  }
}

export async function loadBatchDraft(
  walletAddress: string,
  airdropAddress: string,
): Promise<OnchainAppendBatchDraft | null> {
  try {
    const response = await fetch("/api/batch-draft")
    if (!response.ok) return null
    const body = (await response.json()) as { draft: OnchainAppendBatchDraft | null }
    if (!body.draft || !isSameScope(body.draft, walletAddress, airdropAddress)) return null
    return normalizeBatchDraft(body.draft)
  } catch {
    return null
  }
}

export async function clearBatchDraft(_walletAddress: string, _airdropAddress: string): Promise<void> {
  try {
    await fetch("/api/batch-draft", { method: "DELETE" })
  } catch {
    // ignore
  }
}

// --- Completed batch history (.bonkit/onchain-batch-history.json, append) ---

export async function saveCompletedBatch(
  _walletAddress: string,
  _airdropAddress: string,
  batch: OnchainAppendBatchDraft,
): Promise<void> {
  try {
    await fetch("/api/batch-history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ batch }),
    })
  } catch {
    // ignore
  }
}

export async function loadCompletedBatches(
  walletAddress: string,
  airdropAddress: string,
): Promise<OnchainAppendBatchDraft[]> {
  try {
    const response = await fetch("/api/batch-history")
    if (!response.ok) return []
    const body = (await response.json()) as { batches: OnchainAppendBatchDraft[] }
    return body.batches.filter((b) => isSameScope(b, walletAddress, airdropAddress))
  } catch {
    return []
  }
}

export async function clearCompletedBatches(
  _walletAddress: string,
  _airdropAddress: string,
): Promise<void> {
  try {
    await fetch("/api/batch-history", { method: "DELETE" })
  } catch {
    // ignore
  }
}
