"use client"

import { type ReactNode, useState } from "react"
import { WalletConnectModal } from "../components/studio/wallet-connect-modal"
import { WalletModalContext } from "../hooks/use-wallet-modal"

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)

  return (
    <WalletModalContext.Provider value={{ visible, setVisible }}>
      {children}
      <WalletConnectModal open={visible} onOpenChange={setVisible} />
    </WalletModalContext.Provider>
  )
}
