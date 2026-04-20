type StudioSessionPayload = {
  signerSessionToken: string
}

let cachedSignerSessionToken: Promise<string> | null = null

export function clearSignerSessionTokenCache(): void {
  cachedSignerSessionToken = null
}

export async function getSignerSessionToken(): Promise<string> {
  if (cachedSignerSessionToken) {
    return await cachedSignerSessionToken
  }

  cachedSignerSessionToken = (async () => {
    const response = await fetch("/api/session")
    if (!response.ok) {
      throw new Error(
        `Studio session is unavailable (HTTP ${response.status}). Restart the studio server and try again.`,
      )
    }

    const body = (await response.json().catch(() => null)) as StudioSessionPayload | null
    if (!body?.signerSessionToken) {
      throw new Error("Studio session token is missing from the server response.")
    }

    return body.signerSessionToken
  })()

  try {
    return await cachedSignerSessionToken
  } catch (error) {
    cachedSignerSessionToken = null
    throw error
  }
}
