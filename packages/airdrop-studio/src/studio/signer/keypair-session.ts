import { Keypair } from "@solana/web3.js"
import { parseSecretKey, SecretKeyParseError } from "./parse-secret-key.js"

const IDLE_TIMEOUT_MS = 30 * 60 * 1000

type SessionState =
  | { state: "locked" }
  | { state: "unlocked"; keypair: Keypair; lastActivity: number; expiresAt: number }

let current: SessionState = { state: "locked" }
let idleTimer: NodeJS.Timeout | null = null

function clearIdleTimer(): void {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
}

function scheduleIdleTimer(): void {
  clearIdleTimer()
  idleTimer = setTimeout(() => {
    lockKeypairSession()
  }, IDLE_TIMEOUT_MS)
}

export type UnlockResult =
  | { ok: true; publicKey: string; expiresAt: number }
  | { ok: false; error: string }

export function unlockKeypairSession(rawSecretKey: string, expectedPublicKey?: string): UnlockResult {
  let secretKey: Uint8Array
  try {
    secretKey = parseSecretKey(rawSecretKey)
  } catch (error) {
    if (error instanceof SecretKeyParseError) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "Failed to parse secret key" }
  }

  let keypair: Keypair
  try {
    // Pass a copy so we can safely zero the caller-side secretKey buffer. Keypair.fromSecretKey
    // stores the provided Uint8Array by reference internally, so zeroing the original buffer
    // would also zero the keypair's secret and every subsequent signature would be invalid.
    keypair = Keypair.fromSecretKey(new Uint8Array(secretKey))
  } catch {
    secretKey.fill(0)
    return { ok: false, error: "Invalid Solana keypair" }
  }
  secretKey.fill(0)

  const publicKey = keypair.publicKey.toBase58()
  if (expectedPublicKey && publicKey !== expectedPublicKey) {
    return {
      ok: false,
      error: `Keypair public key (${publicKey}) does not match expected (${expectedPublicKey})`,
    }
  }

  lockKeypairSession()
  const now = Date.now()
  const expiresAt = now + IDLE_TIMEOUT_MS
  current = { state: "unlocked", keypair, lastActivity: now, expiresAt }
  scheduleIdleTimer()
  return { ok: true, publicKey, expiresAt }
}

export function lockKeypairSession(): void {
  clearIdleTimer()
  current = { state: "locked" }
  // Note: JS cannot reliably wipe Keypair internal buffers — its `secretKey` getter returns
  // a copy, and the underlying `_keypair.secretKey` reference is not publicly exposed. We
  // rely on GC after the reference is dropped.
}

export function getKeypairSessionStatus(): {
  state: "locked" | "unlocked"
  publicKey?: string
  expiresAt?: number
  idleTimeoutMs: number
} {
  if (current.state === "unlocked") {
    return {
      state: "unlocked",
      publicKey: current.keypair.publicKey.toBase58(),
      expiresAt: current.expiresAt,
      idleTimeoutMs: IDLE_TIMEOUT_MS,
    }
  }
  return { state: "locked", idleTimeoutMs: IDLE_TIMEOUT_MS }
}

export function requireUnlockedKeypair(): Keypair {
  if (current.state !== "unlocked") {
    throw new Error("Keypair session is locked")
  }
  const now = Date.now()
  current.lastActivity = now
  current.expiresAt = now + IDLE_TIMEOUT_MS
  scheduleIdleTimer()
  return current.keypair
}
