import bs58 from "bs58"

const SECRET_KEY_LENGTH = 64

export class SecretKeyParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SecretKeyParseError"
  }
}

export function parseSecretKey(input: string): Uint8Array {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new SecretKeyParseError("Secret key is empty")
  }

  if (trimmed.startsWith("[")) {
    return parseJsonArray(trimmed)
  }

  return parseBase58(trimmed)
}

function parseJsonArray(input: string): Uint8Array {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    throw new SecretKeyParseError("Invalid byte array format")
  }

  if (!Array.isArray(parsed)) {
    throw new SecretKeyParseError("Keypair byte array must be an array")
  }
  if (parsed.length !== SECRET_KEY_LENGTH) {
    throw new SecretKeyParseError(`Expected ${SECRET_KEY_LENGTH} bytes, got ${parsed.length}`)
  }
  for (const value of parsed) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 255) {
      throw new SecretKeyParseError("Byte array must contain integers between 0 and 255")
    }
  }
  return Uint8Array.from(parsed as number[])
}

function parseBase58(input: string): Uint8Array {
  let decoded: Uint8Array
  try {
    decoded = bs58.decode(input)
  } catch {
    throw new SecretKeyParseError("Invalid base58 secret key")
  }
  if (decoded.length !== SECRET_KEY_LENGTH) {
    throw new SecretKeyParseError(`Expected ${SECRET_KEY_LENGTH} bytes, got ${decoded.length}`)
  }
  return decoded
}
