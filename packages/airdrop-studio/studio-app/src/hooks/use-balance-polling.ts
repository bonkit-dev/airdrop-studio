"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PublicKey, type Connection } from "@solana/web3.js"
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { formatTokenAmount, type MintProbeState } from "../lib/airdrop-utils"

export type TokenBalance = {
  amount: string
  raw: string
  decimals: number
} | null

const BALANCE_COOLDOWN_MS = 10_000
const POST_DEPOSIT_POLL_DELAYS = [1000, 2000, 4000]

export function useBalancePolling(
  connection: Connection,
  publicKey: PublicKey | null,
  mintAddress: string,
  airdropAddress: string | null,
  mintProbe: MintProbeState,
) {
  const [walletTokenBalance, setWalletTokenBalance] = useState<TokenBalance>(null)
  const [isWalletBalanceLoading, setIsWalletBalanceLoading] = useState(false)
  const [vaultBalance, setVaultBalance] = useState<TokenBalance>(null)
  const [isVaultBalanceLoading, setIsVaultBalanceLoading] = useState(false)
  const walletBalanceLastFetchRef = useRef(0)
  const vaultBalanceLastFetchRef = useRef(0)

  const getTokenProgram = () =>
    mintProbe.status === "success" && mintProbe.programLabel === "Token-2022"
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID

  const loadWalletTokenBalance = useCallback(
    async (force = false) => {
      if (!publicKey || !mintAddress.trim() || mintProbe.status !== "success") return
      const now = Date.now()
      if (!force && now - walletBalanceLastFetchRef.current < BALANCE_COOLDOWN_MS) return

      setIsWalletBalanceLoading(true)
      try {
        const mint = new PublicKey(mintAddress.trim())
        const tokenProgram = getTokenProgram()
        const walletATA = getAssociatedTokenAddressSync(mint, publicKey, false, tokenProgram)
        const accountInfo = await connection.getAccountInfo(walletATA)
        if (!accountInfo) {
          setWalletTokenBalance({ amount: "0", raw: "0", decimals: mintProbe.decimals })
        } else {
          const balanceResult = await connection.getTokenAccountBalance(walletATA)
          setWalletTokenBalance({
            amount:
              balanceResult.value.uiAmountString ?? formatTokenAmount(balanceResult.value.amount, mintProbe.decimals),
            raw: balanceResult.value.amount,
            decimals: mintProbe.decimals,
          })
        }
        walletBalanceLastFetchRef.current = Date.now()
      } catch {
        // silent
      } finally {
        setIsWalletBalanceLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTokenProgram is inline, decimals covered by status, publicKey tracked via toBase58()
    [publicKey?.toBase58(), mintAddress, mintProbe.status, connection],
  )

  const loadVaultBalance = useCallback(
    async (force = false) => {
      if (!airdropAddress || !mintAddress.trim() || mintProbe.status !== "success") return
      const now = Date.now()
      if (!force && now - vaultBalanceLastFetchRef.current < BALANCE_COOLDOWN_MS) return

      setIsVaultBalanceLoading(true)
      try {
        const mint = new PublicKey(mintAddress.trim())
        const airdropPDA = new PublicKey(airdropAddress)
        const tokenProgram = getTokenProgram()
        const vaultATA = getAssociatedTokenAddressSync(mint, airdropPDA, true, tokenProgram)
        const accountInfo = await connection.getAccountInfo(vaultATA)
        if (!accountInfo) {
          setVaultBalance({ amount: "0", raw: "0", decimals: mintProbe.decimals })
        } else {
          const balanceResult = await connection.getTokenAccountBalance(vaultATA)
          setVaultBalance({
            amount:
              balanceResult.value.uiAmountString ?? formatTokenAmount(balanceResult.value.amount, mintProbe.decimals),
            raw: balanceResult.value.amount,
            decimals: mintProbe.decimals,
          })
        }
        vaultBalanceLastFetchRef.current = Date.now()
      } catch {
        // silent
      } finally {
        setIsVaultBalanceLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- same rationale as loadWalletTokenBalance above
    [airdropAddress, mintAddress, mintProbe.status, connection],
  )

  const pollVaultAfterDeposit = useCallback(() => {
    void (async () => {
      for (const delay of POST_DEPOSIT_POLL_DELAYS) {
        await new Promise((r) => setTimeout(r, delay))
        await loadVaultBalance(true)
      }
    })()
    void loadWalletTokenBalance(true)
  }, [loadVaultBalance, loadWalletTokenBalance])

  useEffect(() => {
    void loadWalletTokenBalance()
  }, [loadWalletTokenBalance])

  useEffect(() => {
    void loadVaultBalance()
  }, [loadVaultBalance])

  return {
    walletTokenBalance,
    isWalletBalanceLoading,
    vaultBalance,
    isVaultBalanceLoading,
    pollVaultAfterDeposit,
  }
}
