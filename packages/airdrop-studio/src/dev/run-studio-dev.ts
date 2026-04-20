import { spawn } from "node:child_process"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import open from "open"
import { parseCliArgs } from "../cli-args.js"
import { ensureStudioWorkspace } from "../commands/studio.js"
import { startStudioServer } from "../studio/server.js"

async function main(): Promise<void> {
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
  const invocationCwd = process.env.INIT_CWD ?? process.cwd()
  process.chdir(invocationCwd)

  const { workspacePath } = parseCliArgs(process.argv.slice(2))
  const resolvedWorkspace = await ensureStudioWorkspace(workspacePath)
  const apiServer = await startStudioServer(resolvedWorkspace, { serveClient: "none" })
  const apiUrl = apiServer.url.replace(/\/$/, "")
  const studioUrl = "http://127.0.0.1:4173/"

  process.stdout.write(`Bonkit studio API running at ${apiUrl}/api\n`)

  const viteArgs = [
    "exec",
    "vite",
    "--config",
    "studio-app/vite.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
    "--strictPort",
  ]
  const viteProcess = spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", viteArgs, {
    cwd: packageRoot,
    env: {
      ...process.env,
      VITE_STUDIO_API_ORIGIN: apiUrl,
    },
    stdio: "inherit",
  })

  let browserOpened = false
  const openBrowser = async () => {
    if (browserOpened) {
      return
    }
    browserOpened = true
    try {
      await open(studioUrl)
    } catch {
      process.stdout.write(`Open this URL in your browser: ${studioUrl}\n`)
    }
  }

  const browserTimer = setTimeout(() => {
    void openBrowser()
  }, 1200)

  const shutdown = async () => {
    clearTimeout(browserTimer)
    if (!viteProcess.killed) {
      viteProcess.kill("SIGTERM")
    }
    await apiServer.close()
  }

  process.on("SIGINT", () => {
    void shutdown().finally(() => process.exit(130))
  })

  process.on("SIGTERM", () => {
    void shutdown().finally(() => process.exit(143))
  })

  viteProcess.on("exit", async (code) => {
    clearTimeout(browserTimer)
    await apiServer.close()
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
