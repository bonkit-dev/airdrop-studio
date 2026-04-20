import {
  clearSignerSessionTokenCache,
  getSignerSessionToken,
} from "./studio-session"

const SIGNER_SESSION_HEADER = "x-bonkit-session"

export type SignerStatus = {
  state: "locked" | "unlocked"
  publicKey?: string
  expiresAt?: number
  idleTimeoutMs: number
}

export type UnlockResult =
  | { ok: true; publicKey: string; expiresAt: number }
  | { ok: false; error: string }

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(
      `Signer endpoint returned a non-JSON response (HTTP ${response.status}). The studio server may be out of date — restart with pnpm dev:studio.`,
    )
  }
}

export async function fetchSignerStatus(): Promise<SignerStatus> {
  const response = await fetch("/api/signer/status")
  return parseJsonOrThrow<SignerStatus>(response)
}

export async function unlockSignerSession(
  key: string,
  expectedPublicKey?: string,
): Promise<UnlockResult> {
  const response = await fetchWithSignerSession("/api/signer/unlock", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, expectedPublicKey }),
  })
  return parseJsonOrThrow<UnlockResult>(response)
}

export async function lockSignerSession(): Promise<void> {
  await fetchWithSignerSession("/api/signer/lock", { method: "POST" })
}

export async function signAndSendViaServer(
  serializedTx: Uint8Array,
): Promise<string> {
  const response = await fetchWithSignerSession("/api/signer/sign-send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ serializedTx: uint8ToBase64(serializedTx) }),
  })
  const body = await parseJsonOrThrow<{ ok: boolean; signature?: string; error?: string }>(response)
  if (!body.ok || !body.signature) {
    throw new Error(body.error ?? "Signer failed")
  }
  return body.signature
}

async function fetchWithSignerSession(input: string, init: RequestInit): Promise<Response> {
  const execute = async () => {
    const token = await getSignerSessionToken()
    const headers = new Headers(init.headers)
    headers.set(SIGNER_SESSION_HEADER, token)
    return fetch(input, { ...init, headers })
  }

  let response = await execute()
  if (response.status !== 403) {
    return response
  }

  clearSignerSessionTokenCache()
  response = await execute()
  return response
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  return btoa(binary)
}
