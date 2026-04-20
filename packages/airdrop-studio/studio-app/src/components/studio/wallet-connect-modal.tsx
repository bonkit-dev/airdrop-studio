"use client"

import { WalletName, WalletReadyState } from "@solana/wallet-adapter-base"
import { useWallet } from "@solana/wallet-adapter-react"
import { Check, ExternalLink, Loader2, Sparkles, Wallet } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { cn } from "../../lib/utils"

interface WalletConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface WalletOption {
  name: WalletName
  icon?: string
  detected: boolean
  readyState: WalletReadyState
  url?: string
  isLastConnected?: boolean
}

const LAST_CONNECTED_WALLET_NAME_KEY = "bonkit-studio:last-connected-wallet-name"

const recommendedWallets: WalletOption[] = [
  {
    name: "Phantom" as WalletName,
    detected: false,
    readyState: WalletReadyState.NotDetected,
    url: "https://phantom.com/",
  },
  {
    name: "Solflare" as WalletName,
    detected: false,
    readyState: WalletReadyState.NotDetected,
    url: "https://solflare.com/",
  },
]

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const { wallets, wallet, connected, connecting, select, connect } = useWallet()
  const [pendingWalletName, setPendingWalletName] = useState<WalletName | null>(null)
  const [lastConnectedWalletName, setLastConnectedWalletName] = useState<string | null>(null)
  const requestedConnectRef = useRef(false)

  const installedWallets = useMemo(
    () => wallets.filter(({ adapter }) => adapter.readyState === WalletReadyState.Installed),
    [wallets],
  )
  const hasInstalledWallets = installedWallets.length > 0

  const walletOptions = useMemo(() => {
    let options: WalletOption[]

    if (hasInstalledWallets) {
      options = installedWallets.map(({ adapter }) => ({
        name: adapter.name,
        icon: adapter.icon,
        detected: true,
        readyState: adapter.readyState,
      }))
    } else {
      const loadableNames = new Set(
        wallets
          .filter(({ adapter }) => adapter.readyState === WalletReadyState.Loadable)
          .map(({ adapter }) => adapter.name),
      )
      const loadableOptions: WalletOption[] = wallets
        .filter(({ adapter }) => adapter.readyState === WalletReadyState.Loadable)
        .map(({ adapter }) => ({
          name: adapter.name,
          icon: adapter.icon,
          detected: true,
          readyState: adapter.readyState,
        }))
      const fallbackOptions = recommendedWallets.filter((w) => !loadableNames.has(w.name))
      options = [...loadableOptions, ...fallbackOptions]
    }

    return options
      .map((option) => ({
        ...option,
        isLastConnected: Boolean(lastConnectedWalletName && option.name === lastConnectedWalletName),
      }))
      .sort((a, b) => {
        if (a.isLastConnected === b.isLastConnected) return 0
        return a.isLastConnected ? -1 : 1
      })
  }, [installedWallets, wallets, hasInstalledWallets, lastConnectedWalletName])

  useEffect(() => {
    if (!open) {
      setPendingWalletName(null)
      requestedConnectRef.current = false
      return
    }

    try {
      setLastConnectedWalletName(window.localStorage.getItem(LAST_CONNECTED_WALLET_NAME_KEY))
    } catch {
      setLastConnectedWalletName(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !pendingWalletName) return
    if (wallet?.adapter.name !== pendingWalletName || connected || connecting || requestedConnectRef.current) {
      return
    }

    requestedConnectRef.current = true
    void (async () => {
      try {
        await connect()
      } catch {
        setPendingWalletName(null)
      } finally {
        requestedConnectRef.current = false
      }
    })()
  }, [connect, connected, connecting, open, pendingWalletName, wallet])

  useEffect(() => {
    if (!open || !connected || !wallet?.adapter.name) return

    try {
      window.localStorage.setItem(LAST_CONNECTED_WALLET_NAME_KEY, wallet.adapter.name)
      setLastConnectedWalletName(wallet.adapter.name)
    } catch {}

    setPendingWalletName(null)
    onOpenChange(false)
  }, [connected, onOpenChange, open, wallet])

  const handleWalletClick = (option: WalletOption) => {
    if (!option.detected) {
      if (option.url) {
        window.open(option.url, "_blank", "noopener,noreferrer")
      }
      return
    }

    setPendingWalletName(option.name)
    requestedConnectRef.current = false
    select(option.name)
  }

  const activeWalletName = pendingWalletName ?? wallet?.adapter.name ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,34rem)] border-border bg-background p-0">
        <div className="overflow-hidden rounded-[1.75rem]">
          <DialogHeader className="border-b border-border bg-muted/20 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-primary text-primary-foreground">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle>Connect Wallet</DialogTitle>
                <DialogDescription className="mt-1">
                  {hasInstalledWallets
                    ? "Choose a wallet to connect to the studio."
                    : "No wallet extension was detected. Choose a recommended wallet below to continue."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            {!hasInstalledWallets ? (
              <div className="flex gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>After installation, refresh the page and reopen this modal.</p>
              </div>
            ) : null}

            <div className="grid gap-2">
              {walletOptions.map((option) => {
                const isActive = activeWalletName === option.name
                const isInstalled = option.readyState === WalletReadyState.Installed
                const statusLabel = option.detected
                  ? (isInstalled ? "Installed" : "Recommended")
                  : "Install"

                return (
                  <button
                    key={option.name}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/10 hover:border-muted-foreground/40 hover:text-foreground",
                    )}
                    onClick={() => handleWalletClick(option)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg",
                          isActive ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground",
                        )}
                      >
                        {option.icon ? (
                          <img src={option.icon} alt={`${option.name} icon`} className="h-7 w-7 rounded-md" />
                        ) : (
                          <Wallet className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{option.name}</p>
                          {option.isLastConnected ? (
                            <span className="inline-flex items-center rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                              Recent
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {option.detected
                            ? "Open this wallet to approve the connection."
                            : "Open the wallet website in a new tab."}
                        </p>
                      </div>
                    </div>

                    <div className="ml-4 flex shrink-0 items-center gap-2">
                      {isActive && connecting ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{statusLabel}</span>
                      {option.detected ? (
                        isActive ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : null
                      ) : (
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
