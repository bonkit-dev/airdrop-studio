import { mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

const BATCH_DRAFT_FILE = "onchain-batch-draft.json"
const BATCH_HISTORY_FILE = "onchain-batch-history.json"
const ACTIVITY_LOG_FILE = "activity-log.json"
const ACTIVITY_LOG_MAX_ENTRIES = 100

async function ensureBonkitDir(workspaceRoot: string): Promise<string> {
  const dir = path.join(workspaceRoot, ".bonkit")
  await mkdir(dir, { recursive: true })
  return dir
}

async function readJsonFile(filePath: string): Promise<unknown> {
  try {
    const raw = await readFile(filePath, "utf8")
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath)
  } catch {
    // ignore missing file
  }
}

// --- Batch draft (active in-progress batch, at most one per workspace) ---

export async function readBatchDraft(workspaceRoot: string): Promise<unknown | null> {
  const filePath = path.join(workspaceRoot, ".bonkit", BATCH_DRAFT_FILE)
  const value = await readJsonFile(filePath)
  return value === null ? null : value
}

export async function writeBatchDraft(workspaceRoot: string, draft: unknown): Promise<void> {
  const dir = await ensureBonkitDir(workspaceRoot)
  await writeJsonFile(path.join(dir, BATCH_DRAFT_FILE), draft)
}

export async function deleteBatchDraft(workspaceRoot: string): Promise<void> {
  await deleteFile(path.join(workspaceRoot, ".bonkit", BATCH_DRAFT_FILE))
}

// --- Batch history (completed batches, append-only) ---

export async function readBatchHistory(workspaceRoot: string): Promise<unknown[]> {
  const filePath = path.join(workspaceRoot, ".bonkit", BATCH_HISTORY_FILE)
  const value = await readJsonFile(filePath)
  return Array.isArray(value) ? value : []
}

export async function appendBatchHistory(workspaceRoot: string, batch: unknown): Promise<void> {
  const existing = await readBatchHistory(workspaceRoot)
  const next = [...existing, batch]
  const dir = await ensureBonkitDir(workspaceRoot)
  await writeJsonFile(path.join(dir, BATCH_HISTORY_FILE), next)
}

export async function deleteBatchHistory(workspaceRoot: string): Promise<void> {
  await deleteFile(path.join(workspaceRoot, ".bonkit", BATCH_HISTORY_FILE))
}

// --- Activity log (newest-first, capped) ---

export async function readActivityLog(workspaceRoot: string): Promise<unknown[]> {
  const filePath = path.join(workspaceRoot, ".bonkit", ACTIVITY_LOG_FILE)
  const value = await readJsonFile(filePath)
  return Array.isArray(value) ? value : []
}

export async function appendActivityLog(workspaceRoot: string, entry: unknown): Promise<void> {
  const existing = await readActivityLog(workspaceRoot)
  const next = [entry, ...existing].slice(0, ACTIVITY_LOG_MAX_ENTRIES)
  const dir = await ensureBonkitDir(workspaceRoot)
  await writeJsonFile(path.join(dir, ACTIVITY_LOG_FILE), next)
}

export async function deleteActivityLog(workspaceRoot: string): Promise<void> {
  await deleteFile(path.join(workspaceRoot, ".bonkit", ACTIVITY_LOG_FILE))
}
