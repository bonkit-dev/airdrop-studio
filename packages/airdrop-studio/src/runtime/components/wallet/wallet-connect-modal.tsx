import { WalletName, WalletReadyState } from "@solana/wallet-adapter-base"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog"
import { WalletConnectView, type WalletOptionItem } from "./wallet-connect-view"

interface WalletConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const LAST_WALLET_KEY = "bonkit:last-wallet"

const recommendedWallets = [
  { name: "Phantom" as WalletName, readyState: WalletReadyState.NotDetected, url: "https://phantom.com/" },
  { name: "Solflare" as WalletName, readyState: WalletReadyState.NotDetected, url: "https://solflare.com/" },
]

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const { wallets, wallet, connected, connecting, select, connect } = useWallet()
  const [pendingWalletName, setPendingWalletName] = useState<WalletName | null>(null)
  const requestedConnectRef = useRef(false)

  const installedWallets = useMemo(
    () => wallets.filter(({ adapter }) => adapter.readyState === WalletReadyState.Installed),
    [wallets],
  )

  const walletItems = useMemo<WalletOptionItem[]>(() => {
    if (installedWallets.length > 0) {
      return installedWallets.map(({ adapter }) => ({
        name: adapter.name,
        icon: adapter.icon,
        statusLabel: "Detected",
        onClick: () => {
          setPendingWalletName(adapter.name)
          requestedConnectRef.current = false
          select(adapter.name)
        },
      }))
    }

    const loadableNames = new Set(
      wallets
        .filter(({ adapter }) => adapter.readyState === WalletReadyState.Loadable)
        .map(({ adapter }) => adapter.name),
    )
    const loadable: WalletOptionItem[] = wallets
      .filter(({ adapter }) => adapter.readyState === WalletReadyState.Loadable)
      .map(({ adapter }) => ({
        name: adapter.name,
        icon: adapter.icon,
        statusLabel: "Recommended",
        onClick: () => {
          setPendingWalletName(adapter.name)
          requestedConnectRef.current = false
          select(adapter.name)
        },
      }))
    const fallback: WalletOptionItem[] = recommendedWallets
      .filter((w) => !loadableNames.has(w.name))
      .map((w) => ({
        name: w.name,
        statusLabel: "Not installed",
        onClick: () => {
          if (w.url) window.open(w.url, "_blank", "noopener,noreferrer")
        },
      }))
    return [...loadable, ...fallback]
  }, [installedWallets, wallets, select])

  useEffect(() => {
    if (!open) {
      setPendingWalletName(null)
      requestedConnectRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (!open || !pendingWalletName) return
    if (wallet?.adapter.name !== pendingWalletName || connected || connecting || requestedConnectRef.current) return
    requestedConnectRef.current = true
    void (async () => {
      try { await connect() }
      catch { setPendingWalletName(null) }
      finally { requestedConnectRef.current = false }
    })()
  }, [connect, connected, connecting, open, pendingWalletName, wallet])

  useEffect(() => {
    if (!open || !connected || !wallet?.adapter.name) return
    try { window.localStorage.setItem(LAST_WALLET_KEY, wallet.adapter.name) } catch {}
    setPendingWalletName(null)
    onOpenChange(false)
  }, [connected, onOpenChange, open, wallet])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[340px] gap-0 p-0">
        <DialogTitle className="sr-only">Connect Wallet</DialogTitle>
        <WalletConnectView wallets={walletItems} />
      </DialogContent>
    </Dialog>
  )
}
