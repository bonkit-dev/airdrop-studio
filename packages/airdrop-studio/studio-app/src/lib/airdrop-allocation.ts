import type { OnchainAppendBatchDraft } from "./airdrop-batch-types"
import {
  formatDecimalAmountWithGrouping,
  sumDecimalAmounts,
} from "./airdrop-utils"

function formatAllocationValue(value: string): string {
  return formatDecimalAmountWithGrouping(value)
}

function sumAmountStrings(items: ReadonlyArray<{ amount: string }>): string {
  return sumDecimalAmounts(items.map((item) => item.amount))
}

export function derivePendingAllocation(recipients: ReadonlyArray<{ amount: string }>): string {
  return formatAllocationValue(sumAmountStrings(recipients))
}

export function deriveRegisteredAllocation(batches: ReadonlyArray<OnchainAppendBatchDraft>): string {
  const amounts: string[] = []
  for (const batch of batches) {
    for (const chunk of batch.chunks) {
      if (chunk.status !== "success") continue
      for (const recipient of chunk.recipients) {
        amounts.push(recipient.amount)
      }
    }
  }
  return formatAllocationValue(sumDecimalAmounts(amounts))
}

export function deriveRegisteredRecipientCount(batches: ReadonlyArray<OnchainAppendBatchDraft>): number {
  let count = 0
  for (const batch of batches) {
    for (const chunk of batch.chunks) {
      if (chunk.status === "success") count += chunk.recipients.length
    }
  }
  return count
}

export function deriveRegisteredUniqueWalletCount(batches: ReadonlyArray<OnchainAppendBatchDraft>): number {
  const set = new Set<string>()
  for (const batch of batches) {
    for (const chunk of batch.chunks) {
      if (chunk.status !== "success") continue
      for (const r of chunk.recipients) set.add(r.wallet)
    }
  }
  return set.size
}

export function deriveTotalAllocationRaw(batches: ReadonlyArray<OnchainAppendBatchDraft>): string {
  const amounts: string[] = []
  for (const batch of batches) {
    for (const chunk of batch.chunks) {
      if (chunk.status !== "success") continue
      for (const recipient of chunk.recipients) {
        amounts.push(recipient.amount)
      }
    }
  }
  return sumDecimalAmounts(amounts)
}
