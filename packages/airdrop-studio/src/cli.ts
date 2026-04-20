#!/usr/bin/env node

import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseCliArgs } from "./cli-args.js"
import { runStudioCommand } from "./commands/studio.js"

async function main(): Promise<void> {
  const { help, version, workspacePath } = parseCliArgs(process.argv.slice(2))

  if (help) {
    printUsage()
    return
  }

  if (version) {
    printVersion()
    return
  }

  await runStudioCommand(workspacePath)
}

function printUsage(): void {
  process.stdout.write(
    [
      "Usage: airdrop-studio [path]",
      "",
      "Open the Bonkit studio for the given workspace path.",
      "If no workspace exists at the path, a new one is created.",
      "",
      "Options:",
      "  -h, --help       Show this help message",
      "  -v, --version    Show version number",
      "",
    ].join("\n"),
  )
}

function printVersion(): void {
  const pkgPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json")
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
  process.stdout.write(`${pkg.version}\n`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
