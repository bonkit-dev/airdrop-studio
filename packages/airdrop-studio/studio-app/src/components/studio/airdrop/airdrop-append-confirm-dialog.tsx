"use client"

import { AlertTriangle } from "lucide-react"
import { RECIPIENTS_PER_APPEND } from "../../../lib/airdrop-batch-types"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog"

interface AirdropAppendConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientCount: number
  batchCount: number
  onConfirm: () => void
}

export function AirdropAppendConfirmDialog({
  open,
  onOpenChange,
  recipientCount,
  batchCount,
  onConfirm,
}: AirdropAppendConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Register Recipients On-Chain</DialogTitle>
          </div>
          <DialogDescription className="pt-2 space-y-2">
            <span className="block">
              <strong>{recipientCount.toLocaleString()}</strong> recipients will be registered across{" "}
              <strong>{batchCount}</strong> transaction(s), with up to {RECIPIENTS_PER_APPEND} recipients per
              transaction.
            </span>
            <span className="block">
              Each transaction requires wallet approval. Do not close this tab during the process.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
