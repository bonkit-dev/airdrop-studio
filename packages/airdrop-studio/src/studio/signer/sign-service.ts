import { AIRDROP_STUDIO_PROGRAM_ID } from "@bonkit/airdrop-sdk"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  type TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js"
import { requireUnlockedKeypair } from "./keypair-session.js"

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")
const ALLOWED_PROGRAM_IDS = new Set([
  AIRDROP_STUDIO_PROGRAM_ID.toBase58(),
  ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
  ComputeBudgetProgram.programId.toBase58(),
  MEMO_PROGRAM_ID.toBase58(),
  SystemProgram.programId.toBase58(),
  TOKEN_2022_PROGRAM_ID.toBase58(),
  TOKEN_PROGRAM_ID.toBase58(),
])

export type SignSendInput = {
  serializedTx: string // base64
  rpcUrl: string
  expectedSignerPublicKey?: string
}

export type SignSendResult = { ok: true; signature: string } | { ok: false; error: string }

export async function signAndSendTransaction(input: SignSendInput): Promise<SignSendResult> {
  let keypair
  try {
    keypair = requireUnlockedKeypair()
  } catch {
    return { ok: false, error: "Keypair session is locked" }
  }

  if (input.expectedSignerPublicKey && keypair.publicKey.toBase58() !== input.expectedSignerPublicKey) {
    return { ok: false, error: "Unlocked keypair does not match the airdrop creator wallet" }
  }

  const rpcUrl = input.rpcUrl?.trim()
  if (!rpcUrl) {
    return { ok: false, error: "RPC URL is required" }
  }

  let txBytes: Buffer
  try {
    txBytes = Buffer.from(input.serializedTx, "base64")
  } catch {
    return { ok: false, error: "Invalid base64 transaction payload" }
  }
  if (txBytes.length === 0) {
    return { ok: false, error: "Empty transaction payload" }
  }

  let connection: Connection
  try {
    connection = new Connection(rpcUrl, "confirmed")
  } catch {
    return { ok: false, error: "Invalid RPC URL" }
  }

  let rawTx: Buffer
  try {
    const tx = tryDeserialize(txBytes)
    await assertSupportedTransaction(tx, connection, keypair.publicKey)
    if (tx.kind === "legacy") {
      tx.value.partialSign(keypair)
      rawTx = Buffer.from(
        tx.value.serialize({ requireAllSignatures: false, verifySignatures: false }),
      )
    } else {
      tx.value.sign([keypair])
      rawTx = Buffer.from(tx.value.serialize())
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign transaction"
    return { ok: false, error: message }
  }

  try {
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    })
    return { ok: true, signature }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit transaction"
    return { ok: false, error: message }
  }
}

type Deserialized =
  | { kind: "legacy"; value: Transaction }
  | { kind: "versioned"; value: VersionedTransaction }

function tryDeserialize(bytes: Buffer): Deserialized {
  try {
    const tx = VersionedTransaction.deserialize(bytes)
    return { kind: "versioned", value: tx }
  } catch {
    const tx = Transaction.from(bytes)
    return { kind: "legacy", value: tx }
  }
}

async function assertSupportedTransaction(
  tx: Deserialized,
  connection: Connection,
  expectedPayer: PublicKey,
): Promise<void> {
  const inspected = await inspectTransaction(tx, connection)

  if (!inspected.payer.equals(expectedPayer)) {
    throw new Error("Transaction fee payer must match the unlocked keypair")
  }
  if (inspected.instructions.length === 0) {
    throw new Error("Transaction contains no instructions")
  }

  let hasAirdropInstruction = false
  for (const instruction of inspected.instructions) {
    const programId = instruction.programId.toBase58()
    if (!ALLOWED_PROGRAM_IDS.has(programId)) {
      throw new Error(`Unsupported program in signer transaction: ${programId}`)
    }
    if (instruction.programId.equals(AIRDROP_STUDIO_PROGRAM_ID)) {
      hasAirdropInstruction = true
    }
  }

  if (!hasAirdropInstruction) {
    throw new Error("Transaction must target the Bonkit airdrop program")
  }
}

async function inspectTransaction(
  tx: Deserialized,
  connection: Connection,
): Promise<{ payer: PublicKey; instructions: TransactionInstruction[] }> {
  if (tx.kind === "legacy") {
    return {
      payer: tx.value.feePayer ?? tx.value.compileMessage().accountKeys[0],
      instructions: tx.value.instructions,
    }
  }

  const addressLookupTableAccounts = await Promise.all(
    tx.value.message.addressTableLookups.map(async ({ accountKey }) => {
      const response = await connection.getAddressLookupTable(accountKey)
      if (!response.value) {
        throw new Error(`Missing address lookup table: ${accountKey.toBase58()}`)
      }
      return response.value
    }),
  )

  const decompiled = TransactionMessage.decompile(tx.value.message, {
    addressLookupTableAccounts,
  })

  return {
    payer: decompiled.payerKey,
    instructions: decompiled.instructions,
  }
}
