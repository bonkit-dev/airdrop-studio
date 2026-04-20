"use client"

import { Check } from "lucide-react"
import { useStudioStore, type AirdropStep } from "../../../lib/studio-store"
import { shortenAddress } from "../../../lib/airdrop-utils"
import {
  deriveRegisteredAllocation,
  deriveRegisteredRecipientCount,
} from "../../../lib/airdrop-allocation"
import { Separator } from "../../ui/separator"

const stepLabels: Record<AirdropStep, string> = {
  draft: "Draft",
  recipients: "Recipients",
  deposit: "Deposit",
  start: "Start",
  complete: "Complete",
}

export function CreateAirdropPanel() {
  const { config, airdrop, checklist } = useStudioStore()
  const completedBatches = useStudioStore((state) => state.completedBatches)
  const createAirdropItems = checklist.filter((item) => item.section === "create-airdrop")

  const hasToken = Boolean(airdrop.mintAddress && airdrop.tokenSymbol)
  const registeredCount = deriveRegisteredRecipientCount(completedBatches)
  const registeredAllocation = deriveRegisteredAllocation(completedBatches)
  const hasRecipients = registeredCount > 0 || airdrop.recipients.length > 0
  const hasAllocation = registeredAllocation !== "0"
  const hasDeposit = Boolean(airdrop.depositSignature)
  const isLive = Boolean(airdrop.startSignature)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Create Airdrop</h3>
        <p className="text-xs text-muted-foreground">
          Current step: <span className="font-medium text-foreground">{stepLabels[airdrop.currentStep]}</span>
        </p>
      </div>

      {/* Key metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Token</span>
          <span className="text-sm font-medium text-foreground">
            {hasToken ? `${airdrop.tokenSymbol}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Network</span>
          <span className="text-sm font-medium text-foreground">
            {config.network === "mainnet-beta" ? "Mainnet" : "Devnet"}
          </span>
        </div>
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Recipients</span>
          <span className="text-sm font-medium text-foreground">
            {hasRecipients
              ? airdrop.recipients.length > 0
                ? `${registeredCount.toLocaleString()}  +${airdrop.recipients.length.toLocaleString()}`
                : registeredCount.toLocaleString()
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Allocation</span>
          <span className="text-sm font-medium text-foreground">
            {hasAllocation ? `${registeredAllocation} ${airdrop.tokenSymbol}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Deposit</span>
          <span className={`text-sm font-medium ${hasDeposit ? "text-success" : "text-muted-foreground"}`}>
            {hasDeposit ? "Deposited" : "Pending"}
          </span>
        </div>
        <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Status</span>
          <span className={`text-sm font-medium ${isLive ? "text-success" : "text-muted-foreground"}`}>
            {isLive ? "Live" : "Not started"}
          </span>
        </div>
        {airdrop.airdropAddress ? (
          <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Address</span>
            <span className="text-sm font-mono text-foreground">{shortenAddress(airdrop.airdropAddress)}</span>
          </div>
        ) : null}
      </div>

      <Separator />

      {/* Checklist */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Checklist</h4>
        <div className="space-y-1.5">
          {createAirdropItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 px-1 py-1.5">
              <div
                className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${item.completed ? "bg-primary border-primary" : "border-muted-foreground/30"}`}
              >
                {item.completed ? <Check className="h-2.5 w-2.5 text-primary-foreground" /> : null}
              </div>
              <span className={`text-sm ${item.completed ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
