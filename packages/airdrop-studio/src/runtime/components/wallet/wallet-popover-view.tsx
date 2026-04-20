import { Copy, Check, LogOut, Wallet } from "lucide-react"
import { useCallback, useState } from "react"

export type WalletPopoverViewProps = {
  shortAddress: string
  fullAddress: string
  walletName: string
  balance: string
  accentColor?: string
  onDisconnect: () => void
}

export function WalletPopoverView({
  shortAddress,
  fullAddress,
  walletName,
  balance,
  accentColor,
  onDisconnect,
}: WalletPopoverViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [fullAddress])

  return (
    <>
      {/* Wallet identity */}
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: "1px solid var(--campaign-border)" }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: `${accentColor ?? "var(--campaign-foreground)"}18`,
          }}
        >
          <Wallet
            className="h-[18px] w-[18px]"
            style={{ color: accentColor ?? "var(--campaign-foreground)" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--campaign-foreground)]">
            {shortAddress}
          </p>
          <p className="text-[11px] text-[var(--campaign-muted-foreground)]">
            {walletName}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-8 w-8 shrink-0 items-center justify-center transition-colors"
          style={{
            borderRadius: "var(--campaign-radius-sm)",
            color: "var(--campaign-muted-foreground)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--campaign-input-hover)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Balance */}
      <div
        className="px-4 py-3.5"
        style={{ borderBottom: "1px solid var(--campaign-border)" }}
      >
        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--campaign-muted-foreground)]">
          Balance
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-[var(--campaign-foreground)]">
            {balance}
          </span>
          <span className="text-xs font-medium text-[var(--campaign-muted-foreground)]">
            SOL
          </span>
        </div>
      </div>

      {/* Disconnect */}
      <div className="p-1.5">
        <button
          type="button"
          onClick={onDisconnect}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors"
          style={{
            borderRadius: "var(--campaign-radius-md)",
            color: "#ef4444",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </>
  )
}
