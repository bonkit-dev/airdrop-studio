import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { BN } from "@coral-xyz/anchor"
import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import type { AirdropStudioClient, OnchainRecipient } from "@bonkit/airdrop-sdk"
import { useQuery } from "@tanstack/react-query"
import { initAirdropClient } from "../lib/airdrop-client"
import {
  simulateAndSendTransaction,
  type SimulateAndSendResult,
} from "../lib/airdrop-transactions"

type EligibilityStatus =
  | "idle"
  | "checking"
  | "eligible"
  | "not-eligible"
  | "already-claimed"
  | "error"
type ClaimStatus = "idle" | "signing" | "confirming" | "success" | "error"

type Allocation = {
  entryIndex: number
  amount: BN
  claimed: boolean
}

type AirdropConfig = {
  airdropAddress: string
  mintAddress: string
  claimMode: "onchain" | "merkle"
  networkCluster: "devnet" | "mainnet-beta"
}

export function useAirdrop(config: AirdropConfig) {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const [eligibility, setEligibility] = useState<EligibilityStatus>("idle")
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle")
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clientRef = useRef<AirdropStudioClient | null>(null)

  const airdropKey = useMemo(() => {
    try {
      return new PublicKey(config.airdropAddress)
    } catch {
      return null
    }
  }, [config.airdropAddress])

  const mintKey = useMemo(() => {
    try {
      return new PublicKey(config.mintAddress)
    } catch {
      return null
    }
  }, [config.mintAddress])

  // SDK init + airdrop account fetch (cached, stale after 10s)
  const { data: airdropData, status: queryStatus, error: queryError } = useQuery({
    queryKey: ["airdrop-init", config.airdropAddress, config.networkCluster],
    queryFn: async () => {
      if (!airdropKey) throw new Error("Invalid airdrop address.")
      const client = await initAirdropClient(connection, config.networkCluster)
      clientRef.current = client
      const account = await client.program.account.onchainListAirdrop.fetch(airdropKey)
      const base = (account as { base: { totalAmount: BN; claimedAmount: BN } }).base
      return {
        client,
        account,
        totalAmount: base.totalAmount,
        claimedAmount: base.claimedAmount,
      }
    },
    enabled: !!airdropKey,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  // Token decimals (cached, rarely changes)
  const { data: tokenDecimals = null } = useQuery({
    queryKey: ["token-decimals", config.mintAddress],
    queryFn: async () => {
      if (!mintKey) return null
      const mintAccount = await connection.getAccountInfo(mintKey)
      if (!mintAccount) return null
      const programId = mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)
        ? TOKEN_2022_PROGRAM_ID
        : TOKEN_PROGRAM_ID
      const mintInfo = await getMint(connection, mintKey, undefined, programId)
      return mintInfo.decimals
    },
    enabled: !!mintKey,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const status = queryStatus === "pending" ? "loading" as const
    : queryStatus === "error" ? "error" as const
    : "ready" as const

  // Keep clientRef in sync
  useEffect(() => {
    if (airdropData?.client) {
      clientRef.current = airdropData.client
    }
  }, [airdropData])

  const claimableTotal = useMemo(
    () =>
      allocations.reduce(
        (acc, a) => (a.claimed ? acc : acc.add(a.amount)),
        new BN(0),
      ),
    [allocations],
  )

  const selectAllocation = useCallback((index: number | null) => {
    setSelectedIndex(index)
  }, [])

  // Reset eligibility when wallet changes
  useEffect(() => {
    setEligibility("idle")
    setAllocations([])
    setSelectedIndex(null)
    setClaimStatus("idle")
    setLastTxSignature(null)
    setError(null)
  }, [publicKey])

  const resolveTokenProgramId = useCallback(
    async (mint: PublicKey) => {
      const mintAccount = await connection.getAccountInfo(mint)
      if (!mintAccount) throw new Error("Unable to resolve token program.")
      if (mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID))
        return TOKEN_2022_PROGRAM_ID
      if (mintAccount.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID
      throw new Error("Unsupported token program.")
    },
    [connection],
  )

  const checkEligibility = useCallback(async () => {
    const client = clientRef.current
    if (!client || !airdropKey || !publicKey) return

    setEligibility("checking")
    setError(null)

    try {
      const allRecipients = await client.listOnchainRecipients({ airdrop: airdropKey })

      const recipients = allRecipients
        .map((r: OnchainRecipient, i: number) => ({ ...r, entryIndex: i }))
        .filter((r: OnchainRecipient & { entryIndex: number }) => r.wallet.equals(publicKey))

      const allocs: Allocation[] = recipients.map((r) => ({
        entryIndex: r.entryIndex,
        amount: r.amount,
        claimed: r.claimed,
      }))

      setAllocations(allocs)

      if (allocs.length === 0) {
        setEligibility("not-eligible")
      } else if (allocs.every((a) => a.claimed)) {
        setEligibility("already-claimed")
      } else {
        setEligibility("eligible")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to check eligibility.",
      )
      setEligibility("error")
    }
  }, [airdropKey, publicKey])

  const claim = useCallback(
    async (entryIndex: number) => {
      const client = clientRef.current
      if (!client || !airdropKey || !mintKey || !publicKey) return

      const alloc = allocations.find((a) => a.entryIndex === entryIndex)
      if (!alloc || alloc.claimed) return

      setClaimStatus("signing")
      setError(null)

      try {
        const tokenProgramId = await resolveTokenProgramId(mintKey)

        const claimTx = await client.claimOnchainTokens({
          params: {
            entryIndex: alloc.entryIndex,
            amount: alloc.amount,
          },
          accounts: {
            airdrop: airdropKey,
            claimer: publicKey,
            mint: mintKey,
            tokenProgram: tokenProgramId,
          },
          payer: publicKey,
        })

        setClaimStatus("confirming")

        const result: SimulateAndSendResult =
          await simulateAndSendTransaction({
            connection,
            transaction: claimTx,
            sendTransaction,
            onSignature: (sig) => {
              setLastTxSignature(sig)
              setClaimStatus("confirming")
            },
          })

        if (result.status === "simulation-error") {
          const err = result.error
          const msg = err.source === "anchor"
            ? (err.anchorError?.error?.errorMessage ?? err.anchorError?.message ?? "Transaction failed.")
            : (err.error?.message ?? "Transaction simulation failed.")
          setError(msg)
          setClaimStatus("idle")
          return
        }

        setLastTxSignature(result.signature)
        setClaimStatus("success")

        setAllocations((prev) => {
          const next = prev.map((a) =>
            a.entryIndex === entryIndex ? { ...a, claimed: true } : a,
          )
          const hasUnclaimed = next.some((a) => !a.claimed)
          setEligibility(hasUnclaimed ? "eligible" : "already-claimed")
          return next
        })
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to claim tokens.",
        )
        setClaimStatus("idle")
      }
    },
    [
      airdropKey,
      mintKey,
      publicKey,
      allocations,
      connection,
      sendTransaction,
      resolveTokenProgramId,
    ],
  )

  const totalAmount = airdropData?.totalAmount ?? new BN(0)
  const claimedAmount = airdropData?.claimedAmount ?? new BN(0)
  const claimedPercent = totalAmount.isZero()
    ? 0
    : Math.round(claimedAmount.muln(100).div(totalAmount).toNumber())

  return {
    status,
    eligibility,
    allocations,
    claimableTotal,
    tokenDecimals,
    selectedIndex,
    selectAllocation,
    totalClaimedAmount: claimedAmount,
    totalAmount,
    claimedPercent,
    checkEligibility,
    claim,
    claimStatus,
    lastTxSignature,
    networkCluster: config.networkCluster,
    error: error ?? (queryError instanceof Error ? queryError.message : null),
  }
}
