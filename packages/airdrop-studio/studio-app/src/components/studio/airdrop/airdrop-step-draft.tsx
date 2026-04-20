"use client"

import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, ArrowRight, Check, CheckCircle2, Loader2, Network, Rocket, Wallet, WalletMinimal } from "lucide-react"
import type { MintProbeState } from "../../../lib/airdrop-utils"
import { formatScheduleLabel, getDraftScheduleErrors, shortenAddress } from "../../../lib/airdrop-utils"
import { useStudioStore } from "../../../lib/studio-store"
import { cn } from "../../../lib/utils"
import { DEFAULT_RPC_BY_NETWORK, describeDetectedCluster } from "../../../lib/rpc-endpoints"
import type { RpcClusterCheckState } from "../../../hooks/use-rpc-cluster-check"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Field, FieldGroup, FieldLabel } from "../../ui/field"
import { Input } from "../../ui/input"
import { DateTimePickerField } from "./date-time-picker-field"

interface AirdropStepDraftProps {
  mintProbe: MintProbeState
  scheduleState: ReturnType<typeof getDraftScheduleErrors>
  canCreateDraft: boolean
  isSubmittingDraft: boolean
  connected: boolean
  rpcCheck: RpcClusterCheckState
  onCreateDraft: () => void
  onContinue?: () => void
}

export function AirdropStepDraft({
  mintProbe,
  scheduleState,
  canCreateDraft,
  isSubmittingDraft,
  connected,
  rpcCheck,
  onCreateDraft,
  onContinue,
}: AirdropStepDraftProps) {
  const { config, airdrop, updateConfig, updateAirdrop } = useStudioStore()
  const isDraftCreated = Boolean(airdrop.airdropAddress)
  const networkLabel = config.network === "mainnet-beta" ? "mainnet" : "devnet"
  const networkLabelDisplay = config.network === "mainnet-beta" ? "Mainnet" : "Devnet"
  const isDefaultPublicRpc = config.rpcUrl === DEFAULT_RPC_BY_NETWORK[config.network]
  const showMainnetRpcWarning = config.network === "mainnet-beta" && isDefaultPublicRpc

  const [showDraftConfirm, setShowDraftConfirm] = useState(false)
  const [wasSubmittingDraft, setWasSubmittingDraft] = useState(false)

  useEffect(() => {
    if (isSubmittingDraft) {
      setWasSubmittingDraft(true)
    } else if (wasSubmittingDraft) {
      setWasSubmittingDraft(false)
      setShowDraftConfirm(false)
    }
  }, [isSubmittingDraft, wasSubmittingDraft])

  return (
    <div className="mt-6 space-y-6">
      {isDraftCreated ? (
        <div className="border border-success/30 bg-success/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-semibold text-foreground">Draft created. Continue to register recipients.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Network and token are locked. RPC can be updated here; schedule can be adjusted in the Start step.
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

      <div>
        <div className="grid gap-6 2xl:grid-cols-12">
          <div className="space-y-8 2xl:col-span-7">
            <div className="space-y-4 border-b border-border pb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Network & RPC</p>
              </div>
              <div className={cn("grid gap-3 sm:grid-cols-2", isDraftCreated && "opacity-60")}>
                {[
                  { value: "mainnet-beta", label: "Mainnet", hint: "Solana mainnet-beta" },
                  { value: "devnet", label: "Devnet", hint: "Solana devnet" },
                ].map((networkOption) => (
                  <button
                    key={networkOption.value}
                    type="button"
                    disabled={isDraftCreated}
                    onClick={() => updateConfig("network", networkOption.value as typeof config.network)}
                    className={cn(
                      "border p-4 text-left transition-colors",
                      config.network === networkOption.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/10 hover:border-muted-foreground/40",
                      isDraftCreated && "cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          config.network === networkOption.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground",
                        )}
                      >
                        <Network className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{networkOption.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{networkOption.hint}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Field>
                <FieldLabel>RPC URL</FieldLabel>
                <Input
                  value={config.rpcUrl}
                  onChange={(event) => updateConfig("rpcUrl", event.target.value)}
                  className="font-mono text-xs"
                />
                {config.network === "mainnet-beta" ? (
                  <div className="mt-2 flex items-start gap-2 border border-amber-500/50 bg-amber-500/10 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-xs leading-relaxed text-foreground">
                      <span className="font-semibold text-amber-500">Mainnet requires your own RPC endpoint.</span>{" "}
                      The default public RPC is rate-limited and will fail during heavy claim traffic. Replace it with a dedicated endpoint (e.g., Helius, QuickNode, Triton) before launching.
                    </p>
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Default RPC works for devnet. No change needed unless you have a custom endpoint.
                  </p>
                )}
                {rpcCheck.status === "loading" ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Verifying RPC cluster...
                  </p>
                ) : null}
                {rpcCheck.status === "ok" ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-success">
                    <CheckCircle2 className="h-3 w-3" /> Matches {networkLabel}.
                  </p>
                ) : null}
                {rpcCheck.status === "mismatch" ? (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    This RPC appears to be {describeDetectedCluster(rpcCheck.detected)}. Use a {networkLabel} endpoint.
                  </p>
                ) : null}
                {rpcCheck.status === "error" ? (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    Failed to validate RPC: {rpcCheck.message}
                  </p>
                ) : null}
              </Field>
            </div>

            <fieldset
              disabled={isDraftCreated}
              className={cn("space-y-4 border-b border-border pb-8", isDraftCreated && "opacity-60")}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Token</p>
              </div>
              <FieldGroup className="grid gap-5">
                <Field>
                  <FieldLabel>Token Mint Address</FieldLabel>
                  <Input
                    value={airdrop.mintAddress}
                    onChange={(event) => updateAirdrop("mintAddress", event.target.value)}
                    className="font-mono text-xs"
                    placeholder="Token mint public key"
                  />
                </Field>
              </FieldGroup>
            </fieldset>

            <fieldset
              disabled={isDraftCreated}
              className={cn("space-y-4 border-b border-border pb-8", isDraftCreated && "opacity-60")}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Schedule</p>
              </div>
              <FieldGroup className="grid gap-5 xl:grid-cols-2">
                <DateTimePickerField
                  id="startDate"
                  label="Start Date"
                  value={airdrop.startDate}
                  minValue={scheduleState.minimum}
                  defaultValue={scheduleState.startDefault}
                  errorMessage={scheduleState.startError}
                  onChange={(next) => updateAirdrop("startDate", next)}
                />
                <DateTimePickerField
                  id="endDate"
                  label="End Date"
                  value={airdrop.endDate}
                  minValue={scheduleState.endMinimum}
                  defaultValue={scheduleState.endDefault}
                  errorMessage={scheduleState.endError}
                  onChange={(next) => updateAirdrop("endDate", next)}
                />
              </FieldGroup>
            </fieldset>

            {!isDraftCreated ? (
              <div className="border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Create On-Chain Draft</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Submit the draft transaction to create the on-chain airdrop account.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  className="mt-4 w-full gap-2"
                  onClick={() => setShowDraftConfirm(true)}
                  disabled={!canCreateDraft}
                >
                  {isSubmittingDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : !connected ? (
                    <WalletMinimal className="h-4 w-4" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                  {isSubmittingDraft
                    ? "Creating Draft..."
                    : !connected
                      ? "Connect Wallet to Create Draft"
                      : "Create Draft"}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-6 2xl:col-span-5">
            <fieldset
              disabled={isDraftCreated}
              className={cn("border border-border bg-muted/20 p-4", isDraftCreated && "opacity-60")}
            >
              <FieldLabel>Claim Type</FieldLabel>
              <div className="mt-3 grid gap-3">
                <button
                  type="button"
                  onClick={() => updateConfig("claimMode", "onchain")}
                  className={cn(
                    "border p-4 text-left transition-colors",
                    config.claimMode === "onchain"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/20 hover:border-muted-foreground/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          config.claimMode === "onchain"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground",
                        )}
                      >
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">On-chain</p>
                        <p className="mt-1 text-xs text-muted-foreground">Available now</p>
                      </div>
                    </div>
                    {config.claimMode === "onchain" ? <Check className="h-4 w-4 text-primary" /> : null}
                  </div>
                </button>

                <div className="border border-border bg-muted/10 p-4 opacity-55">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-muted-foreground">
                        <Network className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Merkle</p>
                        <p className="mt-1 text-xs text-muted-foreground">Disabled for now</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      Disabled
                    </Badge>
                  </div>
                </div>
              </div>
            </fieldset>

            <div className="border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Detected Token</p>
              <div className="mt-3 grid gap-3">
                <div className="border border-border bg-card px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Token Name</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {airdrop.tokenName || "Auto detected from metadata"}
                  </p>
                </div>
                <div className="border border-border bg-card px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Token Symbol</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {airdrop.tokenSymbol || "Auto detected from metadata"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mint Auto Detection</p>
              {mintProbe.status === "idle" ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Enter a mint address to detect the token program automatically.
                </p>
              ) : null}
              {mintProbe.status === "loading" ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Inspecting mint account...
                </div>
              ) : null}
              {mintProbe.status === "invalid" || mintProbe.status === "error" ? (
                <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{mintProbe.message}</span>
                </div>
              ) : null}
              {mintProbe.status === "success" ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3 border border-border bg-card px-3 py-3">
                    {mintProbe.imageUrl ? (
                      <img
                        src={mintProbe.imageUrl}
                        alt={mintProbe.symbol}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                        {mintProbe.symbol.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{mintProbe.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{mintProbe.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border border-border bg-card px-3 py-3">
                    <span className="text-sm text-muted-foreground">Program</span>
                    <span className="text-sm font-medium text-foreground">{mintProbe.programLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border border-border bg-card px-3 py-3">
                    <span className="text-sm text-muted-foreground">Decimals</span>
                    <span className="text-sm font-medium text-foreground">{mintProbe.decimals}</span>
                  </div>
                  {mintProbe.metadataUri ? (
                    <div className="border border-border bg-card px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Metadata URI</p>
                      <p className="mt-2 break-all text-xs text-foreground">{mintProbe.metadataUri}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDraftConfirm} onOpenChange={setShowDraftConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Draft Creation</DialogTitle>
            <p className="pt-2 text-sm text-muted-foreground">
              Once submitted, network and token become locked. Review the configuration before signing.
            </p>
          </DialogHeader>

          <div className="space-y-2 border border-border bg-muted/20 p-3 text-xs">
            <div className="flex justify-between gap-4 py-1">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium text-foreground">{networkLabelDisplay}</span>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <span className="text-muted-foreground">Token</span>
              <div className="text-right">
                {mintProbe.status === "success" ? (
                  <p className="font-medium text-foreground">
                    {mintProbe.name} ({mintProbe.symbol})
                  </p>
                ) : null}
                <p className="font-mono text-muted-foreground">{shortenAddress(airdrop.mintAddress)}</p>
              </div>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <span className="text-muted-foreground">RPC</span>
              <span className="break-all text-right font-mono text-foreground">{config.rpcUrl}</span>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <span className="text-muted-foreground">Schedule</span>
              <span className="text-right font-medium text-foreground">
                {formatScheduleLabel(airdrop.startDate, airdrop.endDate)}
              </span>
            </div>
          </div>

          {showMainnetRpcWarning ? (
            <div className="flex items-start gap-2 border border-amber-500/50 bg-amber-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-foreground">
                <span className="font-semibold text-amber-500">Using the default public RPC on mainnet.</span>{" "}
                Replace with a dedicated endpoint before heavy claim traffic.
              </p>
            </div>
          ) : null}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDraftConfirm(false)}
              disabled={isSubmittingDraft}
            >
              Cancel
            </Button>
            <Button
              className="gap-2"
              onClick={() => void onCreateDraft()}
              disabled={isSubmittingDraft}
            >
              {isSubmittingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {isSubmittingDraft ? "Creating..." : "Create Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
