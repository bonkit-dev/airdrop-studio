"use client"

import { Download } from "lucide-react"
import type { OnchainAppendBatchDraft, OnchainAppendChunkStatus } from "../../../lib/airdrop-batch-types"
import { buildExplorerUrl, shortenAddress } from "../../../lib/airdrop-utils"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog"

interface AirdropBatchDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batches: OnchainAppendBatchDraft[]
  cluster: "mainnet-beta" | "devnet"
}

const statusConfig: Record<OnchainAppendChunkStatus, { label: string; badgeClass: string }> = {
  pending: { label: "Pending", badgeClass: "bg-muted text-muted-foreground" },
  in_progress: { label: "Processing", badgeClass: "bg-primary text-primary-foreground" },
  success: {
    label: "Success",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  failed: { label: "Failed", badgeClass: "bg-destructive/15 text-destructive border-destructive/20" },
}

function downloadCsv(batches: OnchainAppendBatchDraft[], cluster: "mainnet-beta" | "devnet") {
  const header = "round,batch,status,wallet,amount,signature,explorer_url,error"
  const rows = batches.flatMap((batch, batchIdx) =>
    batch.chunks.flatMap((chunk) =>
      chunk.recipients.map((r) => {
        const sig = chunk.signature ?? ""
        const url = sig ? buildExplorerUrl(sig, cluster) : ""
        const err = chunk.errorMessage?.replace(/"/g, '""') ?? ""
        return `${batchIdx + 1},${chunk.index + 1},${chunk.status},${r.wallet},${r.amount},${sig},${url},"${err}"`
      }),
    ),
  )
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  const ts = new Date().toISOString().slice(0, 10)
  const suffix = batches.length === 1 ? batches[0].id : `${batches.length}rounds`
  a.download = `append-batches-${ts}-${suffix}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AirdropBatchDetailsDialog({ open, onOpenChange, batches, cluster }: AirdropBatchDetailsDialogProps) {
  if (!batches.length) return null

  const allChunks = batches.flatMap((b) => b.chunks)
  const totalRecipients = batches.reduce((sum, b) => sum + b.totalRecipients, 0)
  const successCount = allChunks.filter((c) => c.status === "success").length
  const failedCount = allChunks.filter((c) => c.status === "failed").length
  const multipleRounds = batches.length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Append Batch Details</DialogTitle>
          <DialogDescription>
            Review append batches, signatures, and failed reasons.
            {multipleRounds ? ` (${batches.length} rounds)` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Batches</p>
              <p className="text-sm font-semibold">{allChunks.length}</p>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Recipients</p>
              <p className="text-sm font-semibold">{totalRecipients.toLocaleString()}</p>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Completed</p>
              <p className="text-sm font-semibold">{successCount}</p>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Needs Retry</p>
              <p className="text-sm font-semibold">{failedCount}</p>
            </div>
          </div>

          {/* Batch overview table */}
          <div className="border border-border text-sm">
            <div className={`grid ${multipleRounds ? "grid-cols-[56px_72px_100px_80px_72px_1fr_minmax(0,1fr)]" : "grid-cols-[72px_100px_80px_72px_1fr_minmax(0,1fr)]"} items-center gap-2 border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground`}>
              {multipleRounds ? <span>Round</span> : null}
              <span>Batch</span>
              <span>Status</span>
              <span className="text-right">Recipients</span>
              <span className="text-right">Attempts</span>
              <span>Signature</span>
              <span>Error</span>
            </div>
            <div className="max-h-56 divide-y divide-border overflow-auto">
              {batches.flatMap((batch, batchIdx) =>
                batch.chunks.map((chunk) => {
                  const cfg = statusConfig[chunk.status]
                  return (
                    <div
                      key={`batch-row-${batchIdx}-${chunk.index}`}
                      className={`grid ${multipleRounds ? "grid-cols-[56px_72px_100px_80px_72px_1fr_minmax(0,1fr)]" : "grid-cols-[72px_100px_80px_72px_1fr_minmax(0,1fr)]"} items-center gap-2 px-3 py-2`}
                    >
                      {multipleRounds ? <span className="font-mono text-xs text-muted-foreground">R{batchIdx + 1}</span> : null}
                      <span className="font-mono text-xs">#{chunk.index + 1}</span>
                      <div>
                        <Badge className={cfg.badgeClass}>{cfg.label}</Badge>
                      </div>
                      <span className="text-right text-xs font-medium">{chunk.recipients.length}</span>
                      <span className="text-right text-xs">{chunk.attempts}</span>
                      {chunk.signature ? (
                        <a
                          href={buildExplorerUrl(chunk.signature, cluster)}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs text-primary underline underline-offset-2"
                          title={chunk.signature}
                        >
                          {shortenAddress(chunk.signature)}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      <span className="truncate text-xs text-muted-foreground" title={chunk.errorMessage || ""}>
                        {chunk.errorMessage || "-"}
                      </span>
                    </div>
                  )
                }),
              )}
            </div>
          </div>

          {/* Recipient detail table */}
          <div className="border border-border text-sm">
            <div className={`grid ${multipleRounds ? "grid-cols-[56px_72px_100px_1fr_100px_1fr]" : "grid-cols-[72px_100px_1fr_100px_1fr]"} items-center gap-2 border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground`}>
              {multipleRounds ? <span>Round</span> : null}
              <span>Batch</span>
              <span>Status</span>
              <span>Wallet</span>
              <span className="text-right">Amount</span>
              <span>Signature</span>
            </div>
            <div className="max-h-80 divide-y divide-border overflow-auto">
              {batches.flatMap((batch, batchIdx) =>
                batch.chunks.flatMap((chunk) => {
                  const cfg = statusConfig[chunk.status]
                  return chunk.recipients.map((r, ri) => (
                    <div
                      key={`recipient-${batchIdx}-${chunk.index}-${ri}`}
                      className={`grid ${multipleRounds ? "grid-cols-[56px_72px_100px_1fr_100px_1fr]" : "grid-cols-[72px_100px_1fr_100px_1fr]"} items-center gap-2 px-3 py-2 font-mono`}
                    >
                      {multipleRounds ? <span className="text-xs text-muted-foreground">R{batchIdx + 1}</span> : null}
                      <span className="text-xs">#{chunk.index + 1}</span>
                      <div>
                        <Badge className={cfg.badgeClass}>{cfg.label}</Badge>
                      </div>
                      <span className="truncate text-xs" title={r.wallet}>
                        {r.wallet}
                      </span>
                      <span className="text-right text-xs font-medium tabular-nums">
                        {r.amount}
                      </span>
                      {chunk.signature ? (
                        <a
                          href={buildExplorerUrl(chunk.signature, cluster)}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs text-primary underline underline-offset-2"
                          title={chunk.signature}
                        >
                          {shortenAddress(chunk.signature)}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  ))
                }),
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="justify-between pt-2">
          <Button size="sm" variant="outline" onClick={() => downloadCsv(batches, cluster)}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download CSV
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
