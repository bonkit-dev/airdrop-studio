"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Check, CircleAlert, Loader2, Play, WalletMinimal } from "lucide-react"
import { formatScheduleLabel, shortenAddress, type getDraftScheduleErrors } from "../../../lib/airdrop-utils"
import { useStudioStore } from "../../../lib/studio-store"
import { deriveRegisteredAllocation } from "../../../lib/airdrop-allocation"
import { cn } from "../../../lib/utils"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog"
import { FieldGroup } from "../../ui/field"
import { DateTimePickerField } from "./date-time-picker-field"

interface AirdropStepStartProps {
  recipientsCount: number
  scheduleState: ReturnType<typeof getDraftScheduleErrors>
  canStartAirdrop: boolean
  isStarting: boolean
  walletAddress: string | null
  onStartAirdrop: () => void
}

export function AirdropStepStart({
  recipientsCount,
  scheduleState,
  canStartAirdrop,
  isStarting,
  walletAddress,
  onStartAirdrop,
}: AirdropStepStartProps) {
  const { airdrop, updateAirdrop } = useStudioStore()
  const completedBatches = useStudioStore((state) => state.completedBatches)
  const totalAllocation = deriveRegisteredAllocation(completedBatches)
  const isStepComplete = Boolean(airdrop.startSignature)
  const [showStartConfirm, setShowStartConfirm] = useState(false)

  const hasEndDate = Boolean(airdrop.endDate)

  const scheduleDetail = formatScheduleLabel(airdrop.startDate, airdrop.endDate)

  const checklistItems = [
    {
      label: "Draft created on-chain",
      detail: airdrop.airdropAddress ? shortenAddress(airdrop.airdropAddress) : null,
      hint: !airdrop.airdropAddress ? "Complete the Draft step first" : null,
      complete: Boolean(airdrop.airdropAddress),
    },
    {
      label: "Recipients registered",
      detail: recipientsCount > 0 ? `${recipientsCount.toLocaleString()} recipients` : null,
      hint: !airdrop.recipientsSignature ? "Register recipients on-chain in the Recipients step" : null,
      complete: Boolean(airdrop.recipientsSignature),
    },
    {
      label: "Tokens deposited",
      detail: airdrop.depositSignature ? `${totalAllocation} ${airdrop.tokenSymbol}` : null,
      hint: !airdrop.depositSignature ? "Deposit tokens in the Deposit step" : null,
      complete: Boolean(airdrop.depositSignature),
    },
    {
      label: "Schedule",
      detail: scheduleDetail,
      hint: scheduleState.startError || scheduleState.endError ? "Fix schedule errors above" : null,
      complete: !scheduleState.startError && !scheduleState.endError,
    },
  ]

  // Close dialog after transaction completes or fails
  const [wasStarting, setWasStarting] = useState(false)
  useEffect(() => {
    if (isStarting) {
      setWasStarting(true)
    } else if (wasStarting) {
      setWasStarting(false)
      setShowStartConfirm(false)
    }
  }, [isStarting, wasStarting])

  const handleConfirmStart = () => {
    void onStartAirdrop()
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-3xl space-y-6">
      <fieldset disabled={isStepComplete} className={cn(isStepComplete && "opacity-60")}>
        <div className="space-y-6">
          <div className="border border-border bg-card p-6">
            <h3 className="text-2xl font-semibold text-foreground">Airdrop Schedule</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Adjust the start and end times before launching. The airdrop will go live on-chain with these dates.
            </p>
            <FieldGroup className="mt-6 grid gap-5 xl:grid-cols-2">
              <DateTimePickerField
                id="startDate-start-step"
                label="Start Date"
                value={airdrop.startDate}
                minValue={scheduleState.minimum}
                defaultValue={scheduleState.startDefault}
                errorMessage={scheduleState.startError}
                onChange={(next) => updateAirdrop("startDate", next)}
              />
              <DateTimePickerField
                id="endDate-start-step"
                label="End Date"
                value={airdrop.endDate}
                minValue={scheduleState.endMinimum}
                defaultValue={scheduleState.endDefault}
                errorMessage={scheduleState.endError}
                onChange={(next) => updateAirdrop("endDate", next)}
              />
            </FieldGroup>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Pre-flight Checklist</h3>
            <div className="space-y-3">
              {checklistItems.map((item) => (
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

          <div className="border border-amber-600/60 bg-amber-500/10 p-5">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-foreground">This action is irreversible</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once started, registered recipients can analyze on-chain transactions to claim the airdrop. Starting the
                  airdrop submits a final on-chain transaction. Ensure the schedule and token deposit are correct before
                  proceeding.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">Launch Airdrop</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit the start transaction to make the airdrop live on Solana.
            </p>
            <Button
              type="button"
              size="lg"
              className="mt-4 h-12 w-full gap-2 text-base"
              onClick={() => setShowStartConfirm(true)}
              disabled={!canStartAirdrop}
            >
              {isStarting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : !walletAddress ? (
                <WalletMinimal className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              {isStarting ? "Starting Airdrop..." : !walletAddress ? "Connect Wallet to Start" : "Start Airdrop"}
            </Button>
          </div>
        </div>
      </fieldset>

      <Dialog open={showStartConfirm} onOpenChange={setShowStartConfirm}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  hasEndDate ? "bg-amber-500/10" : "bg-destructive/10",
                )}
              >
                <AlertTriangle className={cn("h-5 w-5", hasEndDate ? "text-amber-500" : "text-destructive")} />
              </div>
              <DialogTitle>Confirm Airdrop Launch</DialogTitle>
            </div>
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Once started, registered recipients ({recipientsCount.toLocaleString()}) can discover and claim this
                airdrop by analyzing on-chain transactions. This action cannot be reversed.
              </p>
              {!hasEndDate ? (
                <div className="border border-destructive/40 bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">No end date set</p>
                  <p className="mt-1 text-xs text-destructive/80">
                    Without an end date, the deposited tokens ({totalAllocation} {airdrop.tokenSymbol}) cannot be
                    withdrawn from the vault. This is permanent.
                  </p>
                </div>
              ) : null}
              <div className="border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                <div className="flex justify-between py-1">
                  <span>Allocation</span>
                  <span className="font-medium text-foreground">
                    {totalAllocation} {airdrop.tokenSymbol}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Recipients</span>
                  <span className="font-medium text-foreground">{recipientsCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Schedule</span>
                  <span className="font-medium text-foreground">{scheduleDetail}</span>
                </div>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowStartConfirm(false)} disabled={isStarting}>
              Cancel
            </Button>
            <Button className="gap-2" onClick={handleConfirmStart} disabled={isStarting}>
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isStarting ? "Starting..." : hasEndDate ? "Start Airdrop" : "Start Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
