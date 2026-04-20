"use client"

import type { SendTransactionOptions } from "@solana/wallet-adapter-base"
import type {
  Commitment,
  Connection,
  RpcResponseAndContext,
  SignatureResult,
  SimulateTransactionConfig,
  SimulatedTransactionResponse,
  VersionedTransaction,
} from "@solana/web3.js"
import {
  isSimulatedTransactionErrorResponse,
  normalizeProgramError,
  type NormalizedProgramError,
} from "@bonkit/airdrop-sdk"

type SimulationErrorResult = {
  status: "simulation-error"
  error: NormalizedProgramError
  response: SimulatedTransactionResponse
}

type TransactionSuccessResult = {
  status: "success"
  signature: string
  confirmation: RpcResponseAndContext<SignatureResult>
  response: SimulatedTransactionResponse
}

export type SimulateAndSendResult = SimulationErrorResult | TransactionSuccessResult

export async function simulateAndSendAirdropTransaction({
  connection,
  transaction,
  sendTransaction,
  commitment = "confirmed",
  onBeforeSend,
  onSignature,
}: {
  connection: Connection
  transaction: VersionedTransaction
  sendTransaction: (
    transaction: VersionedTransaction,
    connection: Connection,
    options?: SendTransactionOptions,
  ) => Promise<string>
  commitment?: Commitment
  onBeforeSend?: () => void
  onSignature?: (signature: string) => void
}): Promise<SimulateAndSendResult> {
  // sigVerify: false — simulation runs before the transaction is signed.
  // Extension mode fills signatures inside sendTransaction; keypair mode signs on the server
  // after simulation. Either way, the tx is unsigned at simulate time.
  const baseSimulateConfig: SimulateTransactionConfig = { commitment, sigVerify: false }
  let minContextSlot: number | null = null
  let latestBlockhash: Awaited<ReturnType<Connection["getLatestBlockhash"]>> | null = null
  let simulation = await connection.simulateTransaction(transaction, baseSimulateConfig)

  if (isBlockhashNotFoundError(simulation.value.err)) {
    const latestBlockhashContext = await connection.getLatestBlockhashAndContext({ commitment })
    latestBlockhash = latestBlockhashContext.value
    minContextSlot = latestBlockhashContext.context.slot
    transaction.message.recentBlockhash = latestBlockhash.blockhash
    simulation = await connection.simulateTransaction(transaction, {
      ...baseSimulateConfig,
      minContextSlot,
    })
  }

  if (simulation.value.err && isSimulatedTransactionErrorResponse(simulation.value)) {
    return {
      status: "simulation-error",
      error: normalizeProgramError(simulation.value),
      response: simulation.value,
    }
  }

  onBeforeSend?.()
  const signature = await sendTransaction(transaction, connection, {
    preflightCommitment: commitment,
    minContextSlot: minContextSlot ?? undefined,
  })
  onSignature?.(signature)

  const confirmation =
    latestBlockhash !== null
      ? await connection.confirmTransaction(
          {
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature,
          },
          commitment,
        )
      : await connection.confirmTransaction(signature, commitment)

  return {
    status: "success",
    signature,
    confirmation,
    response: simulation.value,
  }
}

export function getProgramErrorMessage(error: NormalizedProgramError) {
  if (error.definition?.msg) return error.definition.msg
  return error.source === "anchor" ? error.anchorError.message : error.error.message
}

function isBlockhashNotFoundError(error: SimulatedTransactionResponse["err"]) {
  if (!error) return false
  if (typeof error === "string") {
    const normalized = error.toLowerCase()
    return normalized.includes("blockhashnotfound") || normalized.includes("blockhash not found")
  }
  try {
    const normalized = JSON.stringify(error).toLowerCase()
    return normalized.includes("blockhashnotfound") || normalized.includes("blockhash not found")
  } catch {
    return false
  }
}
