import { useCallback, useEffect, useRef } from "react"
import { BN } from "@coral-xyz/anchor"
import { getAllocationClassName, type LayoutSlots, type TextSlotProps, type ButtonSlotProps, type StatSlotProps, type AllocationSlotProps } from "./slots"
import { WalletButton } from "../components/wallet/wallet-button"
import { AllocationSectionView, type AllocationItem } from "../components/wallet/allocation-section"
import { Skeleton } from "../components/ui/skeleton"
import { useAirdropContext } from "../hooks/use-airdrop-context"
import { useToast } from "../hooks/use-toast"
import { useWallet } from "@solana/wallet-adapter-react"

function StaticText({
  value,
  placeholder,
  className,
  style,
  tag: Tag = "span",
  multiline,
}: TextSlotProps) {
  return (
    <Tag className={`${multiline ? "whitespace-pre-wrap" : ""} ${className ?? ""}`} style={style}>
      {value || placeholder}
    </Tag>
  )
}

function WalletAwareButton({
  field,
  label,
  className,
  style,
  stretch,
  disabled,
}: ButtonSlotProps) {
  if (field === "connectWallet") {
    return <WalletButton label={label} className={className} style={style} stretch={stretch} />
  }

  if (field === "claimButton") {
    return <ClaimButton label={label} className={className} style={style} scheduleDisabled={disabled} />
  }

  if (field === "eligibilityButton") {
    return <EligibilityButton label={label} className={className} style={style} />
  }

  return (
    <button className={className} style={style} disabled={disabled}>
      {label}
    </button>
  )
}

function ClaimButton({
  label,
  className,
  style,
  scheduleDisabled,
}: {
  label: string
  className?: string
  style?: React.CSSProperties
  scheduleDisabled?: boolean
}) {
  const airdrop = useAirdropContext()
  const { connected } = useWallet()
  const { toast } = useToast()
  const toastRef = useRef<ReturnType<typeof toast> | null>(null)
  const prevClaimStatus = useRef(airdrop?.claimStatus)

  useEffect(() => {
    if (!airdrop) return
    const prev = prevClaimStatus.current
    const curr = airdrop.claimStatus
    prevClaimStatus.current = curr
    if (prev === curr) return

    if (curr === "signing") {
      // Always create a fresh toast for each new claim attempt
      toastRef.current = toast({ title: "Awaiting signature", description: "Approve the transaction in your wallet." })
    } else if (curr === "confirming" && toastRef.current) {
      toastRef.current.update({ id: toastRef.current.id, title: "Claiming tokens", description: "Confirming your claim on-chain." })
    } else if (curr === "success") {
      if (toastRef.current) {
        toastRef.current.update({ id: toastRef.current.id, title: "Claim submitted", description: "Your tokens have been claimed successfully.", variant: "success" })
      } else {
        toast({ title: "Claim submitted", description: "Your tokens have been claimed successfully.", variant: "success" })
      }
      toastRef.current = null
    } else if (curr === "idle" && prev !== "idle" && prev !== "success" && airdrop.error) {
      // Error → idle transition with error message
      if (toastRef.current) {
        toastRef.current.update({ id: toastRef.current.id, title: "Claim failed", description: airdrop.error, variant: "destructive" })
      } else {
        toast({ title: "Claim failed", description: airdrop.error, variant: "destructive" })
      }
      toastRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to status/error transitions, not the full airdrop object
  }, [airdrop?.claimStatus, airdrop?.error, toast])

  const handleClick = useCallback(async () => {
    if (!airdrop) return
    if (airdrop.allocations.length === 1) {
      const alloc = airdrop.allocations[0]
      if (!alloc.claimed) await airdrop.claim(alloc.entryIndex)
      return
    }
    if (airdrop.selectedIndex !== null) {
      await airdrop.claim(airdrop.selectedIndex)
    }
  }, [airdrop])

  const isClaiming = airdrop?.claimStatus === "signing" || airdrop?.claimStatus === "confirming"
  const isSingleUnclaimed =
    airdrop?.allocations.length === 1 && !airdrop.allocations[0].claimed
  const hasSelectedUnclaimed =
    airdrop?.selectedIndex !== null &&
    airdrop?.allocations.some((a) => a.entryIndex === airdrop.selectedIndex && !a.claimed)

  const canClaim =
    connected &&
    airdrop?.eligibility === "eligible" &&
    airdrop.claimStatus === "idle" &&
    (isSingleUnclaimed || hasSelectedUnclaimed)

  const needsWallet = !connected
  const disabled = needsWallet || !canClaim || Boolean(scheduleDisabled)

  const showShimmer = canClaim && !isClaiming && !scheduleDisabled

  let displayLabel = label
  if (connected && airdrop) {
    if (isClaiming) displayLabel = "Processing..."
    else if (airdrop.claimStatus === "success" && airdrop.eligibility === "already-claimed") displayLabel = "Claimed!"
    else if (airdrop.eligibility === "already-claimed") displayLabel = "Claimed"
  }

  return (
    <button
      className={`${className ?? ""} ${showShimmer ? "campaign-shimmer-glow" : ""}`}
      style={{
        ...style,
        ...(disabled
          ? { opacity: 0.5, cursor: "not-allowed" }
          : { cursor: "pointer" }),
      }}
      disabled={disabled}
      onClick={!disabled ? handleClick : undefined}
    >
      {displayLabel}
    </button>
  )
}

function EligibilityButton({
  label,
  className,
  style,
}: {
  label: string
  className?: string
  style?: React.CSSProperties
}) {
  const airdrop = useAirdropContext()
  const { connected } = useWallet()

  const handleClick = useCallback(async () => {
    if (!airdrop) return
    await airdrop.checkEligibility()
  }, [airdrop])

  const needsWallet = !connected
  const isChecking = airdrop?.eligibility === "checking"
  const disabled = needsWallet || !airdrop || airdrop.status !== "ready" || isChecking

  // shimmer: wallet connected + eligibility not yet checked
  const showShimmer = connected && airdrop?.eligibility === "idle" && airdrop.status === "ready"

  let displayLabel = label
  if (connected && airdrop) {
    if (isChecking) displayLabel = "Checking..."
    else if (airdrop.eligibility === "eligible") displayLabel = "Eligible ✓"
    else if (airdrop.eligibility === "not-eligible") displayLabel = "Not Eligible"
    else if (airdrop.eligibility === "already-claimed") displayLabel = "Already Claimed"
  }

  return (
    <button
      className={`${className ?? ""} ${showShimmer ? "campaign-shimmer" : ""}`}
      style={{
        ...style,
        ...(disabled
          ? { opacity: 0.5, cursor: "not-allowed" }
          : { cursor: "pointer" }),
      }}
      disabled={disabled}
      onClick={!disabled ? handleClick : undefined}
    >
      {displayLabel}
    </button>
  )
}

function addThousandSeparators(s: string): string {
  return s.replace(/\B(?=(\d{3})+$)/g, ",")
}

function formatTokenAmount(value: BN, decimals: number | null): string {
  if (decimals === null) return value.toString()
  const raw = value.toString()
  if (decimals === 0) return addThousandSeparators(raw)
  const padded = raw.padStart(decimals + 1, "0")
  const intPart = padded.slice(0, -decimals)
  const fracPart = padded.slice(-decimals).replace(/0+$/, "")
  return fracPart
    ? `${addThousandSeparators(intPart)}.${fracPart}`
    : addThousandSeparators(intPart)
}

function AirdropAwareStat({ field, value, className, style }: StatSlotProps) {
  const airdrop = useAirdropContext()
  const isAirdropField = field === "totalClaims" || field === "claimed" || field === "totalAllocation"

  if (isAirdropField && (!airdrop || airdrop.status === "loading" || airdrop.tokenDecimals === null)) {
    return <Skeleton className="h-8 w-20 mx-auto" />
  }

  if (!airdrop || airdrop.status !== "ready") {
    return <span className={className} style={style}>{value}</span>
  }

  let display = value
  if (field === "totalClaims") {
    if (!airdrop.totalClaimedAmount.isZero()) {
      display = formatTokenAmount(airdrop.totalClaimedAmount, airdrop.tokenDecimals)
    }
  } else if (field === "claimed") {
    display = `${airdrop.claimedPercent}%`
  } else if (field === "totalAllocation") {
    if (!airdrop.totalAmount.isZero()) {
      display = formatTokenAmount(airdrop.totalAmount, airdrop.tokenDecimals)
    }
  }

  return <span className={className} style={style}>{display}</span>
}

function LiveAllocationSection({ colors, tokenSymbol, className, maxWidthClass }: AllocationSlotProps) {
  const airdrop = useAirdropContext()

  if (!airdrop) return null
  if (airdrop.eligibility !== "eligible" && airdrop.eligibility !== "already-claimed" && airdrop.eligibility !== "not-eligible") return null

  const status = airdrop.eligibility === "not-eligible"
    ? "not-eligible" as const
    : airdrop.allocations.length === 1
      ? "single" as const
      : "multi" as const

  const items: AllocationItem[] = airdrop.allocations.map((a) => ({
    index: a.entryIndex,
    amountLabel: formatTokenAmount(a.amount, airdrop.tokenDecimals),
    claimed: a.claimed,
  }))

  const totalLabel = formatTokenAmount(
    airdrop.allocations.reduce((sum, a) => sum.add(a.amount), new BN(0)),
    airdrop.tokenDecimals,
  )

  const claimIdle = airdrop.claimStatus === "idle"

  const explorerUrl = airdrop.lastTxSignature
    ? buildSolscanTxUrl(airdrop.lastTxSignature, airdrop.networkCluster)
    : null

  return (
    <AllocationSectionView
      status={status}
      allocations={items}
      primaryColor={colors.primary}
      tokenSymbol={tokenSymbol}
      totalLabel={totalLabel}
      selectedIndex={airdrop.selectedIndex}
      onSelect={airdrop.selectAllocation}
      claimIdle={claimIdle}
      explorerUrl={explorerUrl}
      className={getAllocationClassName(className, maxWidthClass)}
    />
  )
}

function buildSolscanTxUrl(signature: string, cluster: "devnet" | "mainnet-beta"): string {
  const base = `https://solscan.io/tx/${signature}`
  return cluster === "devnet" ? `${base}?cluster=devnet` : base
}

export const walletSlots: LayoutSlots = {
  Text: StaticText,
  Button: WalletAwareButton,
  Stat: AirdropAwareStat,
  AllocationSection: LiveAllocationSection,
}
