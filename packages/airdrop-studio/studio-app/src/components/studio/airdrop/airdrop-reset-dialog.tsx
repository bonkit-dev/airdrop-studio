"use client"

import { useState } from "react"
import { AlertTriangle, Copy, Download, Loader2, RefreshCw, ShieldAlert } from "lucide-react"
import { useStudioStore, type AirdropConfig } from "../../../lib/studio-store"
import { deriveRegisteredAllocation, deriveRegisteredRecipientCount } from "../../../lib/airdrop-allocation"
import { cn } from "../../../lib/utils"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog"

interface AirdropResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  airdrop: AirdropConfig
  network: "mainnet-beta" | "devnet"
  isCanceling?: boolean
  onConfirmReset: () => void
  onCancelAndReset?: () => void
}

type ResetRisk = "low" | "high" | "critical"

function getResetRisk(airdrop: AirdropConfig): ResetRisk {
  if (airdrop.startSignature) return "critical"
  if (airdrop.depositSignature) return "high"
  return "low"
}

export function AirdropResetDialog({
  open,
  onOpenChange,
  airdrop,
  network,
  isCanceling = false,
  onConfirmReset,
  onCancelAndReset,
}: AirdropResetDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)
  const completedBatches = useStudioStore((state) => state.completedBatches)
  const registeredAllocation = deriveRegisteredAllocation(completedBatches)
  const registeredRecipientsCount = deriveRegisteredRecipientCount(completedBatches)

  const risk = getResetRisk(airdrop)
  const requiresAck = risk !== "low"
  const hasEndDate = Boolean(airdrop.endDate)
  const backup = {
    airdropAddress: airdrop.airdropAddress,
    creatorWallet: airdrop.creatorWallet,
    network,
    mintAddress: airdrop.mintAddress || null,
    tokenSymbol: airdrop.tokenSymbol || null,
    registeredAllocation,
    startDate: airdrop.startDate || null,
    endDate: airdrop.endDate || null,
    recipientsCount: registeredRecipientsCount,
    depositSignature: airdrop.depositSignature,
    startSignature: airdrop.startSignature,
    exportedAt: new Date().toISOString(),
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(backup, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `airdrop-backup-${airdrop.airdropAddress?.slice(0, 8) ?? "unknown"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    if (risk === "high" && onCancelAndReset) {
      onCancelAndReset()
    } else {
      setAcknowledged(false)
      onConfirmReset()
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setAcknowledged(false)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                risk === "critical" ? "bg-destructive/10" : risk === "high" ? "bg-destructive/10" : "bg-amber-500/10",
              )}
            >
              {risk === "critical" ? (
                <ShieldAlert className="h-5 w-5 text-destructive" />
              ) : (
                <AlertTriangle
                  className={cn("h-5 w-5", risk === "high" ? "text-destructive" : "text-amber-500")}
                />
              )}
            </div>
            <DialogTitle>Reset Airdrop</DialogTitle>
          </div>
          <div className="space-y-3 pt-2">
            {risk === "low" ? (
              <DialogDescription>
                This will clear the current airdrop configuration including the on-chain airdrop address, recipients, and
                all transaction history. Network fees already spent will not be refunded.
              </DialogDescription>
            ) : null}

            {risk === "high" ? (
              <div className="border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">Deposited tokens will be recovered</p>
                <p className="mt-1 text-xs text-destructive/80">
                  {registeredAllocation} {airdrop.tokenSymbol} is currently deposited in the vault. Resetting will
                  automatically cancel the airdrop on-chain and return the tokens to your wallet before clearing the
                  workspace.
                </p>
              </div>
            ) : null}

            {risk === "critical" ? (
              <div className="space-y-2">
                <div className="border border-destructive/40 bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">Airdrop is live — Reset strongly discouraged</p>
                  <p className="mt-1 text-xs text-destructive/80">
                    This airdrop has been started. Registered recipients ({registeredRecipientsCount.toLocaleString()}) can
                    discover and claim tokens by analyzing on-chain transactions. Resetting the workspace does not stop the
                    on-chain airdrop.
                  </p>
                </div>
                {!hasEndDate ? (
                  <div className="border border-destructive/40 bg-destructive/5 p-3">
                    <p className="text-xs text-destructive/80">
                      This airdrop has no end date. Deposited tokens ({registeredAllocation} {airdrop.tokenSymbol})
                      cannot be withdrawn from the vault.
                    </p>
                  </div>
                ) : (
                  <div className="border border-amber-500/40 bg-amber-500/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      This airdrop ends on{" "}
                      <span className="font-medium text-foreground">
                        {new Date(airdrop.endDate).toLocaleDateString()}
                      </span>
                      . Unclaimed tokens can be withdrawn after the end date through a separate management tool.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Backup info */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Backup information</p>
              <div className="border border-border bg-muted/20 p-3 font-mono text-xs">
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-muted-foreground">Airdrop</span>
                  <span className="truncate text-foreground">{airdrop.airdropAddress}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-muted-foreground">Creator</span>
                  <span className="truncate text-foreground">{airdrop.creatorWallet}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-foreground">{network === "mainnet-beta" ? "Mainnet" : "Devnet"}</span>
                </div>
                {airdrop.depositSignature ? (
                  <div className="flex justify-between gap-2 py-0.5">
                    <span className="text-muted-foreground">Deposited</span>
                    <span className="text-foreground">
                      {registeredAllocation} {airdrop.tokenSymbol}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void handleCopy()}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy Backup"}
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>

            {/* Acknowledgment checkbox for risky resets */}
            {requiresAck ? (
              <label className="flex cursor-pointer items-start gap-3 border border-border bg-muted/10 p-3">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-destructive"
                />
                <span className="text-xs text-muted-foreground">
                  {risk === "critical"
                    ? "I understand that resetting does not stop the on-chain airdrop, and that recipients can still claim tokens."
                    : "I understand that this will cancel the airdrop and return deposited tokens to my wallet."}
                </span>
              </label>
            ) : null}
          </div>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isCanceling}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={handleReset}
            disabled={(requiresAck && !acknowledged) || isCanceling}
          >
            {isCanceling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isCanceling
              ? "Canceling..."
              : risk === "high"
                ? "Cancel & Reset"
                : "Reset Airdrop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
