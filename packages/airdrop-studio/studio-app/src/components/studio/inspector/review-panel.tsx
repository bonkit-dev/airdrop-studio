"use client"

import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useStudioStore } from "../../../lib/studio-store"
import { shortenAddress, formatScheduleLabel } from "../../../lib/airdrop-utils"
import {
  deriveRegisteredAllocation,
  deriveRegisteredRecipientCount,
} from "../../../lib/airdrop-allocation"
import { DEFAULT_RPC_BY_NETWORK } from "../../../lib/rpc-endpoints"
import { cn } from "../../../lib/utils"

export function ReviewPanel() {
  const { config, airdrop, checklist } = useStudioStore()
  const completedBatches = useStudioStore((state) => state.completedBatches)
  const registeredCount = deriveRegisteredRecipientCount(completedBatches)
  const registeredAllocation = deriveRegisteredAllocation(completedBatches)

  const airdropCreated = Boolean(airdrop.airdropAddress)
  const airdropStatusLabel = (() => {
    if (!airdropCreated) return "Not created"
    if (airdrop.startSignature) {
      const now = Date.now()
      const end = airdrop.endDate ? new Date(airdrop.endDate).getTime() : 0
      if (end && now > end) return "Ended"
      return "Live"
    }
    return "Not started"
  })()

  const countdownEnabled = config.showCountdown
  const hasStart = airdropCreated && Boolean(airdrop.startDate)
  const hasEnd = airdropCreated && Boolean(airdrop.endDate)
  const countdownWarning = countdownEnabled && airdropCreated && !hasStart && !hasEnd
    ? "Countdown is enabled but no schedule is set. Set a start or end date, or disable the countdown."
    : countdownEnabled && !airdropCreated
      ? "Countdown is enabled but airdrop has not been created yet."
      : null

  const isMainnetPublicRpc =
    config.network === "mainnet-beta" && config.rpcUrl === DEFAULT_RPC_BY_NETWORK["mainnet-beta"]

  const sections = [
    {
      title: "Choose Layout",
      items: [
        { label: "Preset", value: config.layoutPreset, ok: Boolean(config.layoutPreset) },
        { label: "Radius", value: `${config.globalRadius}px`, ok: true },
        {
          label: "Countdown",
          value: !countdownEnabled
            ? "Disabled"
            : countdownWarning
              ? "Enabled (no schedule)"
              : hasStart && hasEnd
                ? "Start → End"
                : hasStart
                  ? "Start → Open-ended"
                  : hasEnd
                    ? "Immediate → End"
                    : "Immediate start",
          ok: !countdownWarning,
        },
      ],
    },
    {
      title: "Pick Theme",
      items: [
        {
          label: "Theme",
          value: config.useCustomColors ? "Custom" : config.themePreset,
          ok: true,
        },
      ],
    },
    {
      title: "Set Branding",
      items: [
        { label: "Name", value: config.brandName, ok: Boolean(config.brandName) },
        { label: "Logo", value: config.logoUrl ? "Uploaded" : "None (optional)", ok: true },
        { label: "Hero Title", value: config.heroTitle || "Not set", ok: Boolean(config.heroTitle) },
      ],
    },
    {
      title: "Configure Network",
      items: [
        {
          label: "Network",
          value: config.network === "mainnet-beta" ? "Mainnet" : "Devnet",
          ok: true,
        },
        { label: "Claim Mode", value: config.claimMode, ok: true },
        { label: "RPC", value: config.rpcUrl ? "Configured" : "Missing", ok: Boolean(config.rpcUrl) },
      ],
    },
    {
      title: "Create Airdrop",
      items: airdropCreated
        ? [
            {
              label: "Address",
              value: shortenAddress(airdrop.airdropAddress || ""),
              ok: true,
            },
            {
              label: "Token",
              value: airdrop.tokenSymbol || "Not set",
              ok: Boolean(airdrop.tokenSymbol),
            },
            {
              label: "Recipients",
              value: registeredCount > 0 ? `${registeredCount.toLocaleString()} registered` : "None",
              ok: registeredCount > 0,
            },
            {
              label: "Allocation",
              value: registeredAllocation !== "0"
                ? `${registeredAllocation} ${airdrop.tokenSymbol}`
                : "Not set",
              ok: registeredAllocation !== "0",
            },
            {
              label: "Schedule",
              value: formatScheduleLabel(airdrop.startDate, airdrop.endDate),
              ok: true,
            },
            {
              label: "Deposit transaction",
              value: airdrop.depositSignature ? "Completed" : "Pending",
              ok: Boolean(airdrop.depositSignature),
            },
            {
              label: "Status",
              value: airdropStatusLabel,
              ok: Boolean(airdrop.startSignature),
            },
          ]
        : [
            {
              label: "Address",
              value: "Not created",
              ok: false,
            },
          ],
    },
  ]

  const allComplete = checklist
    .filter((item) => item.section !== "generate-app")
    .every((item) => item.completed)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Review</h3>
        <p className="text-sm text-muted-foreground">
          Verify your configuration before generating the app.
        </p>
      </div>

      {allComplete && !countdownWarning ? (
        <div className="flex items-center gap-2.5 border border-success/30 bg-success/5 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <p className="text-sm text-success">All steps complete. Ready to generate.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-400">{countdownWarning || "Some steps are incomplete."}</p>
        </div>
      )}

      {isMainnetPublicRpc ? (
        <div className="flex items-start gap-2.5 border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-foreground">
            <span className="font-semibold text-amber-500">Mainnet is using the default public RPC.</span>{" "}
            Replace with a dedicated endpoint in the Create Airdrop step before launching; public RPCs will fail under heavy claim traffic.
          </p>
        </div>
      ) : null}

      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2 border border-border bg-muted/30 px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={cn("text-sm font-medium truncate max-w-[60%] text-right", item.ok ? "text-foreground" : "text-muted-foreground/60")}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
