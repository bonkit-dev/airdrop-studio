"use client"

import { useState } from "react"
import { KeyRound, Loader2, Trash2, Unlock, Wallet } from "lucide-react"

import { Button } from "../../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip"
import { useStudioStore } from "../../../lib/studio-store"
import { lockSignerSession } from "../../../lib/signer-client"
import { shortenAddress } from "../../../lib/airdrop-utils"
import { cn } from "../../../lib/utils"
import { toast } from "../../../hooks/use-toast"
import { KeypairImportDialog } from "./keypair-import-dialog"

interface SignerModePanelProps {
  connecting: boolean
  connected: boolean
  walletAddress: string | null
  walletBusy: boolean
  expectedCreatorWallet: string | null
  onConnectWallet: () => void
  onDisconnectWallet: () => Promise<void> | void
}

export function SignerModePanel({
  connecting,
  connected,
  walletAddress,
  walletBusy,
  expectedCreatorWallet,
  onConnectWallet,
  onDisconnectWallet,
}: SignerModePanelProps) {
  const signerMode = useStudioStore((state) => state.signerMode)
  const setSignerMode = useStudioStore((state) => state.setSignerMode)
  const keypairSession = useStudioStore((state) => state.keypairSession)
  const setKeypairSession = useStudioStore((state) => state.setKeypairSession)
  const [importOpen, setImportOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleSelectMode = (mode: "extension" | "keypair") => {
    if (mode === signerMode) return
    setSignerMode(mode)
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await lockSignerSession()
      setKeypairSession({
        status: "locked",
        publicKey: null,
        expiresAt: null,
        idleTimeoutMs: keypairSession.idleTimeoutMs,
      })
      toast({ title: "Keypair removed from memory", variant: "success" })
    } finally {
      setRemoving(false)
    }
  }

  const keypairMismatch =
    signerMode === "keypair" &&
    keypairSession.status === "unlocked" &&
    expectedCreatorWallet !== null &&
    keypairSession.publicKey !== expectedCreatorWallet

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="inline-flex items-center self-start border border-border p-0.5 text-xs">
        <ModeButton
          active={signerMode === "extension"}
          onClick={() => handleSelectMode("extension")}
        >
          <Wallet className="h-3.5 w-3.5" /> Extension
        </ModeButton>
        <ModeButton
          active={signerMode === "keypair"}
          onClick={() => handleSelectMode("keypair")}
        >
          <KeyRound className="h-3.5 w-3.5" /> Keypair
        </ModeButton>
      </div>

      {signerMode === "extension" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={walletBusy}
            onClick={onConnectWallet}
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            {connected
              ? shortenAddress(walletAddress ?? "")
              : connecting
                ? "Connecting..."
                : "Connect Wallet"}
          </Button>
          {connected ? (
            <Button
              type="button"
              variant="ghost"
              className="gap-2"
              onClick={() => void onDisconnectWallet()}
              disabled={walletBusy}
            >
              Disconnect
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {keypairSession.status === "unlocked" && keypairSession.publicKey ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-2 border border-success/40 bg-success/5 px-3 py-2 text-xs">
                    <Unlock className="h-3.5 w-3.5 text-success" />
                    <span className="font-mono text-foreground">
                      {shortenAddress(keypairSession.publicKey)}
                    </span>
                    <span className="text-muted-foreground">Local signer</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Not bundled in generated app. Auto-removed from memory after 30m of inactivity or when the studio process exits.
                </TooltipContent>
              </Tooltip>
              <Button
                type="button"
                variant="ghost"
                className="gap-2 text-destructive hover:text-destructive"
                disabled={removing}
                onClick={() => void handleRemove()}
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setImportOpen(true)}
            >
              <KeyRound className="h-4 w-4" />
              Import Keypair
            </Button>
          )}
          {keypairMismatch ? (
            <p className="text-xs text-destructive">
              Keypair does not match the airdrop creator. Remove and import the correct keypair.
            </p>
          ) : null}
        </div>
      )}

      <KeypairImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        expectedPublicKey={expectedCreatorWallet ?? undefined}
      />
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
