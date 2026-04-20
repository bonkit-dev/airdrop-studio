import { cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"

export async function ensureDirectory(targetPath: string): Promise<void> {
  await mkdir(targetPath, { recursive: true })
}

export async function ensureEmptyDirectory(targetPath: string): Promise<void> {
  try {
    const targetStat = await stat(targetPath)
    if (!targetStat.isDirectory()) {
      throw new Error(`Target exists and is not a directory: ${targetPath}`)
    }

    const entries = await readdir(targetPath)
    if (entries.length > 0) {
      throw new Error(`Target directory is not empty: ${targetPath}`)
    }
  } catch (error) {
    const maybeNodeError = error as NodeJS.ErrnoException
    if (maybeNodeError.code === "ENOENT") {
      await mkdir(targetPath, { recursive: true })
      return
    }

    throw error
  }
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => variables[key] ?? "")
}

export async function copyRenderedTemplateDirectory(
  sourceDir: string,
  targetDir: string,
  variables: Record<string, string>,
): Promise<void> {
  await ensureDirectory(targetDir)
  const entries = await readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetName = entry.name.endsWith(".hbs") ? entry.name.slice(0, -4) : entry.name
    const targetPath = path.join(targetDir, targetName)

    if (entry.isDirectory()) {
      await copyRenderedTemplateDirectory(sourcePath, targetPath, variables)
      continue
    }

    if (entry.name.endsWith(".svg")) {
      const content = await readFile(sourcePath, "utf8")
      await writeFile(targetPath, renderTemplate(content, variables), "utf8")
      continue
    }

    const content = await readFile(sourcePath, "utf8")
    await writeFile(targetPath, renderTemplate(content, variables), "utf8")
  }
}

export async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
  await cp(sourceDir, targetDir, { recursive: true })
}
