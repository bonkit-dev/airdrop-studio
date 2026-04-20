"use client"

import { useEffect, useMemo } from "react"
import { Circle, FolderOpen, Gift, Save } from "lucide-react"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { useStudioStore } from "../../lib/studio-store"
import { cn } from "../../lib/utils"

function detectIsMac() {
  if (typeof navigator === "undefined") return false
  return /mac/i.test(navigator.userAgent)
}

export function AppBar() {
  const { workspace, saveConfig } = useStudioStore()
  const hasUnsaved = workspace.hasUnsavedChanges
  const isMac = useMemo(detectIsMac, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (hasUnsaved) {
          void saveConfig()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasUnsaved, saveConfig])

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center px-4 shrink-0 relative gap-4">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 shrink-0">
          <Gift className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Airdrop Studio</span>
        </div>
        <div className="h-6 w-px bg-border shrink-0" />
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs text-muted-foreground truncate max-w-[28rem]">
                {workspace.path}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-mono text-xs break-all max-w-md">
            {workspace.path}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="flex items-center gap-2 text-sm">
          <Circle
            className={cn(
              "w-2 h-2",
              hasUnsaved ? "fill-warning text-warning" : "fill-success text-success",
            )}
          />
          <span className="text-muted-foreground">
            {hasUnsaved ? "Unsaved changes" : "Saved"}
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center shrink-0">
        <Button
          variant={hasUnsaved ? "default" : "ghost"}
          size="sm"
          onClick={() => void saveConfig()}
          disabled={!hasUnsaved}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
          <kbd className="hidden sm:inline text-[10px] leading-none opacity-60">
            {isMac ? "⌘S" : "Ctrl+S"}
          </kbd>
        </Button>
      </div>
    </header>
  )
}
