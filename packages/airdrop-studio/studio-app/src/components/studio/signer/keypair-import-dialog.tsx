"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, KeyRound, Loader2 } from "lucide-react"

import { Button } from "../../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog"
import { Textarea } from "../../ui/textarea"
import { useStudioStore } from "../../../lib/studio-store"
import { unlockSignerSession } from "../../../lib/signer-client"
import { toast } from "../../../hooks/use-toast"

interface KeypairImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expectedPublicKey?: string | null
  onSuccess?: (publicKey: string) => void
}

export function KeypairImportDialog({
  open,
  onOpenChange,
  expectedPublicKey,
  onSuccess,
}: KeypairImportDialogProps) {
  const setKeypairSession = useStudioStore((state) => state.setKeypairSession)
  const setSignerMode = useStudioStore((state) => state.setSignerMode)
  const [keyInput, setKeyInput] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setKeyInput("")
      setAcknowledged(false)
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  const trimmed = keyInput.trim()
  const canSubmit = acknowledged && trimmed.length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await unlockSignerSession(trimmed, expectedPublicKey ?? undefined)
      if (!result.ok) {
        setError(result.error)
        setSubmitting(false)
        return
      }
      setKeypairSession({
        status: "unlocked",
        publicKey: result.publicKey,
        expiresAt: result.expiresAt,
        idleTimeoutMs: 30 * 60 * 1000,
      })
      setSignerMode("keypair")
      toast({
        title: "Keypair imported",
        description: `Signer active until you remove it or the studio process exits.`,
        variant: "success",
      })
      onSuccess?.(result.publicKey)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unlock failed"
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
              <KeyRound className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle>Import Keypair</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Import a Solana keypair for automatic signing of airdrop transactions. The key lives only in
            this local studio session and is NEVER included in the generated campaign app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-foreground">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-amber-500">Local signer only.</span> The private key
                stays in the memory of the local studio process running on your machine. It never leaves
                this computer. It is removed from memory when:
              </p>
              <ul className="ml-4 list-disc space-y-0.5 text-muted-foreground">
                <li>You click Remove</li>
                <li>The studio CLI process exits</li>
                <li>30 minutes pass without signing activity</li>
              </ul>
              <p className="pt-1">
                <span className="font-semibold">Use a dedicated hot wallet</span> with minimal balance for
                airdrop operations — never your main wallet.
              </p>
            </div>
          </div>
        </div>

        {expectedPublicKey ? (
          <div className="border border-border bg-muted/30 p-3 text-xs">
            <p className="text-muted-foreground">Required creator wallet</p>
            <p className="mt-1 break-all font-mono text-foreground">{expectedPublicKey}</p>
            <p className="mt-2 text-muted-foreground">
              Import must match this public key (the wallet that created the draft).
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground" htmlFor="keypair-secret">
            Secret key
          </label>
          <Textarea
            id="keypair-secret"
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            placeholder="Paste base58 (Phantom/Solflare export) or byte array like [12,34,...] (solana-keygen / id.json)"
            className="min-h-[96px] resize-none font-mono text-xs"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-[11px] text-muted-foreground">
            Both formats are auto-detected. Content is not copied to the clipboard or logged.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-primary"
          />
          <span>
            I understand this key stays in local studio memory, is never bundled into the generated app,
            and I accept responsibility for its use.
          </span>
        </label>

        {error ? (
          <div className="border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {submitting ? "Importing..." : "Import Keypair"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
