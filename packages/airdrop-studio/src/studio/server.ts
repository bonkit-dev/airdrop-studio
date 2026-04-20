import { randomBytes } from "node:crypto"
import { access, readFile } from "node:fs/promises"
import { createServer, type IncomingMessage } from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import open from "open"
import {
  applyStudioEdits,
  exportWorkspaceBundle,
  loadWorkspaceBundle,
  resetAirdropFields,
  saveWorkspaceBundle,
} from "../workspace/files.js"
import { generateProjectApp } from "../generators/project.js"
import {
  getKeypairSessionStatus,
  lockKeypairSession,
  unlockKeypairSession,
} from "./signer/keypair-session.js"
import { signAndSendTransaction } from "./signer/sign-service.js"
import {
  appendActivityLog,
  appendBatchHistory,
  deleteActivityLog,
  deleteBatchDraft,
  deleteBatchHistory,
  readActivityLog,
  readBatchDraft,
  readBatchHistory,
  writeBatchDraft,
} from "./storage/history-files.js"

const SIGNER_SESSION_HEADER = "x-bonkit-session"
const LOCAL_ORIGIN_RE = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/

export async function runStudio(workspacePath: string | undefined, options?: { openBrowser?: boolean }): Promise<void> {
  const resolvedRoot = path.resolve(workspacePath ?? process.cwd())
  await loadWorkspaceBundle(resolvedRoot)
  const { url } = await startStudioServer(resolvedRoot, { serveClient: "static" })
  process.stdout.write(`Bonkit studio running at ${url}\n`)

  if (options?.openBrowser ?? true) {
    try {
      await open(url)
    } catch {
      process.stdout.write(`Open this URL in your browser: ${url}\n`)
    }
  }
}

export async function startStudioServer(
  workspacePath: string,
  options?: {
    serveClient?: "static" | "none"
    port?: number
  },
): Promise<{
  url: string
  close: () => Promise<void>
}> {
  const resolvedRoot = path.resolve(workspacePath)
  const signerSessionToken = randomBytes(32).toString("base64url")
  await loadWorkspaceBundle(resolvedRoot)
  const studioClientDir = options?.serveClient === "static" ? await resolveStudioClientDir() : null

  const server = createServer(async (req, res) => {
    const reqOrigin = typeof req.headers.origin === "string" ? req.headers.origin : undefined
    const json = (body: unknown, statusCode = 200) => sendJson(res, body, statusCode, reqOrigin)
    const text = (statusCode: number, body: string) => sendText(res, statusCode, body, reqOrigin)
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1")
      const pathname = url.pathname
      const isApiRequest = pathname.startsWith("/api/")

      if (req.method === "OPTIONS" && isApiRequest) {
        sendNoContent(res, reqOrigin)
        return
      }

      if (pathname === "/api/state" && req.method === "GET") {
        const bundle = await loadWorkspaceBundle(resolvedRoot)
        json({
          rootDir: bundle.rootDir,
          config: bundle.config,
          workspace: bundle.workspace,
        })
        return
      }

      if (pathname === "/api/files" && req.method === "GET") {
        const bundle = await loadWorkspaceBundle(resolvedRoot)
        const [config, workspace] = await Promise.all([
          readFile(bundle.configPath, "utf8"),
          readFile(bundle.workspacePath, "utf8"),
        ])
        json({ config, workspace })
        return
      }

      if (pathname === "/api/session" && req.method === "GET") {
        if (!hasAllowedLocalOrigin(reqOrigin)) {
          text(403, "Forbidden")
          return
        }
        res.writeHead(200, {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          ...corsHeaders(reqOrigin),
        })
        res.end(JSON.stringify({ signerSessionToken }))
        return
      }

      if (pathname === "/api/save" && req.method === "POST") {
        try {
          const payload = JSON.parse(await readBody(req))
          const bundle = await loadWorkspaceBundle(resolvedRoot)
          const nextBundle = applyStudioEdits(bundle, payload)
          await saveWorkspaceBundle(nextBundle)
          json({ ok: true })
        } catch (err) {
          const raw = err instanceof Error ? err.message : "Unknown error"
          json({ ok: false, error: humanizeSaveError(raw) }, 400)
        }
        return
      }

      if (pathname === "/api/reset-airdrop" && req.method === "POST") {
        const bundle = await loadWorkspaceBundle(resolvedRoot)
        const nextBundle = resetAirdropFields(bundle)
        await saveWorkspaceBundle(nextBundle)
        json({ ok: true })
        return
      }

      if (pathname === "/api/generate-app" && req.method === "POST") {
        const bundle = await loadWorkspaceBundle(resolvedRoot)
        await generateProjectApp(bundle)
        await exportWorkspaceBundle(bundle)
        process.stdout.write(`[studio] POST /api/generate-app → 200 OK\n`)
        json({ ok: true })
        return
      }

      if (pathname === "/api/signer/status" && req.method === "GET") {
        json(getKeypairSessionStatus())
        return
      }

      if (pathname === "/api/signer/unlock" && req.method === "POST") {
        if (!hasAllowedLocalOrigin(reqOrigin) || !hasValidSignerSession(req, signerSessionToken)) {
          json({ ok: false, error: "Forbidden" }, 403)
          return
        }
        if (!isJsonRequest(req)) {
          json({ ok: false, error: "Expected application/json" }, 415)
          return
        }
        try {
          const payload = JSON.parse(await readBody(req)) as {
            key?: unknown
            expectedPublicKey?: unknown
          }
          if (typeof payload.key !== "string" || payload.key.length === 0) {
            json({ ok: false, error: "Missing secret key" }, 400)
            return
          }
          const expected =
            typeof payload.expectedPublicKey === "string" && payload.expectedPublicKey.length > 0
              ? payload.expectedPublicKey
              : undefined
          const result = unlockKeypairSession(payload.key, expected)
          json(result, result.ok ? 200 : 400)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request"
          json({ ok: false, error: message }, 400)
        }
        return
      }

      if (pathname === "/api/signer/lock" && req.method === "POST") {
        if (!hasAllowedLocalOrigin(reqOrigin) || !hasValidSignerSession(req, signerSessionToken)) {
          json({ ok: false, error: "Forbidden" }, 403)
          return
        }
        lockKeypairSession()
        json({ ok: true })
        return
      }

      if (pathname === "/api/batch-draft" && req.method === "GET") {
        const draft = await readBatchDraft(resolvedRoot)
        json({ draft })
        return
      }

      if (pathname === "/api/batch-draft" && req.method === "POST") {
        try {
          const payload = JSON.parse(await readBody(req)) as { draft?: unknown }
          if (payload.draft === undefined || payload.draft === null) {
            json({ ok: false, error: "Missing draft" }, 400)
            return
          }
          await writeBatchDraft(resolvedRoot, payload.draft)
          json({ ok: true })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request"
          json({ ok: false, error: message }, 400)
        }
        return
      }

      if (pathname === "/api/batch-draft" && req.method === "DELETE") {
        await deleteBatchDraft(resolvedRoot)
        json({ ok: true })
        return
      }

      if (pathname === "/api/batch-history" && req.method === "GET") {
        const batches = await readBatchHistory(resolvedRoot)
        json({ batches })
        return
      }

      if (pathname === "/api/batch-history" && req.method === "POST") {
        try {
          const payload = JSON.parse(await readBody(req)) as { batch?: unknown }
          if (payload.batch === undefined || payload.batch === null) {
            json({ ok: false, error: "Missing batch" }, 400)
            return
          }
          await appendBatchHistory(resolvedRoot, payload.batch)
          json({ ok: true })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request"
          json({ ok: false, error: message }, 400)
        }
        return
      }

      if (pathname === "/api/batch-history" && req.method === "DELETE") {
        await deleteBatchHistory(resolvedRoot)
        json({ ok: true })
        return
      }

      if (pathname === "/api/activity-log" && req.method === "GET") {
        const entries = await readActivityLog(resolvedRoot)
        json({ entries })
        return
      }

      if (pathname === "/api/activity-log" && req.method === "POST") {
        try {
          const payload = JSON.parse(await readBody(req)) as { entry?: unknown }
          if (payload.entry === undefined || payload.entry === null) {
            json({ ok: false, error: "Missing entry" }, 400)
            return
          }
          await appendActivityLog(resolvedRoot, payload.entry)
          json({ ok: true })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request"
          json({ ok: false, error: message }, 400)
        }
        return
      }

      if (pathname === "/api/activity-log" && req.method === "DELETE") {
        await deleteActivityLog(resolvedRoot)
        json({ ok: true })
        return
      }

      if (pathname === "/api/signer/sign-send" && req.method === "POST") {
        if (!hasAllowedLocalOrigin(reqOrigin) || !hasValidSignerSession(req, signerSessionToken)) {
          json({ ok: false, error: "Forbidden" }, 403)
          return
        }
        if (!isJsonRequest(req)) {
          json({ ok: false, error: "Expected application/json" }, 415)
          return
        }
        try {
          const payload = JSON.parse(await readBody(req)) as {
            serializedTx?: unknown
          }
          if (typeof payload.serializedTx !== "string" || payload.serializedTx.length === 0) {
            json({ ok: false, error: "Missing serializedTx" }, 400)
            return
          }
          const bundle = await loadWorkspaceBundle(resolvedRoot)
          const result = await signAndSendTransaction({
            serializedTx: payload.serializedTx,
            rpcUrl: bundle.config.network.rpcUrl,
            expectedSignerPublicKey: bundle.workspace.airdrop.creatorWallet ?? undefined,
          })
          json(result, result.ok ? 200 : 400)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request"
          json({ ok: false, error: message }, 400)
        }
        return
      }

      if (req.method !== "GET") {
        text(404, "Not found")
        return
      }

      if (!studioClientDir) {
        text(404, "Not found")
        return
      }

      if (pathname === "/" || pathname === "/preview") {
        await sendFile(res, path.join(studioClientDir, "index.html"))
        return
      }

      const assetPath = toSafeAssetPath(studioClientDir, pathname)
      if (!assetPath) {
        text(404, "Not found")
        return
      }

      await sendFile(res, assetPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      process.stderr.write(`[studio] ${req.method} ${req.url} → 500: ${message}\n`)
      if (error instanceof Error && error.stack) {
        process.stderr.write(`${error.stack}\n`)
      }
      json({ error: message }, 500)
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(options?.port ?? 0, "127.0.0.1", () => {
      resolve()
    })
  })

  const address = server.address()
  if (!address || typeof address === "string") {
    throw new Error("Failed to start Bonkit studio server.")
  }

  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      }),
  }
}

async function resolveStudioClientDir(): Promise<string> {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const candidate = path.resolve(currentDir, "..", "..", "dist", "studio-app")
  const indexPath = path.join(candidate, "index.html")

  try {
    await access(indexPath)
    return candidate
  } catch {
    throw new Error(
      [
        "Bonkit studio client assets were not found.",
        "Run `pnpm build` in the repository before launching the studio CLI.",
      ].join("\n"),
    )
  }
}

function toSafeAssetPath(rootDir: string, pathname: string): string | null {
  const sanitized = pathname.replace(/^\/+/, "")
  if (!sanitized) {
    return null
  }

  const filePath = path.resolve(rootDir, sanitized)
  if (!filePath.startsWith(rootDir)) {
    return null
  }

  return filePath
}

async function sendFile(
  res: import("node:http").ServerResponse<import("node:http").IncomingMessage>,
  filePath: string,
): Promise<void> {
  try {
    const contents = await readFile(filePath)
    res.writeHead(200, { "content-type": contentTypeForPath(filePath) })
    res.end(contents)
  } catch {
    sendText(res, 404, "Not found")
  }
}

function sendJson(
  res: import("node:http").ServerResponse<import("node:http").IncomingMessage>,
  body: unknown,
  statusCode = 200,
  origin?: string,
): void {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    ...corsHeaders(origin),
  })
  res.end(JSON.stringify(body))
}

function sendText(
  res: import("node:http").ServerResponse<import("node:http").IncomingMessage>,
  statusCode: number,
  body: string,
  origin?: string,
): void {
  res.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    ...corsHeaders(origin),
  })
  res.end(body)
}

function sendNoContent(res: import("node:http").ServerResponse<import("node:http").IncomingMessage>, origin?: string): void {
  res.writeHead(204, corsHeaders(origin))
  res.end()
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString("utf8")
}

function isJsonRequest(req: IncomingMessage): boolean {
  const header = req.headers["content-type"]
  const value = Array.isArray(header) ? header[0] : header
  return typeof value === "string" && value.toLowerCase().startsWith("application/json")
}

function hasValidSignerSession(req: IncomingMessage, expectedToken: string): boolean {
  const header = req.headers[SIGNER_SESSION_HEADER]
  if (Array.isArray(header)) {
    return header.includes(expectedToken)
  }
  return header === expectedToken
}

const fieldLabels: Record<string, string> = {
  "brand.name": "Brand name",
  "brand.colors.primary": "Primary color",
  "brand.colors.secondary": "Secondary color",
  "brand.colors.background": "Background color",
  "brand.colors.foreground": "Foreground color",
  "network.cluster": "Network",
  "network.rpcUrl": "RPC URL",
  "campaign.claimMode": "Claim mode",
  "campaign.airdropAddress": "Airdrop address",
  "campaign.mintAddress": "Mint address",
  "ui.radius": "Global radius",
}

function humanizeSaveError(raw: string): string {
  if (!raw.startsWith("Invalid campaign.config.json")) return raw

  const lines = raw.split("\n").slice(1)
  const friendly: string[] = []

  for (const line of lines) {
    const colonIdx = line.indexOf(": ")
    if (colonIdx < 0) continue
    const fieldPath = line.slice(0, colonIdx).trim()

    const customMatch = fieldPath.match(/^links\.custom(?:\.(\d+)|\[(\d+)])\.(\w+)$/)
    if (customMatch) {
      const rawIndex = customMatch[1] ?? customMatch[2]
      const index = Number(rawIndex) + 1
      const fieldName = customMatch[3]
      const field = fieldName === "href" ? "URL" : fieldName === "label" ? "label" : fieldName
      friendly.push(`Footer link #${index}: invalid ${field}`)
      continue
    }

    const label = fieldLabels[fieldPath]
    if (label) {
      friendly.push(`${label} is invalid`)
      continue
    }

    friendly.push(line)
  }

  return friendly.length > 0
    ? friendly.join(". ") + "."
    : "Configuration has invalid values. Check your settings and try again."
}

function contentTypeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8"
    case ".js":
      return "application/javascript; charset=utf-8"
    case ".css":
      return "text/css; charset=utf-8"
    case ".json":
      return "application/json; charset=utf-8"
    case ".svg":
      return "image/svg+xml"
    case ".png":
      return "image/png"
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".webp":
      return "image/webp"
    default:
      return "application/octet-stream"
  }
}

function corsHeaders(origin?: string): Record<string, string> {
  const allowed = origin && LOCAL_ORIGIN_RE.test(origin) ? origin : ""
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type, x-bonkit-session",
    ...(allowed ? { vary: "Origin" } : {}),
  }
}

function hasAllowedLocalOrigin(origin?: string): boolean {
  return !origin || LOCAL_ORIGIN_RE.test(origin)
}
