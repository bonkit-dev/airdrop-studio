import { useWallet } from "@solana/wallet-adapter-react"
import { useCallback, useState } from "react"
import { useWalletModal } from "../../hooks/use-wallet-modal"
import { useSolBalance } from "../../hooks/use-sol-balance"
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover"
import { WalletPopoverView } from "./wallet-popover-view"
import { cn } from "../../lib/utils"

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

interface WalletButtonProps {
  label: string
  className?: string
  style?: React.CSSProperties
  stretch?: boolean
}

export function WalletButton({ label, className, style, stretch }: WalletButtonProps) {
  const { publicKey, wallet, disconnect, connected } = useWallet()
  const { setVisible } = useWalletModal()
  const balance = useSolBalance()
  const [open, setOpen] = useState(false)

  const handleDisconnect = useCallback(async () => {
    setOpen(false)
    await disconnect()
  }, [disconnect])

  if (!connected || !publicKey) {
    return (
      <button
        type="button"
        className={cn(className, "cursor-pointer transition-all hover:opacity-80 active:scale-[0.98]")}
        style={style}
        onClick={() => setVisible(true)}
      >
        {label}
      </button>
    )
  }

  const address = publicKey.toBase58()
  const shortAddress = truncateAddress(address)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(className, "cursor-pointer transition-all hover:opacity-80 active:scale-[0.98]", stretch && "w-full")}
          style={style}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {shortAddress}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side={stretch ? "top" : "bottom"} className={cn("p-0", stretch && "w-[var(--radix-popover-trigger-width)]")}>
        <WalletPopoverView
          shortAddress={shortAddress}
          fullAddress={address}
          walletName={wallet?.adapter.name ?? "Wallet"}
          balance={balance.toFixed(2)}
          accentColor={style?.color as string | undefined}
          onDisconnect={handleDisconnect}
        />
      </PopoverContent>
    </Popover>
  )
}
