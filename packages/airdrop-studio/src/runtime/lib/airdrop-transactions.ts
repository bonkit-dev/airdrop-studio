import type { SendTransactionOptions } from "@solana/wallet-adapter-base"
import type {
  Connection,
  RpcResponseAndContext,
  SignatureResult,
  SimulatedTransactionResponse,
  VersionedTransaction,
  BlockhashWithExpiryBlockHeight,
  Commitment,
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

export type SimulateAndSendResult =
  | SimulationErrorResult
  | TransactionSuccessResult

export type SimulateAndSendParams = {
  connection: Connection
  transaction: VersionedTransaction
  sendTransaction: (
    transaction: VersionedTransaction,
    connection: Connection,
    options?: SendTransactionOptions,
  ) => Promise<string>
  commitment?: Commitment
  onSignature?: (signature: string) => void
}

function isBlockhashNotFoundError(
  err: SimulatedTransactionResponse["err"],
): boolean {
  if (!err) return false
  try {
    const normalized = JSON.stringify(err).toLowerCase()
    return (
      normalized.includes("blockhashnotfound") ||
      normalized.includes("blockhash not found")
    )
  } catch {
    return false
  }
}

export async function simulateAndSendTransaction({
  connection,
  transaction,
  sendTransaction,
  commitment = "confirmed",
  onSignature,
}: SimulateAndSendParams): Promise<SimulateAndSendResult> {
  const hasAttachedSignatures = transaction.signatures.some((sig) =>
    sig.some((byte) => byte !== 0),
  )

  let latestBlockhash: BlockhashWithExpiryBlockHeight | null = null
  let minContextSlot: number | null = null

  const baseConfig = {
    commitment,
    ...(hasAttachedSignatures ? { replaceRecentBlockhash: true } : {}),
  }

  let simulation = await connection.simulateTransaction(
    transaction,
    baseConfig,
  )

  if (
    isBlockhashNotFoundError(simulation.value.err) &&
    !hasAttachedSignatures
  ) {
    const ctx = await connection.getLatestBlockhashAndContext({ commitment })
    latestBlockhash = ctx.value
    minContextSlot = ctx.context.slot
    transaction.message.recentBlockhash = latestBlockhash.blockhash

    simulation = await connection.simulateTransaction(transaction, {
      ...baseConfig,
      minContextSlot,
    })
  }

  if (
    simulation.value.err &&
    isSimulatedTransactionErrorResponse(simulation.value)
  ) {
    return {
      status: "simulation-error",
      error: normalizeProgramError(simulation.value),
      response: simulation.value,
    }
  }

  const sendOptions: SendTransactionOptions = {
    preflightCommitment: commitment,
  }
  if (minContextSlot !== null) {
    sendOptions.minContextSlot = minContextSlot
  }

  const signature = await sendTransaction(
    transaction,
    connection,
    sendOptions,
  )

  if (onSignature) {
    onSignature(signature)
  }

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
