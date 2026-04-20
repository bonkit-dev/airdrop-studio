"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Code,
  ExternalLink,
  Filter,
  Info,
  Save,
  ScrollText,
  Trash2,
} from "lucide-react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { useStudioStore, type ActivityLogEntry, type ActivityLogType } from "../../lib/studio-store"
import { cn } from "../../lib/utils"

const typeConfig: Record<ActivityLogType, { icon: React.ElementType; color: string; label: string }> = {
  save: { icon: Save, color: "text-muted-foreground", label: "Save" },
  transaction: { icon: CheckCircle2, color: "text-success", label: "Transaction" },
  generate: { icon: Code, color: "text-primary", label: "Generate" },
  error: { icon: AlertCircle, color: "text-destructive", label: "Error" },
  info: { icon: Info, color: "text-muted-foreground", label: "Info" },
}

const ALL_TYPES: ActivityLogType[] = ["save", "transaction", "generate", "error", "info"]

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function formatFullTimestamp(date: Date): string {
  return date.toLocaleString()
}

function timeAgo(date: Date, now: number): string {
  const seconds = Math.floor((now - date.getTime()) / 1000)
  if (seconds < 5) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return formatTime(date)
}

function useNowTick(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function LogEntry({
  entry,
  expanded,
  onToggle,
  now,
}: {
  entry: ActivityLogEntry
  expanded: boolean
  onToggle: () => void
  now: number
}) {
  const cfg = typeConfig[entry.type]
  const Icon = cfg.icon
  const hasDetail = Boolean(entry.detail || entry.explorerUrl)

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasDetail}
        className={cn(
          "w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors",
          hasDetail ? "hover:bg-muted/30 cursor-pointer" : "cursor-default",
        )}
      >
        {hasDetail ? (
          <span className="shrink-0 mt-0.5 text-muted-foreground">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        ) : (
          <span className="w-3 h-3 shrink-0 mt-0.5" />
        )}
        <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", cfg.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm text-foreground truncate">{entry.title}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                  {timeAgo(entry.timestamp, now)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">{formatFullTimestamp(entry.timestamp)}</TooltipContent>
            </Tooltip>
          </div>
          {!expanded && entry.detail ? (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.detail}</p>
          ) : null}
        </div>
      </button>
      {expanded && hasDetail ? (
        <div className="px-4 pb-3 pl-[3.25rem] space-y-2">
          {entry.detail ? (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">{entry.detail}</p>
          ) : null}
          {entry.explorerUrl ? (
            <a
              href={entry.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
            >
              <ExternalLink className="w-3 h-3" />
              View on explorer
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function TypeFilter({
  selected,
  counts,
  onToggle,
  onReset,
}: {
  selected: Set<ActivityLogType>
  counts: Record<ActivityLogType, number>
  onToggle: (type: ActivityLogType) => void
  onReset: () => void
}) {
  const allOn = selected.size === 0 || selected.size === ALL_TYPES.length
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
      {ALL_TYPES.map((type) => {
        const cfg = typeConfig[type]
        const active = allOn || selected.has(type)
        const count = counts[type] ?? 0
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors",
              active
                ? "border-border bg-muted/60 text-foreground"
                : "border-border/50 bg-transparent text-muted-foreground/60 hover:text-foreground",
            )}
          >
            <span>{cfg.label}</span>
            <span className="tabular-nums text-muted-foreground">{count}</span>
          </button>
        )
      })}
      {!allOn ? (
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
        >
          Reset
        </button>
      ) : null}
    </div>
  )
}

export function ActivityLog() {
  const { drawerOpen, setDrawerOpen, activityLog, clearLog } = useStudioStore()
  const now = useNowTick(60_000)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Set<ActivityLogType>>(new Set())
  const [clearOpen, setClearOpen] = useState(false)

  const counts = useMemo(() => {
    const result: Record<ActivityLogType, number> = {
      save: 0,
      transaction: 0,
      generate: 0,
      error: 0,
      info: 0,
    }
    for (const entry of activityLog) result[entry.type]++
    return result
  }, [activityLog])

  const visibleLog = useMemo(() => {
    if (filter.size === 0) return activityLog
    return activityLog.filter((entry) => filter.has(entry.type))
  }, [activityLog, filter])

  const latestEntry = activityLog[0]

  const toggleFilter = (type: ActivityLogType) => {
    setFilter((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const resetFilter = () => setFilter(new Set())

  const handleConfirmClear = () => {
    clearLog()
    setExpandedId(null)
    setFilter(new Set())
    setClearOpen(false)
  }

  return (
    <div
      className={cn(
        "border-t border-border bg-surface transition-all duration-300 shrink-0",
        drawerOpen ? "h-64" : "h-10",
      )}
    >
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="w-full h-10 px-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <ScrollText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-foreground">Activity</span>
          {!drawerOpen && latestEntry ? (
            <span className="text-xs text-muted-foreground truncate">
              {latestEntry.title} — {timeAgo(latestEntry.timestamp, now)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activityLog.length > 0 ? (
            <span className="text-[10px] text-muted-foreground">{activityLog.length}</span>
          ) : null}
          {drawerOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>
      {drawerOpen ? (
        <div className="h-[calc(100%-2.5rem)] flex flex-col">
          {activityLog.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-3 px-4 py-1.5 border-b border-border">
                <TypeFilter
                  selected={filter}
                  counts={counts}
                  onToggle={toggleFilter}
                  onReset={resetFilter}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-muted-foreground shrink-0"
                  onClick={() => setClearOpen(true)}
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {visibleLog.length > 0 ? (
                  visibleLog.map((entry) => (
                    <LogEntry
                      key={entry.id}
                      entry={entry}
                      expanded={expandedId === entry.id}
                      onToggle={() => setExpandedId((prev) => (prev === entry.id ? null : entry.id))}
                      now={now}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground">No entries match the current filter</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No activity yet</p>
            </div>
          )}
        </div>
      ) : null}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear activity log?</DialogTitle>
            <DialogDescription>
              This removes all {activityLog.length} log {activityLog.length === 1 ? "entry" : "entries"} for this
              workspace. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" size="sm" onClick={handleConfirmClear}>
              Clear log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
