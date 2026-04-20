import { createContext, useContext } from "react"
import type { useAirdrop } from "./use-airdrop"

export type AirdropContextValue = ReturnType<typeof useAirdrop>

export const AirdropContext = createContext<AirdropContextValue | null>(null)

export function useAirdropContext(): AirdropContextValue | null {
  return useContext(AirdropContext)
}
