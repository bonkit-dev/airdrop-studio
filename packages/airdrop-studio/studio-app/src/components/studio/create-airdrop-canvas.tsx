"use client"

import { BN } from "@coral-xyz/anchor"
import { AirdropStudioClient, type CreateOnchainAirdropParams } from "@bonkit/airdrop-sdk"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Play,
  RefreshCw,
  Rocket,
  Users,
  Coins,
} from "lucide-react"
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { PublicKey } from "@solana/web3.js"
import { initAirdropStudioClient } from "../../lib/airdrop-client"
import { estimateTransferFeeForNetAmount, type TransferFeeEstimate } from "../../lib/airdrop-transfer-fee"
import {
  RECIPIENTS_PER_APPEND,
  type OnchainAppendBatchDraft,
  type OnchainAppendChunk,
} from "../../lib/airdrop-batch-types"
import {
  clearBatchDraft,
  clearCompletedBatches,
  createBatchId,
  loadBatchDraft,
  loadCompletedBatches,
  saveBatchDraft,
  saveCompletedBatch,
} from "../../lib/airdrop-batch-storage"
import { getProgramErrorMessage, simulateAndSendAirdropTransaction } from "../../lib/airdrop-transactions"
import {
  buildExplorerUrl,
  chunkRecipients,
  compactAddress,
  decimalAmountToBn,
  decimalAmountToRawUnits,
  formatTokenAmount,
  getDraftScheduleErrors,
  isLikelySolanaAddress,
  isUserRejectedError,
  parseDateToBn,
  shortenAddress,
} from "../../lib/airdrop-utils"
import { useStudioStore, type AirdropStep } from "../../lib/studio-store"
import { cn } from "../../lib/utils"
import { useBalancePolling } from "../../hooks/use-balance-polling"
import { useMintProbe } from "../../hooks/use-mint-probe"
import { useWalletModal } from "../../hooks/use-wallet-modal"
import { toast } from "../../hooks/use-toast"
import { AirdropAppendProgressOverlay } from "./airdrop/airdrop-append-progress-overlay"
import { AirdropStepDraft } from "./airdrop/airdrop-step-draft"
import { useRpcClusterCheck } from "../../hooks/use-rpc-cluster-check"
import { useActiveSigner } from "../../hooks/use-active-signer"
import { SignerModePanel } from "./signer/signer-mode-panel"
import { reconcileBatchDraft } from "../../lib/airdrop-batch-recovery"
import {
  deriveRegisteredAllocation,
  deriveRegisteredRecipientCount,
  deriveTotalAllocationRaw,
} from "../../lib/airdrop-allocation"
import { AirdropStepRecipients } from "./airdrop/airdrop-step-recipients"
import { AirdropStepDeposit } from "./airdrop/airdrop-step-deposit"
import { AirdropDepositConfirmDialog } from "./airdrop/airdrop-deposit-confirm-dialog"
import { AirdropResetDialog } from "./airdrop/airdrop-reset-dialog"
import { AirdropStepStart } from "./airdrop/airdrop-step-start"
import { AirdropStepComplete } from "./airdrop/airdrop-step-complete"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

const visibleSteps: Array<{
  id: Exclude<AirdropStep, "complete">
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: "draft", label: "Draft", description: "Select network, claim type, and token config.", icon: Rocket },
  {
    id: "recipients",
    label: "Recipients",
    description: "Add wallets with CSV upload, paste, or quick input.",
    icon: Users,
  },
  {
    id: "deposit",
    label: "Deposit",
    description: "Review the deposit amount and generated recipient set.",
    icon: Coins,
  },
  { id: "start", label: "Start", description: "Confirm the launch checklist for the exported app.", icon: Play },
]

export function CreateAirdropCanvas() {
  const {
    config,
    airdrop,
    updateAirdrop,
    resetAirdrop,
    saveConfig,
    pushLog,
    completedBatches,
    setCompletedBatches,
    pushCompletedBatch,
  } = useStudioStore()
  const { connection } = useConnection()
  const {
    wallet,
    connecting,
    disconnect,
    connected: extensionConnected,
    publicKey: extensionPublicKey,
  } = useWallet()
  const activeSigner = useActiveSigner()
  const publicKey = activeSigner.publicKey
  const sendTransaction = activeSigner.sendTransaction
  const connected = activeSigner.ready
  const extensionWalletAddress = extensionPublicKey?.toBase58() ?? null
  const { setVisible: setWalletModalVisible } = useWalletModal()
  const mintProbe = useMintProbe(
    airdrop.mintAddress,
    connection,
    airdrop.tokenName,
    airdrop.tokenSymbol,
    (name) => updateAirdrop("tokenName", name),
    (symbol) => updateAirdrop("tokenSymbol", symbol),
  )
  const [studioClient, setStudioClient] = useState<AirdropStudioClient | null>(null)
  const [clientReady, setClientReady] = useState(false)
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false)
  const [isAppendingRecipients, setIsAppendingRecipients] = useState(false)
  const [onchainAppendBatchDraft, setOnchainAppendBatchDraft] = useState<OnchainAppendBatchDraft | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const {
    walletTokenBalance,
    isWalletBalanceLoading,
    vaultBalance,
    isVaultBalanceLoading,
    pollVaultAfterDeposit,
  } = useBalancePolling(connection, publicKey, airdrop.mintAddress, airdrop.airdropAddress, mintProbe)
  const [isDepositConfirmOpen, setIsDepositConfirmOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  useEffect(() => {
    if (!isAppendingRecipients) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isAppendingRecipients])

  const prevAirdropAddressRef = useRef(airdrop.airdropAddress)

  useEffect(() => {
    const prev = prevAirdropAddressRef.current
    prevAirdropAddressRef.current = airdrop.airdropAddress
    if (prev && !airdrop.airdropAddress) {
      handleDeleteCompletedHistory()
      handleDiscardBatch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup handlers are stable refs, trigger only on address clear
  }, [airdrop.airdropAddress])

  const previousConnectedRef = useRef(false)

  const isAirdropLive = Boolean(airdrop.startSignature)
  const activeStep = isAirdropLive && airdrop.currentStep === "complete" ? "start" : airdrop.currentStep
  const currentStep = activeStep
  const currentIndex = visibleSteps.findIndex((step) => step.id === currentStep)
  const currentStepMeta = visibleSteps[Math.max(currentIndex, 0)]
  // Pending recipients — the memory-only input list the user is currently editing. Cleared
  // when Register Recipients starts a batch (chunks become the source of truth from then on).
  const pendingRecipientsCount = airdrop.recipients.length
  // Registered recipients — confirmed on-chain via completed append batches. This is what
  // deposit / start checklists should gate on, not the transient pending list.
  const registeredRecipientsCount = deriveRegisteredRecipientCount(completedBatches)
  const walletAddress = publicKey?.toBase58() ?? null
  const uniquePendingRecipientsCount = useMemo(
    () => new Set(airdrop.recipients.map((recipient) => recipient.address)).size,
    [airdrop.recipients],
  )
  const rpcCheck = useRpcClusterCheck(config.network, config.rpcUrl)
  const setRpcCheckStatus = useStudioStore((s) => s.setRpcCheckStatus)
  useEffect(() => {
    setRpcCheckStatus(rpcCheck.status)
  }, [rpcCheck.status, setRpcCheckStatus])
  const draftReady = Boolean(
    config.rpcUrl &&
    config.network &&
    config.claimMode &&
    airdrop.mintAddress &&
    airdrop.tokenSymbol &&
    mintProbe.status === "success" &&
    rpcCheck.status === "ok",
  )
  const scheduleState = useMemo(
    () => getDraftScheduleErrors(airdrop.startDate, airdrop.endDate),
    [airdrop.startDate, airdrop.endDate],
  )

  const isStepComplete = (stepId: string) =>
    stepId === "draft"
      ? Boolean(airdrop.airdropAddress && airdrop.draftSignature)
      : stepId === "recipients"
        ? Boolean(airdrop.recipientsSignature)
        : stepId === "deposit"
          ? Boolean(airdrop.depositSignature)
          : Boolean(airdrop.startSignature)

  const isWrongWallet = Boolean(airdrop.creatorWallet && walletAddress && airdrop.creatorWallet !== walletAddress)

  const canAdvance =
    currentStep === "draft"
      ? Boolean(airdrop.airdropAddress && airdrop.draftSignature)
      : currentStep === "recipients"
        ? Boolean(airdrop.recipientsSignature)
        : currentStep === "deposit"
          ? Boolean(airdrop.depositSignature)
          : Boolean(airdrop.startSignature)
  const canCreateDraft =
    draftReady &&
    !scheduleState.startError &&
    !scheduleState.endError &&
    mintProbe.status === "success" &&
    Boolean(studioClient) &&
    Boolean(publicKey) &&
    !airdrop.airdropAddress &&
    !isSubmittingDraft

  const registeredAllocation = useMemo(
    () => deriveRegisteredAllocation(completedBatches),
    [completedBatches],
  )
  const requiredDepositRaw = useMemo(() => {
    if (mintProbe.status !== "success") return "0"
    // Deposit is validated against the on-chain registered recipients only.
    const totalAmount = deriveTotalAllocationRaw(completedBatches)
    const units = decimalAmountToRawUnits(totalAmount, mintProbe.decimals)
    if (!units || units.raw === "0") return "0"
    return units.raw
  }, [completedBatches, mintProbe])

  const transferFeeEstimate = useMemo<TransferFeeEstimate | null>(() => {
    if (mintProbe.status !== "success" || !mintProbe.transferFee) return null
    const { basisPoints, maxFee } = mintProbe.transferFee
    if (basisPoints <= 0) return null
    const netAmount = new BN(requiredDepositRaw)
    if (netAmount.lte(new BN(0))) return null
    const estimate = estimateTransferFeeForNetAmount({
      netAmount,
      basisPoints,
      maxFee: new BN(maxFee),
    })
    if (estimate.feeAmount.isZero()) return null
    return estimate
  }, [mintProbe, requiredDepositRaw])

  const effectiveDepositRaw = transferFeeEstimate ? transferFeeEstimate.grossAmount.toString() : requiredDepositRaw

  const isWalletBalanceCheckPending = walletTokenBalance === null || isWalletBalanceLoading
  const isBalanceInsufficient = useMemo(() => {
    if (isWalletBalanceCheckPending) return false
    if (!walletTokenBalance?.raw) return false
    try {
      const required = new BN(effectiveDepositRaw)
      if (required.lte(new BN(0))) return false
      const available = new BN(walletTokenBalance.raw)
      return available.lt(required)
    } catch {
      return false
    }
  }, [isWalletBalanceCheckPending, effectiveDepositRaw, walletTokenBalance?.raw])

  const depositBlockedMessage = useMemo(() => {
    if (!airdrop.airdropAddress || !airdrop.recipientsSignature) return null
    if (isWalletBalanceCheckPending) return "Checking wallet balance..."
    if (isBalanceInsufficient) {
      const needed = transferFeeEstimate
        ? formatTokenAmount(effectiveDepositRaw, mintProbe.status === "success" ? mintProbe.decimals : 0)
        : registeredAllocation
      return `Insufficient balance. You have ${walletTokenBalance?.amount ?? "0"} ${airdrop.tokenSymbol}, need ${needed} ${airdrop.tokenSymbol}${transferFeeEstimate ? " (incl. transfer fee)" : ""}.`
    }
    return null
  }, [
    airdrop.airdropAddress,
    airdrop.recipientsSignature,
    isWalletBalanceCheckPending,
    isBalanceInsufficient,
    walletTokenBalance?.amount,
    airdrop.tokenSymbol,
    registeredAllocation,
    transferFeeEstimate,
    effectiveDepositRaw,
    mintProbe,
  ])

  const canDepositTokens =
    Boolean(airdrop.airdropAddress) &&
    Boolean(airdrop.recipientsSignature) &&
    Boolean(publicKey) &&
    Boolean(studioClient) &&
    mintProbe.status === "success" &&
    !isDepositing &&
    !isWalletBalanceCheckPending &&
    !isBalanceInsufficient &&
    !isWrongWallet
  const canStartAirdrop =
    Boolean(airdrop.airdropAddress) &&
    Boolean(airdrop.depositSignature) &&
    Boolean(publicKey) &&
    Boolean(studioClient) &&
    !scheduleState.startError &&
    !scheduleState.endError &&
    !isStarting &&
    !isWrongWallet
  const walletBusy = connecting || isSubmittingDraft || isAppendingRecipients || isCanceling || isDepositing || isStarting

  const handleBack = () => {
    if (currentIndex <= 0) return
    updateAirdrop("currentStep", visibleSteps[currentIndex - 1].id)
  }

  const handleNext = () => {
    if (!canAdvance) return
    if (isAirdropLive) return
    if (currentIndex >= visibleSteps.length - 1) {
      updateAirdrop("currentStep", "complete")
      return
    }
    updateAirdrop("currentStep", visibleSteps[currentIndex + 1].id)
  }

  const handleDisconnectWallet = async () => {
    try {
      await disconnect()
    } catch {}
  }

  const handleOpenWalletModal = () => {
    setWalletModalVisible(true)
  }

  const handleCreateDraft = async () => {
    if (!publicKey || !walletAddress) {
      toast({
        title: "Wallet required",
        description: "Connect a wallet before creating the airdrop draft.",
        variant: "destructive",
      })
      return
    }
    if (!studioClient) {
      toast({
        title: "Client not ready",
        description: "Airdrop SDK client is still initializing. Try again in a moment.",
        variant: "destructive",
      })
      return
    }
    if (!airdrop.mintAddress.trim()) {
      toast({
        title: "Token mint required",
        description: "Enter a valid mint address before creating the draft.",
        variant: "destructive",
      })
      return
    }

    let creator: PublicKey
    let mint: PublicKey
    try {
      creator = publicKey
      mint = new PublicKey(airdrop.mintAddress.trim())
    } catch {
      toast({
        title: "Invalid address",
        description: "Wallet or token mint address is invalid.",
        variant: "destructive",
      })
      return
    }

    const startsAt = parseDateToBn(airdrop.startDate)
    const endsAt = parseDateToBn(airdrop.endDate)
    if (startsAt && endsAt && endsAt.lte(startsAt)) {
      toast({
        title: "Invalid schedule",
        description: "End date must be later than the start date.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmittingDraft(true)
      toast({
        title: "Awaiting wallet signature",
        description: "Approve the airdrop draft transaction in your wallet.",
      })

      const registryPda = studioClient.pdas.draftRegistry(creator)
      let draftIndex = 0
      try {
        const registry = await studioClient.program.account.draftRegistry.fetch(registryPda)
        draftIndex = Number((registry as { totalCount: number }).totalCount ?? 0)
      } catch {}

      const createParams: CreateOnchainAirdropParams = {
        draftIndex,
        startsAt,
        endsAt,
      }
      const tokenProgram =
        mintProbe.status === "success" && mintProbe.programLabel === "Token-2022"
          ? TOKEN_2022_PROGRAM_ID
          : TOKEN_PROGRAM_ID
      const createTransaction = await studioClient.createOnchainAirdrop({
        params: createParams,
        accounts: {
          creator,
          mint,
          tokenProgram,
        },
        payer: creator,
      })

      const executionResult = await simulateAndSendAirdropTransaction({
        connection: studioClient.connection,
        transaction: createTransaction,
        sendTransaction,
        onBeforeSend: () => {
          toast({
            title: "Processing transaction",
            description: "Submitting the draft creation transaction on-chain.",
            variant: "processing",
          })
        },
      })

      if (executionResult.status === "simulation-error") {
        toast({
          title: "Draft creation failed",
          description: getProgramErrorMessage(executionResult.error),
          variant: "destructive",
        })
        return
      }

      const airdropAddress = studioClient.pdas.airdrop(creator, draftIndex).toBase58()
      const explorerUrl = buildExplorerUrl(executionResult.signature, config.network)
      updateAirdrop("airdropAddress", airdropAddress)
      updateAirdrop("creatorWallet", walletAddress)
      updateAirdrop("draftSignature", executionResult.signature)
      updateAirdrop("currentStep", "recipients")
      // Auto-save after successful on-chain transaction
      await saveConfig().catch(() => {})

      pushLog({ type: "transaction", title: "Draft created", detail: compactAddress(airdropAddress), explorerUrl })
      toast({
        title: "Airdrop draft created",
        description: (
          <span>
            Draft created at {compactAddress(airdropAddress)}.{" "}
            <a href={explorerUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              View transaction
            </a>
          </span>
        ),
        variant: "success",
      })
    } catch (error) {
      pushLog({ type: "error", title: "Draft creation failed", detail: error instanceof Error ? error.message : undefined })
      toast({
        title: "Draft creation failed",
        description: error instanceof Error ? error.message : "Failed to create the airdrop draft.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingDraft(false)
    }
  }

  // --- Batch execution engine ---

  const executeChunk = async (
    chunk: OnchainAppendChunk,
    client: AirdropStudioClient,
    creator: PublicKey,
    airdropPubkey: PublicKey,
    decimals: number,
    onEarlySignature?: (signature: string) => void,
  ): Promise<string> => {
    const sdkRecipients = chunk.recipients.map((r) => ({
      ...(() => {
        const parsedAmount = decimalAmountToBn(r.amount, decimals)
        if (!parsedAmount || parsedAmount.amount.isZero()) {
          throw new Error(`Invalid recipient amount for ${r.wallet}`)
        }
        return { amount: parsedAmount.amount }
      })(),
      wallet: new PublicKey(r.wallet),
    }))

    const transaction = await client.appendOnchainRecipients({
      params: { recipients: sdkRecipients },
      accounts: { creator, airdrop: airdropPubkey },
      payer: creator,
    })

    const result = await simulateAndSendAirdropTransaction({
      connection: client.connection,
      transaction,
      sendTransaction,
      onBeforeSend: () => {
        toast({
          title: `Processing batch ${chunk.index + 1}`,
          description: "Submitting recipients on-chain.",
          variant: "processing",
        })
      },
      onSignature: (signature) => {
        onEarlySignature?.(signature)
      },
    })

    if (result.status === "simulation-error") {
      throw new Error(getProgramErrorMessage(result.error))
    }

    return result.signature
  }

  const runBatch = async (draft: OnchainAppendBatchDraft, mode: "all" | "resume" | "failed") => {
    if (!publicKey || !studioClient || !walletAddress || !airdrop.airdropAddress) return

    const creator = publicKey
    const walletAddressSnapshot = walletAddress
    const airdropAddressSnapshot = airdrop.airdropAddress
    const airdropPubkey = new PublicKey(airdropAddressSnapshot)
    const decimals = mintProbe.status === "success" ? mintProbe.decimals : 0

    const targetIndexes = draft.chunks
      .filter((c) => {
        if (mode === "failed") return c.status === "failed"
        return c.status !== "success"
      })
      .map((c) => c.index)

    if (!targetIndexes.length) return

    setIsAppendingRecipients(true)
    let current = { ...draft, updatedAt: Date.now() }

    for (const chunkIndex of targetIndexes) {
      const chunk = current.chunks[chunkIndex]

      current = {
        ...current,
        updatedAt: Date.now(),
        chunks: current.chunks.map((c) =>
          c.index === chunkIndex ? { ...c, status: "in_progress" as const, attempts: c.attempts + 1 } : c,
        ),
      }
      setOnchainAppendBatchDraft(current)
      void saveBatchDraft(walletAddress, airdrop.airdropAddress, current)

      toast({
        title: `Batch ${chunkIndex + 1}/${current.chunks.length}`,
        description: "Approve the transaction in your wallet.",
        variant: "processing",
      })

      try {
        const signature = await executeChunk(
          current.chunks[chunkIndex],
          studioClient,
          creator,
          airdropPubkey,
          decimals,
          (earlySignature) => {
            // Persist signature the moment it returns from the wallet, before confirmation.
            // Protects against reloads/interrupts during confirmTransaction: reconciliation
            // can later query on-chain status from this signature instead of retrying blind.
            current = {
              ...current,
              updatedAt: Date.now(),
              chunks: current.chunks.map((c) =>
                c.index === chunkIndex ? { ...c, signature: earlySignature } : c,
              ),
            }
            setOnchainAppendBatchDraft(current)
            void saveBatchDraft(walletAddressSnapshot, airdropAddressSnapshot, current)
          },
        )

        current = {
          ...current,
          updatedAt: Date.now(),
          chunks: current.chunks.map((c) =>
            c.index === chunkIndex ? { ...c, status: "success" as const, signature, errorMessage: null } : c,
          ),
        }
        setOnchainAppendBatchDraft(current)
        void saveBatchDraft(walletAddress, airdrop.airdropAddress, current)

        toast({
          title: `Batch ${chunkIndex + 1}/${current.chunks.length} confirmed`,
          description: (
            <span>
              {chunk.recipients.length} recipients registered.{" "}
              <a
                href={buildExplorerUrl(signature, config.network)}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                View transaction
              </a>
            </span>
          ),
          variant: "success",
        })
      } catch (error) {
        if (isUserRejectedError(error)) {
          current = {
            ...current,
            updatedAt: Date.now(),
            chunks: current.chunks.map((c) =>
              c.index === chunkIndex ? { ...c, status: "pending" as const, attempts: c.attempts - 1 } : c,
            ),
          }
          setOnchainAppendBatchDraft(current)
          void saveBatchDraft(walletAddress, airdrop.airdropAddress, current)
          toast({
            title: "Transaction declined",
            description: "You can resume from where you left off.",
            variant: "warning",
          })
          break
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        current = {
          ...current,
          updatedAt: Date.now(),
          chunks: current.chunks.map((c) =>
            c.index === chunkIndex ? { ...c, status: "failed" as const, errorMessage } : c,
          ),
        }
        setOnchainAppendBatchDraft(current)
        void saveBatchDraft(walletAddress, airdrop.airdropAddress, current)

        toast({
          title: `Batch ${chunkIndex + 1} failed`,
          description: errorMessage,
          variant: "destructive",
        })
      }
    }

    const allSuccess = current.chunks.every((c) => c.status === "success")
    if (allSuccess) {
      const lastSig = [...current.chunks].reverse().find((c) => c.signature)?.signature ?? null
      if (lastSig) {
        updateAirdrop("recipientsSignature", lastSig)
      }
      void saveCompletedBatch(walletAddress, airdrop.airdropAddress, current)
      void clearBatchDraft(walletAddress, airdrop.airdropAddress)
      pushCompletedBatch(current)
      setOnchainAppendBatchDraft(null)
      // Auto-save after successful on-chain transaction
      saveConfig().catch(() => {})

      toast({
        title: "All recipients registered",
        description: (
          <span>
            {current.totalRecipients} recipients registered across {current.chunks.length} transaction(s).{" "}
            {lastSig && (
              <a
                href={buildExplorerUrl(lastSig, config.network)}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                View last transaction
              </a>
            )}
          </span>
        ),
        variant: "success",
      })
    } else {
      const failedCount = current.chunks.filter((c) => c.status === "failed").length
      const pendingCount = current.chunks.filter((c) => c.status === "pending").length
      if (failedCount > 0 || pendingCount > 0) {
        toast({
          title: "Recipient registration incomplete",
          description: `${failedCount} failed, ${pendingCount} pending. You can resume or retry.`,
          variant: "warning",
        })
      }
    }

    setIsAppendingRecipients(false)
  }

  const handleStartAppend = () => {
    if (isWrongWallet) {
      toast({
        title: "Wrong wallet",
        description: "Switch to the airdrop creator wallet to register recipients.",
        variant: "destructive",
      })
      return
    }
    if (!publicKey || !studioClient || !airdrop.airdropAddress || !airdrop.recipients.length || !walletAddress) {
      toast({
        title: "Recipients unavailable",
        description: "Create the draft and add recipients before registering on-chain.",
        variant: "destructive",
      })
      return
    }

    const decimals = mintProbe.status === "success" ? mintProbe.decimals : 0

    const validRecipients = airdrop.recipients
      .filter((r) => isLikelySolanaAddress(r.address))
      .map((r) => ({ wallet: r.address, amount: r.amount }))

    if (!validRecipients.length) {
      toast({
        title: "No valid recipients",
        description: "Add at least one valid wallet address.",
        variant: "destructive",
      })
      return
    }

    let totalAmountRaw = 0n
    try {
      for (const recipient of validRecipients) {
        const parsedAmount = decimalAmountToRawUnits(recipient.amount, decimals)
        if (!parsedAmount || parsedAmount.raw === "0") {
          throw new Error(`Invalid recipient amount for ${recipient.wallet}`)
        }
        totalAmountRaw += BigInt(parsedAmount.raw)
      }
    } catch (error) {
      toast({
        title: "Invalid recipient amount",
        description: error instanceof Error ? error.message : "Check recipient allocations and try again.",
        variant: "destructive",
      })
      return
    }

    const chunks = chunkRecipients(validRecipients, RECIPIENTS_PER_APPEND)

    const draft: OnchainAppendBatchDraft = {
      version: 1,
      id: createBatchId(),
      walletAddress,
      airdropAddress: airdrop.airdropAddress,
      mintAddress: airdrop.mintAddress || null,
      tokenDecimals: decimals,
      totalRecipients: validRecipients.length,
      totalAmountRaw: totalAmountRaw.toString(),
      chunkSize: RECIPIENTS_PER_APPEND,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chunks: chunks.map((recipients, index) => ({
        index,
        status: "pending",
        recipients,
        attempts: 0,
        signature: null,
        errorMessage: null,
      })),
    }

    setOnchainAppendBatchDraft(draft)
    void saveBatchDraft(walletAddress, airdrop.airdropAddress, draft)
    // Pending recipients list is now duplicated into the batch draft; clear the memory-only
    // list so the StatCard pending delta resets and the next append starts from a clean slate.
    updateAirdrop("recipients", [])
    void runBatch(draft, "all")
  }

  const handleResumeAppend = () => {
    if (onchainAppendBatchDraft) {
      void runBatch(onchainAppendBatchDraft, "resume")
    }
  }

  const handleRetryFailed = () => {
    if (onchainAppendBatchDraft) {
      void runBatch(onchainAppendBatchDraft, "failed")
    }
  }

  const handleDiscardBatch = () => {
    if (walletAddress && airdrop.airdropAddress) {
      void clearBatchDraft(walletAddress, airdrop.airdropAddress)
    }
    setOnchainAppendBatchDraft(null)
  }

  const handleDeleteCompletedHistory = () => {
    if (walletAddress && airdrop.airdropAddress) {
      void clearCompletedBatches(walletAddress, airdrop.airdropAddress)
    }
    setCompletedBatches([])
  }

  const handleDepositTokens = async () => {
    if (!publicKey || !studioClient || !airdrop.airdropAddress || mintProbe.status !== "success") {
      toast({
        title: "Deposit unavailable",
        description: "Create the draft and connect a wallet before depositing tokens.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDepositing(true)
      const creator = publicKey
      const mint = new PublicKey(airdrop.mintAddress.trim())
      const airdropAddress = new PublicKey(airdrop.airdropAddress)
      const tokenProgram = mintProbe.programLabel === "Token-2022" ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
      const payerTokenAccount = getAssociatedTokenAddressSync(mint, creator, false, tokenProgram)

      const transaction = await studioClient.depositOnchainAirdrop({
        accounts: {
          creator,
          airdrop: airdropAddress,
          mint,
          payerTokenAccount,
          tokenProgram,
        },
        payer: creator,
      })

      const result = await simulateAndSendAirdropTransaction({
        connection: studioClient.connection,
        transaction,
        sendTransaction,
        onBeforeSend: () => {
          toast({
            title: "Processing deposit",
            description: "Approve the token deposit transaction in your wallet.",
            variant: "processing",
          })
        },
      })

      if (result.status === "simulation-error") {
        toast({
          title: "Deposit failed",
          description: getProgramErrorMessage(result.error),
          variant: "destructive",
        })
        return
      }

      updateAirdrop("depositSignature", result.signature)
      updateAirdrop("currentStep", "start")
      // Auto-save after successful on-chain transaction
      await saveConfig().catch(() => {})
      pushLog({ type: "transaction", title: "Tokens deposited", explorerUrl: buildExplorerUrl(result.signature, config.network) })
      toast({
        title: "Deposit transaction sent",
        description: (
          <span>
            Deposit confirmed.{" "}
            <a
              href={buildExplorerUrl(result.signature, config.network)}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              View transaction
            </a>
          </span>
        ),
        variant: "success",
      })

      pollVaultAfterDeposit()
    } catch (error) {
      pushLog({ type: "error", title: "Deposit failed", detail: error instanceof Error ? error.message : undefined })
      toast({
        title: "Deposit failed",
        description: error instanceof Error ? error.message : "Failed to deposit tokens.",
        variant: "destructive",
      })
    } finally {
      setIsDepositing(false)
    }
  }

  const handleCancelAirdrop = async () => {
    if (!publicKey || !studioClient || !airdrop.airdropAddress || !walletAddress) {
      toast({
        title: "Cancel unavailable",
        description: "Connect the creator wallet to cancel.",
        variant: "destructive",
      })
      return
    }
    if (isWrongWallet) {
      toast({
        title: "Wrong wallet",
        description: "Switch to the airdrop creator wallet to cancel.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCanceling(true)
      const creator = publicKey
      const mint = new PublicKey(airdrop.mintAddress.trim())
      const airdropPubkey = new PublicKey(airdrop.airdropAddress)
      const tokenProgram = mintProbe.status === "success" && mintProbe.programLabel === "Token-2022"
        ? TOKEN_2022_PROGRAM_ID
        : TOKEN_PROGRAM_ID

      const transaction = await studioClient.cancelOnchainAirdrop({
        accounts: {
          creator,
          airdrop: airdropPubkey,
          mint,
          tokenProgram,
        },
        payer: creator,
      })

      const result = await simulateAndSendAirdropTransaction({
        connection: studioClient.connection,
        transaction,
        sendTransaction,
        onBeforeSend: () => {
          toast({
            title: "Processing cancellation",
            description: "Approve the cancel transaction in your wallet.",
            variant: "processing",
          })
        },
      })

      if (result.status === "simulation-error") {
        toast({
          title: "Cancel failed",
          description: getProgramErrorMessage(result.error),
          variant: "destructive",
        })
        return
      }

      pushLog({ type: "transaction", title: "Airdrop canceled" })
      toast({
        title: "Airdrop canceled",
        description: (
          <span>
            Tokens have been returned to your wallet.{" "}
            <a
              href={buildExplorerUrl(result.signature, config.network)}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              View transaction
            </a>
          </span>
        ),
        variant: "success",
      })

      // Reset after successful cancel
      await resetAirdrop()
      setIsResetDialogOpen(false)
    } catch (error) {
      toast({
        title: "Cancel failed",
        description: error instanceof Error ? error.message : "Failed to cancel the airdrop.",
        variant: "destructive",
      })
    } finally {
      setIsCanceling(false)
    }
  }

  const handleStartAirdrop = async () => {
    if (!publicKey || !studioClient || !airdrop.airdropAddress) {
      toast({
        title: "Start unavailable",
        description: "Create and fund the airdrop before starting it.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsStarting(true)
      const creator = publicKey
      const airdropAddress = new PublicKey(airdrop.airdropAddress)
      const transaction = await studioClient.startOnchainAirdrop({
        params: {
          startsAt: parseDateToBn(airdrop.startDate),
          endsAt: parseDateToBn(airdrop.endDate),
        },
        accounts: {
          creator,
          airdrop: airdropAddress,
        },
        payer: creator,
      })

      const result = await simulateAndSendAirdropTransaction({
        connection: studioClient.connection,
        transaction,
        sendTransaction,
        onBeforeSend: () => {
          toast({
            title: "Starting airdrop",
            description: "Submitting the start transaction on-chain.",
            variant: "processing",
          })
        },
      })

      if (result.status === "simulation-error") {
        toast({
          title: "Start failed",
          description: getProgramErrorMessage(result.error),
          variant: "destructive",
        })
        return
      }

      updateAirdrop("startSignature", result.signature)
      updateAirdrop("currentStep", "complete")
      // Auto-save after successful on-chain transaction
      await saveConfig().catch(() => {})
      pushLog({ type: "transaction", title: "Airdrop started", explorerUrl: buildExplorerUrl(result.signature, config.network) })
      toast({
        title: "Airdrop started",
        description: (
          <span>
            The airdrop is now live.{" "}
            <a
              href={buildExplorerUrl(result.signature, config.network)}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              View transaction
            </a>
          </span>
        ),
        variant: "success",
      })
    } catch (error) {
      pushLog({ type: "error", title: "Start failed", detail: error instanceof Error ? error.message : undefined })
      toast({
        title: "Start failed",
        description: error instanceof Error ? error.message : "Failed to start the airdrop.",
        variant: "destructive",
      })
    } finally {
      setIsStarting(false)
    }
  }

  // --- Hydrate batch state from .bonkit/ history files ---
  const batchHydratedRef = useRef<string | null>(null)
  const connectionRef = useRef(connection)
  connectionRef.current = connection

  useEffect(() => {
    if (!walletAddress || !airdrop.airdropAddress) return
    // Only hydrate once per wallet+airdrop combination
    const scopeKey = `${walletAddress}:${airdrop.airdropAddress}`
    if (batchHydratedRef.current === scopeKey) return
    batchHydratedRef.current = scopeKey

    const walletAddressSnapshot = walletAddress
    const airdropAddressSnapshot = airdrop.airdropAddress
    let cancelled = false
    void (async () => {
      const draft = await loadBatchDraft(walletAddressSnapshot, airdropAddressSnapshot)
      if (cancelled) return
      if (draft) setOnchainAppendBatchDraft(draft)
      const completed = await loadCompletedBatches(walletAddressSnapshot, airdropAddressSnapshot)
      if (cancelled) return
      if (completed.length) setCompletedBatches(completed)

      // Reconcile in_progress chunks against on-chain signature status. If the process was
      // interrupted between signature capture and confirmation, the on-chain state (not the
      // local draft) is the source of truth for whether the chunk actually landed.
      if (!draft) return
      const outcome = await reconcileBatchDraft(draft, connectionRef.current)
      if (cancelled || !outcome.changed) return
      setOnchainAppendBatchDraft(outcome.draft)
      await saveBatchDraft(walletAddressSnapshot, airdropAddressSnapshot, outcome.draft)
      const { confirmed, failed, dropped } = outcome.summary
      const parts: string[] = []
      if (confirmed) parts.push(`${confirmed} confirmed`)
      if (failed) parts.push(`${failed} failed`)
      if (dropped) parts.push(`${dropped} dropped`)
      if (parts.length) {
        toast({
          title: "Batch state reconciled after reload",
          description: parts.join(" · "),
          variant: confirmed && !failed && !dropped ? "success" : "warning",
        })
      }
    })()
    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per wallet+airdrop scope; connection accessed via ref
  }, [walletAddress, airdrop.airdropAddress])

  useEffect(() => {
    let cancelled = false
    setClientReady(false)

    void initAirdropStudioClient(connection, config.network)
      .then((client) => {
        if (cancelled) return
        setStudioClient(client)
        setClientReady(true)
      })
      .catch((error) => {
        if (cancelled) return
        setStudioClient(null)
        setClientReady(true)
        toast({
          title: "Airdrop client init failed",
          description: error instanceof Error ? error.message : "Failed to initialize Airdrop SDK client.",
          variant: "destructive",
        })
      })

    return () => {
      cancelled = true
    }
  }, [config.network, connection])

  useEffect(() => {
    if (activeSigner.mode !== "extension") {
      previousConnectedRef.current = connected
      return
    }
    if (connected && publicKey && !previousConnectedRef.current) {
      pushLog({ type: "info", title: "Wallet connected", detail: wallet?.adapter.name })
      toast({
        title: "Wallet connected",
        description: `${wallet?.adapter.name ?? "Wallet"} connected as ${shortenAddress(publicKey.toBase58())}.`,
        variant: "success",
      })
    }
    if (!connected && previousConnectedRef.current) {
      pushLog({ type: "info", title: "Wallet disconnected" })
      toast({
        title: "Wallet disconnected",
        description: "The current wallet session has ended.",
        variant: "warning",
      })
    }
    previousConnectedRef.current = connected
  }, [connected, publicKey, wallet, activeSigner.mode, pushLog])

  const footerActionLabel = "Continue"
  const footerActionDisabled = !canAdvance || isAirdropLive
  const handleFooterAction = () => {
    handleNext()
  }

  const hasHeaderBanner = isWrongWallet || isAirdropLive

  return (
    <div className="flex h-full w-full flex-col bg-surface">
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-6 py-5 xl:px-8",
          hasHeaderBanner ? "" : "border-b border-border",
        )}
      >
        <div className="min-w-0">
          <div className={`flex items-center space-x-2`}>
            <h1 className="text-2xl font-semibold text-foreground">Create Airdrop</h1>
            {isAirdropLive ? (
              <Badge className="gap-1.5 border-success/40 bg-success/10 text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="w-fit border-border text-muted-foreground">
                {currentIndex + 1} / {visibleSteps.length}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{currentStepMeta.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{clientReady ? "SDK ready" : "Initializing SDK..."}</span>
            <span className="text-border">/</span>
            <span>{walletAddress ? `Wallet ${compactAddress(walletAddress)}` : "Wallet disconnected"}</span>
            {airdrop.airdropAddress ? (
              <>
                <span className="text-border">/</span>
                <span>Airdrop {compactAddress(airdrop.airdropAddress)}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-start">
          {airdrop.airdropAddress ? (
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setIsResetDialogOpen(true)}
              disabled={walletBusy}
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          ) : null}
          <SignerModePanel
            connecting={connecting}
            connected={extensionConnected}
            walletAddress={extensionWalletAddress}
            walletBusy={walletBusy}
            expectedCreatorWallet={airdrop.creatorWallet}
            onConnectWallet={handleOpenWalletModal}
            onDisconnectWallet={handleDisconnectWallet}
          />
        </div>
      </div>

      {isWrongWallet ? (
        <div className="flex items-center gap-3 border-y border-destructive/30 bg-destructive/10 px-6 py-3 xl:px-8">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            Connected wallet does not match the airdrop creator ({shortenAddress(airdrop.creatorWallet!)}). Switch to
            the creator wallet to continue.
          </p>
        </div>
      ) : null}

      {isAirdropLive ? (
        <div className="flex items-center gap-3 border-y border-success/30 bg-success/5 px-6 py-3 xl:px-8">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <p className="text-sm text-success">Airdrop is live. All steps have been completed successfully.</p>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1">
        <div className="flex min-h-0 flex-col border-b border-border xl:border-b-0 xl:border-r">
          <div className="border-b border-border px-6 py-5 xl:px-8">
            <div className="flex flex-wrap items-center gap-2">
              {visibleSteps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const stepComplete = isStepComplete(step.id)
                const canNavigate = index === 0 || visibleSteps.slice(0, index).every((prev) => isStepComplete(prev.id))
                const isLocked = !isActive && !canNavigate
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isLocked}
                      className={cn(
                        "inline-flex items-center gap-2 border px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : stepComplete
                            ? "border-success/40 bg-success/10 text-success hover:bg-success/15"
                            : isLocked
                              ? "border-border bg-muted/10 text-muted-foreground/50 cursor-not-allowed"
                              : "border-border bg-muted/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
                      )}
                      onClick={() => {
                        if (!isLocked) updateAirdrop("currentStep", step.id)
                      }}
                    >
                      {stepComplete && !isActive ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      <span>{step.label}</span>
                    </button>
                    {index < visibleSteps.length - 1 ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 xl:px-8">
            {currentStep === "draft" ? (
              <AirdropStepDraft
                mintProbe={mintProbe}
                scheduleState={scheduleState}
                canCreateDraft={canCreateDraft}
                isSubmittingDraft={isSubmittingDraft}
                connected={connected}
                rpcCheck={rpcCheck}
                onCreateDraft={() => void handleCreateDraft()}
                onContinue={airdrop.airdropAddress ? () => updateAirdrop("currentStep", "recipients") : undefined}
              />
            ) : null}

            {currentStep === "recipients" ? (
              <AirdropStepRecipients
                recipientsCount={pendingRecipientsCount}
                uniqueRecipientsCount={uniquePendingRecipientsCount}
                connected={connected}
                isAppending={isAppendingRecipients}
                batchDraft={onchainAppendBatchDraft}
                completedBatches={completedBatches}
                tokenDecimals={mintProbe.status === "success" ? mintProbe.decimals : 0}
                onStartAppend={handleStartAppend}
                onResumeAppend={handleResumeAppend}
                onRetryFailed={handleRetryFailed}
                onDiscardBatch={handleDiscardBatch}
                onContinue={airdrop.recipientsSignature ? () => updateAirdrop("currentStep", "deposit") : undefined}
              />
            ) : null}

            {currentStep === "deposit" ? (
              <AirdropStepDeposit
                recipientsCount={registeredRecipientsCount}
                mintProbe={mintProbe}
                canDepositTokens={canDepositTokens}
                isDepositing={isDepositing}
                walletAddress={walletAddress}
                walletTokenBalance={walletTokenBalance?.amount ?? null}
                isWalletBalanceLoading={isWalletBalanceLoading}
                vaultBalance={vaultBalance?.amount ?? null}
                isVaultBalanceLoading={isVaultBalanceLoading}
                depositBlockedMessage={depositBlockedMessage}
                isBalanceSufficient={!isBalanceInsufficient && !isWalletBalanceCheckPending}
                transferFeeEstimate={transferFeeEstimate}
                onOpenConfirmDialog={() => setIsDepositConfirmOpen(true)}
                onContinue={airdrop.depositSignature ? () => updateAirdrop("currentStep", "start") : undefined}
              />
            ) : null}

            {currentStep === "start" ? (
              <AirdropStepStart
                recipientsCount={registeredRecipientsCount}
                scheduleState={scheduleState}
                canStartAirdrop={canStartAirdrop}
                isStarting={isStarting}
                walletAddress={walletAddress}
                onStartAirdrop={() => void handleStartAirdrop()}
              />
            ) : null}

            {isAirdropLive && currentStep === "start" ? <AirdropStepComplete /> : null}
          </div>

          <div className="flex items-center justify-between border-t border-border px-6 py-4 xl:px-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentIndex <= 0 && !isAirdropLive}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="hidden text-sm text-muted-foreground md:block">
              Step {currentIndex + 1} of {visibleSteps.length}
            </div>
            {currentStep !== "start" && !isAirdropLive ? (
              <Button type="button" onClick={handleFooterAction} disabled={footerActionDisabled} className="gap-2">
                {footerActionLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>

      <AirdropDepositConfirmDialog
        open={isDepositConfirmOpen}
        onOpenChange={setIsDepositConfirmOpen}
        requiredAmount={registeredAllocation}
        tokenSymbol={airdrop.tokenSymbol || ""}
        walletBalance={walletTokenBalance?.amount ?? null}
        isBalanceSufficient={!isBalanceInsufficient && !isWalletBalanceCheckPending}
        transferFeeEstimate={transferFeeEstimate}
        decimals={mintProbe.status === "success" ? mintProbe.decimals : 0}
        onConfirm={() => void handleDepositTokens()}
      />

      <AirdropResetDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        airdrop={airdrop}
        network={config.network}
        isCanceling={isCanceling}
        onConfirmReset={() => {
          void resetAirdrop().then(() => setIsResetDialogOpen(false))
        }}
        onCancelAndReset={() => void handleCancelAirdrop()}
      />

      <AirdropAppendProgressOverlay
        isAppending={isAppendingRecipients}
        batchCurrent={onchainAppendBatchDraft?.chunks.filter((c) => c.status === "success").length ?? 0}
        batchTotal={onchainAppendBatchDraft?.chunks.length ?? 0}
        progress={
          onchainAppendBatchDraft
            ? (onchainAppendBatchDraft.chunks.filter((c) => c.status === "success").length /
                onchainAppendBatchDraft.chunks.length) *
              100
            : 0
        }
      />
    </div>
  )
}
