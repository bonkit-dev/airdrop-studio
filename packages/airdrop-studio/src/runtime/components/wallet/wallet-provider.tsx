import { type ReactNode, useMemo, useState } from "react"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets"
import { WalletModalContext } from "../../hooks/use-wallet-modal"
import { WalletConnectModal } from "./wallet-connect-modal"

export function CampaignWalletProvider({
  endpoint,
  children,
}: {
  endpoint: string
  children: ReactNode
}) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  )
  const [visible, setVisible] = useState(false)

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalContext.Provider value={{ visible, setVisible }}>
          {children}
          <WalletConnectModal open={visible} onOpenChange={setVisible} />
        </WalletModalContext.Provider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
