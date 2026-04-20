"use client"

import { CheckCircle2, Coins, AlertCircle, Loader2 } from "lucide-react"
import { formatTokenAmount } from "../../../lib/airdrop-utils"
import type { TransferFeeEstimate } from "../../../lib/airdrop-transfer-fee"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog"

interface AirdropDepositConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requiredAmount: string
  tokenSymbol: string
  walletBalance: string | null
  isBalanceSufficient: boolean
  transferFeeEstimate: TransferFeeEstimate | null
  decimals: number
  onConfirm: () => void
}

export function AirdropDepositConfirmDialog({
  open,
  onOpenChange,
  requiredAmount,
  tokenSymbol,
  walletBalance,
  isBalanceSufficient,
  transferFeeEstimate,
  decimals,
  onConfirm,
}: AirdropDepositConfirmDialogProps) {
  const hasFee = Boolean(transferFeeEstimate)
  const feeAmountLabel = transferFeeEstimate
    ? formatTokenAmount(transferFeeEstimate.feeAmount.toString(), decimals)
    : null
  const grossAmountLabel = transferFeeEstimate
    ? formatTokenAmount(transferFeeEstimate.grossAmount.toString(), decimals)
    : null
  const feeRateLabel = transferFeeEstimate
    ? transferFeeEstimate.basisPoints % 100 === 0
      ? `${transferFeeEstimate.basisPoints / 100}%`
      : `${(transferFeeEstimate.basisPoints / 100).toFixed(2)}%`
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Confirm Token Deposit</DialogTitle>
          </div>
          <DialogDescription className="space-y-3 pt-2" asChild>
            <div>
              <div className="flex items-center justify-between border border-border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Required allocation</span>
                <span className="text-sm font-semibold text-foreground">
                  {requiredAmount} {tokenSymbol}
                </span>
              </div>

              {hasFee ? (
                <>
                  <div className="flex items-center justify-between border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Transfer fee ({feeRateLabel})</span>
                    <span className="text-sm font-semibold text-amber-500">
                      +{feeAmountLabel} {tokenSymbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border border-border bg-muted/20 px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">Total to deposit</span>
                    <span className="text-sm font-semibold text-foreground">
                      {grossAmountLabel} {tokenSymbol}
                    </span>
                  </div>
                </>
              ) : null}

              <div className="flex items-center justify-between border border-border bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Wallet balance</span>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {walletBalance === null ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <span className={isBalanceSufficient ? "text-success" : "text-destructive"}>
                        {walletBalance} {tokenSymbol}
                      </span>
                      {isBalanceSufficient ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </>
                  )}
                </span>
              </div>

              {!isBalanceSufficient && walletBalance !== null ? (
                <p className="text-sm text-destructive">
                  Your wallet does not have enough tokens to complete this deposit.
                </p>
              ) : null}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!isBalanceSufficient}
            className="gap-2"
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            <Coins className="h-4 w-4" />
            Deposit Tokens
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
