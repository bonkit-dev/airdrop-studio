"use client"

import { BN } from "@coral-xyz/anchor"
import { PublicKey, type Connection } from "@solana/web3.js"
import { ONCHAIN_MAX_RECIPIENTS, type RecipientParseSummary } from "./airdrop-batch-types"

// --- Types ---

export type RecipientDraft = { address: string; amount: string }

export type MintProbeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string }
  | {
      status: "success"
      programLabel: "Token" | "Token-2022"
      decimals: number
      owner: string
      name: string
      symbol: string
      imageUrl: string | null
      metadataUri: string | null
      transferFee: { basisPoints: number; maxFee: string } | null
    }

// --- Constants ---

const METAPLEX_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
const METADATA_SEED = new TextEncoder().encode("metadata")

// --- Address utilities ---

export function isLikelySolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
}

export function shortenAddress(value: string) {
  return value.length > 10 ? `${value.slice(0, 4)}...${value.slice(-4)}` : value
}

export function compactAddress(value: string) {
  return value.length > 12 ? `${value.slice(0, 1)}...${value.slice(-1)}` : value
}

// --- Explorer ---

export function buildExplorerUrl(signature: string, cluster: "mainnet-beta" | "devnet") {
  const clusterParam = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`
  return `https://solscan.io/tx/${signature}${clusterParam}`
}

// --- Date/time utilities ---

export function toLocalDateTimeValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  const hours = `${date.getHours()}`.padStart(2, "0")
  const minutes = `${date.getMinutes()}`.padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const parsed = new Date(year, month, day, hour, minute, 0, 0)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDisplayDateTime(value: string) {
  const parsed = parseLocalDateTime(value)
  if (!parsed) return "YYYY-MM-DD HH:MM"
  return `${parsed.getFullYear()}-${`${parsed.getMonth() + 1}`.padStart(2, "0")}-${`${parsed.getDate()}`.padStart(2, "0")} ${`${parsed.getHours()}`.padStart(2, "0")}:${`${parsed.getMinutes()}`.padStart(2, "0")}`
}

export function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
}

export function roundMinute(date: Date) {
  const next = new Date(date)
  next.setSeconds(0, 0)
  return next
}

export function parseDateToBn(value: string) {
  const parsed = parseLocalDateTime(value)
  if (!parsed) return null
  return new BN(Math.floor(parsed.getTime() / 1000))
}

const START_MIN_OFFSET_MS = 5 * 60 * 1000
const START_DEFAULT_OFFSET_MS = 10 * 60 * 1000
const END_MIN_OFFSET_MS = 25 * 60 * 60 * 1000

function ceilDateToMinute(date: Date): Date {
  const next = new Date(date)
  next.setSeconds(0, 0)
  return next
}

export function getDraftScheduleErrors(startDate: string, endDate: string) {
  const now = new Date()
  const startMinDate = ceilDateToMinute(new Date(now.getTime() + START_MIN_OFFSET_MS))
  const endBaseMinDate = ceilDateToMinute(new Date(now.getTime() + END_MIN_OFFSET_MS))
  const parsedStart = parseLocalDateTime(startDate)
  const parsedEnd = parseLocalDateTime(endDate)
  const effectiveEndMin = parsedStart ? new Date(parsedStart.getTime() + END_MIN_OFFSET_MS) : endBaseMinDate

  let startError: string | null = null
  let endError: string | null = null

  if (startDate) {
    if (!parsedStart) {
      startError = "Start date format is invalid."
    } else if (parsedStart.getTime() < startMinDate.getTime()) {
      startError = "Start date must be at least 5 minutes from now."
    }
  }

  if (endDate && !parsedEnd) {
    endError = "End date format is invalid."
  } else if (parsedEnd && parsedEnd.getTime() < effectiveEndMin.getTime()) {
    endError = parsedStart
      ? "End date must be at least 25 hours after the start date."
      : "End date must be at least 25 hours from now."
  }

  const startDefaultDate = ceilDateToMinute(new Date(now.getTime() + START_DEFAULT_OFFSET_MS))
  const endDefaultDate = ceilDateToMinute(
    new Date((parsedStart ? parsedStart.getTime() : now.getTime()) + END_MIN_OFFSET_MS + START_DEFAULT_OFFSET_MS),
  )
  const minimum = toLocalDateTimeValue(startMinDate)
  const startDefault = toLocalDateTimeValue(startDefaultDate)
  const endMinimum = toLocalDateTimeValue(effectiveEndMin)
  const endDefault = toLocalDateTimeValue(endDefaultDate)
  return { startError, endError, minimum, startDefault, endMinimum, endDefault }
}

// --- Recipient parsing ---

export function parseRecipientLine(line: string) {
  const trimmed = line.trim()
  if (!trimmed) return null

  const normalized = trimmed.replace(/\t/g, ",")
  const parts = normalized.includes(",") ? normalized.split(",") : normalized.split(/\s+/)
  const [address, amount] = parts.map((part) => part.trim()).filter(Boolean)

  if (!address || !amount) return null

  const lowerAddress = address.toLowerCase()
  const lowerAmount = amount.toLowerCase()
  if (
    (lowerAddress.includes("wallet") || lowerAddress.includes("address")) &&
    (lowerAmount.includes("amount") || lowerAmount.includes("allocation"))
  ) {
    return null
  }

  return { address, amount }
}

export function parseRecipientsText(text: string): RecipientDraft[] {
  return text
    .split(/\r?\n/)
    .map((line) => parseRecipientLine(line))
    .filter((entry): entry is RecipientDraft => Boolean(entry))
}

// --- Schedule label ---

export function formatScheduleLabel(startDate: string, endDate: string): string {
  if (startDate && endDate)
    return `${new Date(startDate).toLocaleDateString()} ~ ${new Date(endDate).toLocaleDateString()}`
  if (startDate) return `${new Date(startDate).toLocaleDateString()} ~ No end date`
  if (endDate) return `Immediate ~ ${new Date(endDate).toLocaleDateString()}`
  return "Immediate start, no end date"
}

// --- Token amount formatting ---

export function formatTokenAmount(raw: string, decimals: number): string {
  if (!raw || raw === "0") return "0"
  const str = raw.padStart(decimals + 1, "0")
  const intPart = str.slice(0, str.length - decimals) || "0"
  const fracPart = decimals > 0 ? str.slice(str.length - decimals).replace(/0+$/, "") : ""
  return fracPart ? `${intPart}.${fracPart}` : intPart
}

type DecimalParts = {
  integer: string
  fraction: string
}

function parseDecimalAmountParts(input: string): DecimalParts | null {
  const cleaned = input.replace(/,/g, "").trim()
  if (!/^(?:\d+|\d+\.\d+|\.\d+)$/.test(cleaned)) {
    return null
  }

  const normalized = cleaned.startsWith(".") ? `0${cleaned}` : cleaned
  const [rawInteger, rawFraction = ""] = normalized.split(".")
  const integer = rawInteger.replace(/^0+(?=\d)/, "") || "0"
  return { integer, fraction: rawFraction }
}

function formatScaledBigInt(value: bigint, scale: number): string {
  const digits = value.toString()
  if (scale === 0) {
    return digits
  }

  const padded = digits.padStart(scale + 1, "0")
  const integer = padded.slice(0, -scale).replace(/^0+(?=\d)/, "") || "0"
  const fraction = padded.slice(-scale).replace(/0+$/, "")
  return fraction ? `${integer}.${fraction}` : integer
}

export function formatDecimalAmountWithGrouping(value: string): string {
  const parts = parseDecimalAmountParts(value)
  if (!parts) {
    return "0"
  }

  const integer = parts.integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  const fraction = parts.fraction.replace(/0+$/, "")
  return fraction ? `${integer}.${fraction}` : integer
}

export function sumDecimalAmounts(values: readonly string[]): string {
  const parsedValues: DecimalParts[] = []
  let scale = 0

  for (const value of values) {
    const parts = parseDecimalAmountParts(value)
    if (!parts) continue
    parsedValues.push(parts)
    scale = Math.max(scale, parts.fraction.length)
  }

  if (parsedValues.length === 0) {
    return "0"
  }

  let total = 0n
  for (const parts of parsedValues) {
    total += BigInt(`${parts.integer}${parts.fraction.padEnd(scale, "0")}`)
  }

  return formatScaledBigInt(total, scale)
}

export function decimalAmountToRawUnits(
  value: string,
  decimals: number,
): { raw: string; truncated: boolean } | null {
  const parts = parseDecimalAmountParts(value)
  if (!parts || decimals < 0) {
    return null
  }

  const keptFraction = parts.fraction.slice(0, decimals)
  const raw = `${parts.integer}${keptFraction.padEnd(decimals, "0")}`.replace(/^0+(?=\d)/, "") || "0"
  return {
    raw,
    truncated: parts.fraction.length > decimals,
  }
}

export function decimalAmountToBn(
  value: string,
  decimals: number,
): { amount: BN; truncated: boolean } | null {
  const units = decimalAmountToRawUnits(value, decimals)
  if (!units) {
    return null
  }

  return {
    amount: new BN(units.raw),
    truncated: units.truncated,
  }
}

// --- Validated recipient parsing ---

export function parseRecipientsWithValidation(text: string, decimals: number): RecipientParseSummary {
  const lines = text.split(/\r?\n/)
  const errors: string[] = []
  let invalidCount = 0
  let duplicateCount = 0
  let truncatedCount = 0
  const seenAddresses = new Set<string>()
  const recipients: Array<{ address: string; amount: string }> = []
  let totalAmountBn = new BN(0)

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseRecipientLine(lines[i])
    if (!parsed) continue

    const { address, amount: rawAmount } = parsed

    let pubkey: PublicKey
    try {
      pubkey = new PublicKey(address)
    } catch {
      invalidCount++
      errors.push(`Row ${i + 1}: invalid address "${address}"`)
      continue
    }

    const base58 = pubkey.toBase58()
    if (seenAddresses.has(base58)) {
      duplicateCount++
      continue
    }
    seenAddresses.add(base58)

    const parsedAmount = decimalAmountToBn(rawAmount, decimals)
    if (!parsedAmount) {
      invalidCount++
      errors.push(`Row ${i + 1}: invalid amount "${rawAmount}"`)
      continue
    }
    if (parsedAmount.truncated) {
      truncatedCount++
    }
    if (parsedAmount.amount.isZero()) {
      invalidCount++
      errors.push(`Row ${i + 1}: amount "${rawAmount}" rounds down to zero at token precision`)
      continue
    }

    totalAmountBn = totalAmountBn.add(parsedAmount.amount)
    const truncatedAmount = formatTokenAmount(parsedAmount.amount.toString(), decimals)
    recipients.push({ address: base58, amount: truncatedAmount })
  }

  if (recipients.length > ONCHAIN_MAX_RECIPIENTS) {
    const removed = recipients.length - ONCHAIN_MAX_RECIPIENTS
    recipients.length = ONCHAIN_MAX_RECIPIENTS
    errors.push(`Exceeded ${ONCHAIN_MAX_RECIPIENTS.toLocaleString()} recipient limit — ${removed} entries trimmed.`)
  }

  return {
    recipients,
    totalCount: recipients.length,
    invalidCount,
    duplicateCount,
    truncatedCount,
    totalAmount: totalAmountBn.toString(),
    errors,
  }
}

// --- Chunk utility ---

export function chunkRecipients<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

// --- Wallet rejection detection ---

const REJECTION_PATTERNS = [
  "user rejected",
  "user cancelled",
  "user denied",
  "rejected the request",
  "declined",
  "transaction was not confirmed",
  "user disapproved",
]

export function isUserRejectedError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : typeof error === "string" ? error.toLowerCase() : ""
  return REJECTION_PATTERNS.some((pattern) => message.includes(pattern))
}

// --- Mint metadata ---

function readU32LE(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return view.getUint32(offset, true)
}

function decodeBorshString(data: Uint8Array, offset: number): { value: string; nextOffset: number } {
  const length = readU32LE(data, offset)
  const start = offset + 4
  const end = start + length
  const raw = data.slice(start, end)
  const value = new TextDecoder("utf-8").decode(raw).replace(/\0/g, "").trim()
  return { value, nextOffset: end }
}

export function normalizeTokenLabel(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

function findLegacyMetaplexMetadataPda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [METADATA_SEED, METAPLEX_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METAPLEX_METADATA_PROGRAM_ID,
  )[0]
}

export async function fetchLegacyMetaplexMetadataAccount(connection: Connection, mint: PublicKey) {
  try {
    const pda = findLegacyMetaplexMetadataPda(mint)
    const accountInfo = await connection.getAccountInfo(pda)
    if (!accountInfo) return null

    const data = accountInfo.data as Uint8Array
    let offset = 1 + 32 + 32
    const name = decodeBorshString(data, offset)
    offset = name.nextOffset
    const symbol = decodeBorshString(data, offset)
    offset = symbol.nextOffset
    const uri = decodeBorshString(data, offset)

    return {
      name: name.value,
      symbol: symbol.value,
      uri: uri.value,
    }
  } catch {
    return null
  }
}

export async function fetchTokenMetadataJson(uri: string | null) {
  const trimmed = uri?.trim() ?? ""
  if (!trimmed || !trimmed.startsWith("http")) {
    return null
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(trimmed, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
    if (!response.ok) return null
    const json = (await response.json().catch(() => null)) as Record<string, unknown> | null
    if (!json) return null

    return {
      name: typeof json.name === "string" ? json.name : null,
      symbol: typeof json.symbol === "string" ? json.symbol : null,
      image: typeof json.image === "string" ? json.image : null,
    }
  } catch {
    return null
  } finally {
    window.clearTimeout(timeoutId)
  }
}
