"use client"

import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Code, FolderOpen, Loader2 } from "lucide-react"
import { useStudioStore } from "../../../lib/studio-store"
import { DEFAULT_RPC_BY_NETWORK } from "../../../lib/rpc-endpoints"
import { useToast } from "../../../hooks/use-toast"
import { Button } from "../../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog"

export function GenerateAppPanel() {
  const { config, airdrop, artifacts, checklist, workspace, generateApp, updateConfig, saveConfig } = useStudioStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [justGenerated, setJustGenerated] = useState(false)
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!justGenerated) return
    const t = setTimeout(() => setJustGenerated(false), 4000)
    return () => clearTimeout(t)
  }, [justGenerated])

  const prereqs = checklist.filter((item) => item.section !== "generate-app")
  const allPrereqsMet = prereqs.every((item) => item.completed)
  const incompleteItems = prereqs.filter((item) => !item.completed)
  const hasGenerated = artifacts.exportManifest.exists
  const hasUnsavedChanges = workspace.hasUnsavedChanges
  // 2s tolerance: exportWorkspaceBundle and saveWorkspaceBundle each stamp their own timestamp
  // a few ms apart, so a strict > comparison would falsely flag a fresh export as stale.
  const STALE_TOLERANCE_MS = 2000
  const isStale =
    hasGenerated &&
    !hasUnsavedChanges &&
    workspace.lastSaved != null &&
    workspace.lastExportedAt != null &&
    workspace.lastSaved.getTime() - workspace.lastExportedAt.getTime() > STALE_TOLERANCE_MS

  const airdropCreated = Boolean(airdrop.airdropAddress)
  const countdownWithoutSchedule = config.showCountdown && airdropCreated && !airdrop.startDate && !airdrop.endDate
  const countdownWithoutAirdrop = config.showCountdown && !airdropCreated
  const hasBlocker = countdownWithoutSchedule || countdownWithoutAirdrop

  const isDefaultPublicRpc = config.rpcUrl === DEFAULT_RPC_BY_NETWORK[config.network]
  const showMainnetPublicRpcWarning = config.network === "mainnet-beta" && isDefaultPublicRpc
  const blockerMessage = countdownWithoutSchedule
    ? "Countdown is enabled but no schedule is set. Set a start or end date in the airdrop, or disable the countdown in Brand settings."
    : countdownWithoutAirdrop
      ? "Countdown is enabled but no airdrop has been created. Create an airdrop first, or disable the countdown."
      : null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveConfig()
    } catch {
      toast({
        title: "Save failed",
        description: "Check the terminal for details.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await generateApp()
      setJustGenerated(true)
      toast({
        title: "App generated",
        description: "Run `pnpm dev` in the project directory to preview.",
      })
    } catch {
      toast({
        title: "Generation failed",
        description: "Check the terminal for details.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateClick = () => {
    if (hasGenerated) {
      setConfirmRegenerateOpen(true)
      return
    }
    void handleGenerate()
  }

  const handleConfirmRegenerate = () => {
    setConfirmRegenerateOpen(false)
    void handleGenerate()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Generate App</h3>
        <p className="text-sm text-muted-foreground">
          Build a deployable DApp from your configuration. Run <code className="text-xs bg-muted px-1 py-0.5">pnpm dev</code> in the project directory after generation.
        </p>
      </div>

      {/* Status */}
      {hasGenerated ? (
        <div
          className={[
            "flex items-start gap-2.5 border bg-success/5 px-3 py-2.5 transition-all",
            justGenerated
              ? "border-success ring-2 ring-success/40 shadow-[0_0_32px_-4px_oklch(0.72_0.12_165/0.55)] animate-pulse"
              : "border-success/30",
          ].join(" ")}
        >
          <CheckCircle2
            className={[
              "h-4 w-4 shrink-0 mt-0.5 text-success",
              justGenerated ? "animate-bounce" : "",
            ].join(" ")}
          />
          <div>
            <p className="text-sm font-medium text-success">
              {justGenerated ? "App generated successfully" : "App generated"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {artifacts.exportManifest.lastModified
                ? `Last generated ${artifacts.exportManifest.lastModified.toLocaleString()}`
                : null}
            </p>
          </div>
        </div>
      ) : null}

      {/* Stale — config saved after last export */}
      {isStale ? (
        <div className="flex items-start gap-2.5 border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-400">Configuration changed since last export</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Regenerate to apply your latest changes.
            </p>
          </div>
        </div>
      ) : null}

      {/* Prereqs */}
      {!allPrereqsMet ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-400">Prerequisites incomplete</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete the following steps before generating.
              </p>
            </div>
          </div>
          <div className="space-y-1">
            {incompleteItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 border border-border bg-muted/20">
                <div className="h-3 w-3 shrink-0 rounded-full border border-muted-foreground/30" />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Unsaved changes */}
      {hasUnsavedChanges ? (
        <div className="border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-400">Unsaved changes</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Save your configuration before generating the app.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            className="mt-2 w-full rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => void handleSave()}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      ) : null}

      {/* Blockers */}
      {blockerMessage ? (
        <div className="border border-red-500/30 bg-red-500/5 px-3 py-2.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <p className="text-sm text-red-400">{blockerMessage}</p>
          </div>
          <button
            type="button"
            className="mt-2 w-full rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            onClick={() => updateConfig("showCountdown", false)}
          >
            Disable Countdown
          </button>
        </div>
      ) : null}

      {/* Summary */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Output</p>
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Brand</span>
          <span className="text-sm font-medium text-foreground">{config.brandName}</span>
        </div>
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Layout</span>
          <span className="text-sm font-medium text-foreground">{config.layoutPreset}</span>
        </div>
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Network</span>
          <span className="text-sm font-medium text-foreground">
            {config.network === "mainnet-beta" ? "Mainnet" : "Devnet"}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 border border-border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground shrink-0">RPC</span>
          <span
            className="text-sm font-medium text-foreground text-right break-all line-clamp-2"
            title={config.rpcUrl}
          >
            {config.rpcUrl || "—"}
          </span>
        </div>
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Token</span>
          <span className="text-sm font-medium text-foreground">{airdrop.tokenSymbol || "—"}</span>
        </div>
        <div className="flex items-start justify-between gap-3 border border-border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            Path
          </span>
          <span
            className="text-xs font-mono text-foreground text-right break-all line-clamp-2"
            title={workspace.path}
          >
            {workspace.path || "—"}
          </span>
        </div>
      </div>

      {/* Mainnet public RPC warning */}
      {showMainnetPublicRpcWarning ? (
        <div className="flex items-start gap-2.5 border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-400">Using public mainnet RPC</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The generated app will ship with the public Solana RPC, which is rate-limited and not
              recommended for production. Swap in a dedicated RPC provider in <code className="text-xs bg-muted px-1 py-0.5">campaign.config.json</code>{" "}
              before deploying.
            </p>
          </div>
        </div>
      ) : null}

      {/* Generate button */}
      <Button
        className="w-full gap-2"
        size="lg"
        disabled={!allPrereqsMet || isGenerating || hasBlocker || hasUnsavedChanges}
        onClick={handleGenerateClick}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Code className="h-4 w-4" />
        )}
        {isGenerating ? "Generating..." : hasGenerated ? "Regenerate App" : "Generate App"}
      </Button>

      <Dialog open={confirmRegenerateOpen} onOpenChange={setConfirmRegenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerate app?</DialogTitle>
            <DialogDescription>
              This will overwrite the existing generated app in{" "}
              <code className="text-xs bg-muted px-1 py-0.5 break-all">{workspace.path || "your workspace"}</code>.
              Any manual edits to generated files will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRegenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRegenerate}>Regenerate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
