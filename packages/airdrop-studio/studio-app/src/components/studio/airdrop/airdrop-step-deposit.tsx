"use client"

import { useState } from "react"
import { ArrowRight, Check, CheckCircle2, ChevronDown, CircleAlert, Coins, Loader2, WalletMinimal } from "lucide-react"
import { compactAddress, formatScheduleLabel, formatTokenAmount, shortenAddress, type MintProbeState } from "../../../lib/airdrop-utils"
import type { TransferFeeEstimate } from "../../../lib/airdrop-transfer-fee"
import { useStudioStore } from "../../../lib/studio-store"
import { deriveRegisteredAllocation } from "../../../lib/airdrop-allocation"
import { cn } from "../../../lib/utils"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"

interface AirdropStepDepositProps {
  recipientsCount: number
  mintProbe: MintProbeState
  canDepositTokens: boolean
  isDepositing: boolean
  walletAddress: string | null
  walletTokenBalance: string | null
  isWalletBalanceLoading: boolean
  vaultBalance: string | null
  isVaultBalanceLoading: boolean
  depositBlockedMessage: string | null
  isBalanceSufficient: boolean
  transferFeeEstimate: TransferFeeEstimate | null
  onOpenConfirmDialog: () => void
  onContinue?: () => void
}

export function AirdropStepDeposit({
  recipientsCount,
  mintProbe,
  canDepositTokens,
  isDepositing,
  walletAddress,
  walletTokenBalance,
  isWalletBalanceLoading,
  vaultBalance,
  isVaultBalanceLoading,
  depositBlockedMessage,
  isBalanceSufficient,
  transferFeeEstimate,
  onOpenConfirmDialog,
  onContinue,
}: AirdropStepDepositProps) {
  const { config, airdrop } = useStudioStore()
  const completedBatches = useStudioStore((state) => state.completedBatches)
  const totalAllocation = deriveRegisteredAllocation(completedBatches)
  const isStepComplete = Boolean(airdrop.depositSignature)
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false)

  const decimals = mintProbe.status === "success" ? mintProbe.decimals : 0
  const feeRateLabel = transferFeeEstimate
    ? transferFeeEstimate.basisPoints % 100 === 0
      ? `${transferFeeEstimate.basisPoints / 100}%`
      : `${(transferFeeEstimate.basisPoints / 100).toFixed(2)}%`
    : null
  const feeAmountLabel = transferFeeEstimate ? formatTokenAmount(transferFeeEstimate.feeAmount.toString(), decimals) : null
  const grossAmountLabel = transferFeeEstimate
    ? formatTokenAmount(transferFeeEstimate.grossAmount.toString(), decimals)
    : null

  const scheduleLabel = formatScheduleLabel(airdrop.startDate, airdrop.endDate)

  return (
    <div className="mx-auto mt-6 w-full max-w-3xl space-y-6">
      {isStepComplete ? (
        <div className="border border-success/30 bg-success/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-semibold text-foreground">Deposit completed</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {totalAllocation} {airdrop.tokenSymbol} deposited to vault.
                </p>
              </div>
            </div>
            {onContinue ? (
              <Button type="button" size="sm" className="shrink-0 gap-1.5" onClick={onContinue}>
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border border-border bg-card p-6">
        <h3 className="text-2xl font-semibold text-foreground">Deposit Summary</h3>
        <div className="mt-6 divide-y divide-border">
          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-muted-foreground">Total Allocation</span>
            <span className="text-lg font-semibold text-foreground">
              {`${totalAllocation} ${airdrop.tokenSymbol}`.trim()}
            </span>
          </div>

          {/* Transfer fee breakdown */}
          {transferFeeEstimate && feeAmountLabel && grossAmountLabel ? (
            <>
              <div className="py-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4"
                  onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    Amount to deposit
                    <Badge variant="outline" className="border-amber-500/30 text-amber-500">
                      incl. {feeRateLabel} fee
                    </Badge>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">
                      {grossAmountLabel} {airdrop.tokenSymbol}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        showFeeBreakdown && "rotate-180",
                      )}
                    />
                  </span>
                </button>
                {showFeeBreakdown ? (
                  <div className="mt-3 space-y-2 border border-border bg-muted/20 p-3 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Required amount</span>
                      <span className="font-mono">
                        {totalAllocation} {airdrop.tokenSymbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Transfer fee ({feeRateLabel})</span>
                      <span className="font-mono text-amber-500">
                        +{feeAmountLabel} {airdrop.tokenSymbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2 font-medium text-foreground">
                      <span>Total to deposit</span>
                      <span className="font-mono">
                        {grossAmountLabel} {airdrop.tokenSymbol}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-muted-foreground">Wallet Balance</span>
            <span className="text-lg font-semibold">
              {isWalletBalanceLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : walletTokenBalance !== null ? (
                <span className={isBalanceSufficient ? "text-success" : "text-destructive"}>
                  {walletTokenBalance} {airdrop.tokenSymbol}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-muted-foreground">Vault Balance</span>
            <span className="text-lg font-semibold">
              {isVaultBalanceLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : vaultBalance !== null ? (
                <span className="text-foreground">
                  {vaultBalance} {airdrop.tokenSymbol}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-muted-foreground">Recipients</span>
            <span className="text-lg font-semibold text-foreground">{recipientsCount}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-muted-foreground">Token Mint</span>
            <span className="font-mono text-sm text-foreground">
              {airdrop.mintAddress ? compactAddress(airdrop.mintAddress) : "Not set"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-muted-foreground">Claim Type</span>
            <Badge variant="outline" className="border-border text-foreground">
              {config.claimMode === "onchain" ? "Onchain" : "Merkle"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-muted-foreground">Network</span>
            <span className="text-lg font-semibold text-foreground">
              Solana {config.network === "mainnet-beta" ? "Mainnet" : "Devnet"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-muted-foreground">Schedule</span>
            <span className="text-sm font-semibold text-foreground">{scheduleLabel}</span>
          </div>
        </div>
      </div>

      {!isStepComplete ? (
        <>
          {depositBlockedMessage ? (
            <div className="border border-destructive/60 bg-destructive/10 p-5">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-foreground">Deposit blocked</p>
                  <p className="mt-1 text-sm text-muted-foreground">{depositBlockedMessage}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-amber-600/60 bg-amber-500/10 p-5">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-semibold text-foreground">Check allocation before deposit</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Confirm the total allocation and each recipient amount before continuing.
                    {transferFeeEstimate
                      ? ` This token has a ${feeRateLabel} transfer fee — the deposit amount includes the fee.`
                      : null}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Pre-flight Checklist</h3>
            <div className="space-y-3">
              {(
                [
                  {
                    label: "Token mint verified",
                    detail: mintProbe.status === "success" ? `${mintProbe.symbol} (${mintProbe.programLabel})` : null,
                    hint: mintProbe.status !== "success" ? "Enter a valid token mint address in the Draft step" : null,
                    complete: mintProbe.status === "success",
                  },
                  {
                    label: "Recipients configured",
                    detail: recipientsCount > 0 ? `${recipientsCount.toLocaleString()} recipients` : null,
                    hint: recipientsCount === 0 ? "Import recipients in the Recipients step" : null,
                    complete: recipientsCount > 0,
                  },
                  {
                    label: "Schedule",
                    detail: scheduleLabel,
                    hint: null,
                    complete: true,
                  },
                  {
                    label: "Wallet connected",
                    detail: walletAddress ? shortenAddress(walletAddress) : null,
                    hint: !walletAddress ? "Connect your wallet using the button above" : null,
                    complete: Boolean(walletAddress),
                  },
                  {
                    label: "Sufficient token balance",
                    detail:
                      isBalanceSufficient && walletTokenBalance != null
                        ? `${walletTokenBalance} / ${grossAmountLabel ?? totalAllocation} ${airdrop.tokenSymbol}`
                        : null,
                    hint:
                      !isBalanceSufficient && walletTokenBalance != null
                        ? `Need ${grossAmountLabel ?? totalAllocation} ${airdrop.tokenSymbol}, have ${walletTokenBalance}`
                        : isWalletBalanceLoading
                          ? "Checking balance..."
                          : !walletAddress
                            ? "Connect wallet to check balance"
                            : null,
                    complete: isBalanceSufficient && !isWalletBalanceLoading,
                  },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex items-center gap-3 border border-border bg-muted/20 px-4 py-4">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      item.complete ? "bg-success/20 text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={cn("text-sm", item.complete ? "text-foreground" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                    {item.detail ? <span className="ml-2 text-xs text-muted-foreground">{item.detail}</span> : null}
                    {!item.complete && item.hint ? (
                      <p className="mt-0.5 text-xs text-muted-foreground/70">{item.hint}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Deposit Tokens</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Transfer the allocation into the generated on-chain draft before starting the airdrop.
                </p>
              </div>
              <Button
                type="button"
                className="shrink-0 gap-2"
                onClick={onOpenConfirmDialog}
                disabled={!canDepositTokens}
              >
                {isDepositing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : !walletAddress ? (
                  <WalletMinimal className="h-4 w-4" />
                ) : (
                  <Coins className="h-4 w-4" />
                )}
                {isDepositing ? "Depositing..." : !walletAddress ? "Connect Wallet" : "Deposit Tokens"}
              </Button>
            </div>
            {!airdrop.airdropAddress ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Create the draft first to enable the deposit transaction.
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
