import type { PreviewCountdownScenario } from "./studio-store"

const WINDOW_MS = 24 * 60 * 60 * 1000

export function derivePreviewCountdownDates(scenario: PreviewCountdownScenario): {
  start: string
  end: string
} {
  const now = Date.now()
  if (scenario === "starts-in") {
    return {
      start: new Date(now + WINDOW_MS).toISOString(),
      end: new Date(now + WINDOW_MS * 2).toISOString(),
    }
  }
  if (scenario === "ends-in") {
    return {
      // Nudge start slightly into the past so runtime CountdownBlock treats it as "started".
      start: new Date(now - 60_000).toISOString(),
      end: new Date(now + WINDOW_MS).toISOString(),
    }
  }
  // ended
  return {
    start: new Date(now - WINDOW_MS * 2).toISOString(),
    end: new Date(now - WINDOW_MS).toISOString(),
  }
}
