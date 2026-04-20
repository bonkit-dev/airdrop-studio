// --- Batch tracking types for on-chain recipient registration ---

export const RECIPIENTS_PER_APPEND = 16
export const ONCHAIN_MAX_RECIPIENTS = 10_000

export type OnchainAppendChunkStatus = "pending" | "in_progress" | "success" | "failed"

export interface OnchainAppendDraftRecipient {
  wallet: string
  amount: string
}

export interface OnchainAppendChunk {
  index: number
  status: OnchainAppendChunkStatus
  recipients: OnchainAppendDraftRecipient[]
  attempts: number
  signature: string | null
  errorMessage: string | null
}

export interface OnchainAppendBatchDraft {
  version: 1
  id: string
  walletAddress: string
  airdropAddress: string
  mintAddress: string | null
  tokenDecimals: number
  totalRecipients: number
  totalAmountRaw: string
  chunkSize: number
  createdAt: number
  updatedAt: number
  chunks: OnchainAppendChunk[]
}

export interface RecipientParseSummary {
  recipients: Array<{ address: string; amount: string }>
  totalCount: number
  invalidCount: number
  duplicateCount: number
  truncatedCount: number
  totalAmount: string
  errors: string[]
}
