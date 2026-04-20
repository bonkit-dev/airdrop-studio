"use client"

import { useEffect, useRef, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import type { Connection } from "@solana/web3.js"
import {
  getEpochFee,
  getTokenMetadata,
  getTransferFeeConfig,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  unpackMint,
} from "@solana/spl-token"
import {
  fetchLegacyMetaplexMetadataAccount,
  fetchTokenMetadataJson,
  isLikelySolanaAddress,
  normalizeTokenLabel,
  shortenAddress,
  type MintProbeState,
} from "../lib/airdrop-utils"

export function useMintProbe(
  mintAddress: string,
  connection: Connection,
  currentTokenName: string,
  currentTokenSymbol: string,
  onTokenNameDetected: (name: string) => void,
  onTokenSymbolDetected: (symbol: string) => void,
) {
  const [mintProbe, setMintProbe] = useState<MintProbeState>({ status: "idle" })
  const previousMintRef = useRef(mintAddress.trim())

  useEffect(() => {
    const trimmed = mintAddress.trim()

    if (trimmed !== previousMintRef.current) {
      previousMintRef.current = trimmed
      if (currentTokenName) onTokenNameDetected("")
      if (currentTokenSymbol) onTokenSymbolDetected("")
    }

    const normalizedCurrentTokenName = currentTokenName.trim()
    const normalizedCurrentTokenSymbol = currentTokenSymbol.trim()

    if (!trimmed) {
      setMintProbe({ status: "idle" })
      return
    }

    if (!isLikelySolanaAddress(trimmed)) {
      setMintProbe({ status: "invalid", message: "Invalid mint address format." })
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        setMintProbe({ status: "loading" })
        const mint = new PublicKey(trimmed)
        const accountInfo = await connection.getAccountInfo(mint)
        if (!accountInfo) {
          setMintProbe({ status: "error", message: "Mint account not found on the selected RPC." })
          return
        }

        let tokenProgramId: PublicKey
        let programLabel: "Token" | "Token-2022"
        if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
          tokenProgramId = TOKEN_2022_PROGRAM_ID
          programLabel = "Token-2022"
        } else if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
          tokenProgramId = TOKEN_PROGRAM_ID
          programLabel = "Token"
        } else {
          setMintProbe({ status: "error", message: "This account is not owned by Token or Token-2022." })
          return
        }

        const mintInfo = unpackMint(mint, accountInfo, tokenProgramId)
        if (!mintInfo.isInitialized) {
          setMintProbe({ status: "error", message: "Mint exists but is not initialized." })
          return
        }

        const legacyMetaplex =
          programLabel === "Token" ? await fetchLegacyMetaplexMetadataAccount(connection, mint) : null
        const token2022Metadata =
          programLabel === "Token-2022"
            ? await getTokenMetadata(connection, mint, undefined, TOKEN_2022_PROGRAM_ID).catch(() => null)
            : null
        const metadataUri = legacyMetaplex?.uri ?? token2022Metadata?.uri ?? null
        const metadataJson = await fetchTokenMetadataJson(metadataUri)
        const fallbackLabel = shortenAddress(trimmed)
        const tokenName = normalizeTokenLabel(
          metadataJson?.name ?? legacyMetaplex?.name ?? token2022Metadata?.name ?? null,
          fallbackLabel,
        )
        const tokenSymbol = normalizeTokenLabel(
          metadataJson?.symbol ?? legacyMetaplex?.symbol ?? token2022Metadata?.symbol ?? null,
          fallbackLabel,
        )

        let transferFee: { basisPoints: number; maxFee: string } | null = null
        if (programLabel === "Token-2022") {
          try {
            const feeConfig = getTransferFeeConfig(mintInfo)
            if (feeConfig) {
              const epochInfo = await connection.getEpochInfo()
              const epochFee = getEpochFee(feeConfig, BigInt(epochInfo.epoch))
              if (epochFee.transferFeeBasisPoints > 0) {
                transferFee = {
                  basisPoints: epochFee.transferFeeBasisPoints,
                  maxFee: epochFee.maximumFee.toString(),
                }
              }
            }
          } catch {
            // Transfer fee extraction is best-effort
          }
        }

        if (!normalizedCurrentTokenName && tokenName) {
          onTokenNameDetected(tokenName)
        }
        if (!normalizedCurrentTokenSymbol && tokenSymbol) {
          onTokenSymbolDetected(tokenSymbol)
        }
        setMintProbe({
          status: "success",
          programLabel,
          decimals: mintInfo.decimals,
          owner: accountInfo.owner.toBase58(),
          name: tokenName,
          symbol: tokenSymbol,
          imageUrl: metadataJson?.image ?? null,
          metadataUri,
          transferFee,
        })
      } catch (error) {
        if (controller.signal.aborted) return
        setMintProbe({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to inspect the mint.",
        })
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- callbacks are unstable refs, currentToken* read only on mint change to clear stale values
  }, [mintAddress, connection])

  return mintProbe
}
