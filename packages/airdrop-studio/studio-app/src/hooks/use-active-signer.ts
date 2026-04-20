import { useWallet } from "@solana/wallet-adapter-react"
import type { SendTransactionOptions } from "@solana/wallet-adapter-base"
import type { Connection, VersionedTransaction } from "@solana/web3.js"
import { PublicKey } from "@solana/web3.js"
import { useMemo } from "react"

import { useStudioStore } from "../lib/studio-store"
import { signAndSendViaServer } from "../lib/signer-client"

export type ActiveSignerSendTransaction = (
  transaction: VersionedTransaction,
  connection: Connection,
  options?: SendTransactionOptions,
) => Promise<string>

export type ActiveSigner = {
  mode: "extension" | "keypair"
  publicKey: PublicKey | null
  ready: boolean
  label: string
  sendTransaction: ActiveSignerSendTransaction
}

export function useActiveSigner(): ActiveSigner {
  const signerMode = useStudioStore((state) => state.signerMode)
  const keypairSession = useStudioStore((state) => state.keypairSession)
  const { publicKey: extensionPublicKey, sendTransaction: extensionSend } = useWallet()

  const keypairPublicKey = useMemo(() => {
    if (signerMode !== "keypair") return null
    if (!keypairSession.publicKey) return null
    try {
      return new PublicKey(keypairSession.publicKey)
    } catch {
      return null
    }
  }, [signerMode, keypairSession.publicKey])

  return useMemo<ActiveSigner>(() => {
    if (signerMode === "keypair") {
      return {
        mode: "keypair",
        publicKey: keypairPublicKey,
        ready: keypairSession.status === "unlocked" && keypairPublicKey !== null,
        label: "Local Keypair",
        sendTransaction: async (transaction, connection) => {
          const serialized = transaction.serialize()
          return signAndSendViaServer(serialized)
        },
      }
    }

    return {
      mode: "extension",
      publicKey: extensionPublicKey ?? null,
      ready: Boolean(extensionPublicKey),
      label: "Wallet Extension",
      sendTransaction: extensionSend,
    }
  }, [signerMode, keypairPublicKey, keypairSession.status, extensionPublicKey, extensionSend])
}
