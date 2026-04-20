import { access, readdir } from "node:fs/promises"
import path from "node:path"
import { runInit } from "./init.js"
import { runStudio } from "../studio/server.js"

export async function runStudioCommand(workspacePath?: string): Promise<void> {
  const resolvedPath = await ensureStudioWorkspace(workspacePath)
  await runStudio(resolvedPath, { openBrowser: true })
}

export async function ensureStudioWorkspace(workspacePath?: string): Promise<string> {
  const resolvedPath = path.resolve(workspacePath ?? process.cwd())
  const mode = await detectStudioTargetMode(resolvedPath)

  if (mode === "bootstrap") {
    return runInit(resolvedPath)
  }

  return resolvedPath
}

async function detectStudioTargetMode(inputPath: string): Promise<"existing-workspace" | "bootstrap"> {
  const resolvedPath = path.resolve(inputPath)
  const configPath = path.join(resolvedPath, "campaign.config.json")

  try {
    await access(configPath)
    return "existing-workspace"
  } catch {
    // Continue below.
  }

  try {
    await access(resolvedPath)
  } catch {
    return "bootstrap"
  }

  const entries = await readdir(resolvedPath)
  if (entries.length === 0) {
    return "bootstrap"
  }

  return "existing-workspace"
}
