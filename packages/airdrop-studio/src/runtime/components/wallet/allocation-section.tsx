import { Check, CircleSlash, ExternalLink } from "lucide-react"
import { contrastTextColor } from "../../layouts/shared/theme-utils"

export type AllocationItem = {
  index: number
  amountLabel: string
  claimed: boolean
}

export type AllocationSectionViewProps = {
  status: "not-eligible" | "single" | "multi"
  allocations: AllocationItem[]
  primaryColor: string
  tokenSymbol?: string
  totalLabel?: string
  selectedIndex: number | null
  onSelect: (index: number | null) => void
  claimIdle: boolean
  explorerUrl?: string | null
  className?: string
}

export function AllocationSectionView({
  status,
  allocations,
  primaryColor,
  tokenSymbol,
  totalLabel: totalLabelProp,
  selectedIndex,
  onSelect,
  claimIdle,
  explorerUrl,
  className,
}: AllocationSectionViewProps) {
  if (status === "not-eligible") {
    return (
      <div className={className}>
        <div
          className="overflow-hidden border border-[var(--campaign-border)] text-left px-5 py-6 flex flex-col items-center gap-3"
          style={{
            borderRadius: "var(--campaign-radius-lg)",
            backgroundColor: "var(--campaign-card)",
          }}
        >
          <CircleSlash className="h-8 w-8 text-[var(--campaign-muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--campaign-foreground)]">Not Eligible</p>
          <p className="text-xs text-[var(--campaign-muted-foreground)] text-center leading-relaxed">
            No allocations found for this wallet.
          </p>
        </div>
      </div>
    )
  }

  const allClaimed = allocations.every((a) => a.claimed)

  if (status === "single") {
    const alloc = allocations[0]
    return (
      <div className={className}>
        <div
          className="overflow-hidden border text-left"
          style={{
            borderRadius: "var(--campaign-radius-lg)",
            backgroundColor: "var(--campaign-card)",
            borderColor: alloc.claimed ? "var(--campaign-border)" : `${primaryColor}30`,
          }}
        >
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--campaign-muted-foreground)] mb-1">Your allocation</p>
              <p className="text-2xl font-bold text-[var(--campaign-foreground)]">
                {alloc.amountLabel}
                {tokenSymbol ? (
                  <span className="text-sm font-normal text-[var(--campaign-muted-foreground)] ml-1.5">
                    {tokenSymbol}
                  </span>
                ) : null}
              </p>
            </div>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: alloc.claimed ? "var(--campaign-input-hover)" : `${primaryColor}18`,
                color: alloc.claimed ? "var(--campaign-muted-foreground)" : primaryColor,
              }}
            >
              <Check className="h-5 w-5" />
            </div>
          </div>
          {alloc.claimed ? (
            <div
              className="px-5 py-3 border-t border-[var(--campaign-border)] text-center"
              style={{ backgroundColor: "var(--campaign-input)" }}
            >
              <p className="text-xs font-medium text-[var(--campaign-muted-foreground)]">
                <Check className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                Successfully claimed
                {explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-2 underline underline-offset-2"
                    style={{ color: "var(--campaign-foreground)" }}
                  >
                    View on Solscan
                    <ExternalLink className="inline h-3 w-3" />
                  </a>
                ) : null}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  // Multi
  const unclaimedCount = allocations.filter((a) => !a.claimed).length
  const totalLabel = totalLabelProp ?? "—"

  return (
    <div className={className}>
      <div
        className="overflow-hidden border border-[var(--campaign-border)] text-left"
        style={{
          borderRadius: "var(--campaign-radius-lg)",
          backgroundColor: "var(--campaign-card)",
        }}
      >
        <div className="px-4 py-3 border-b border-[var(--campaign-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: allClaimed ? "var(--campaign-muted-foreground)" : primaryColor }}
            />
            <p className="text-xs font-medium text-[var(--campaign-foreground)]">Your Allocations</p>
          </div>
          <p className="text-xs text-[var(--campaign-muted-foreground)]">{allocations.length} found</p>
        </div>
        {!allClaimed && selectedIndex === null && claimIdle ? (
          <p
            className="px-4 py-2 text-xs text-[var(--campaign-muted-foreground)] border-b border-[var(--campaign-border)]"
            style={{ backgroundColor: `${primaryColor}06` }}
          >
            Select an allocation to claim
          </p>
        ) : null}
        <div className="divide-y divide-[var(--campaign-border)]">
          {allocations.map((alloc) => {
            const isSelected = selectedIndex === alloc.index
            const selectable = !alloc.claimed && claimIdle

            return (
              <button
                key={alloc.index}
                type="button"
                disabled={!selectable}
                onClick={() => selectable && onSelect(isSelected ? null : alloc.index)}
                className={`flex w-full items-center justify-between px-4 py-3 gap-3 text-left transition-colors ${
                  selectable ? "cursor-pointer hover:bg-[var(--campaign-input)]" : ""
                } ${alloc.claimed ? "opacity-50" : ""}`}
                style={
                  isSelected
                    ? { backgroundColor: `${primaryColor}08`, boxShadow: `inset 0 0 0 1px ${primaryColor}40` }
                    : undefined
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                    style={{
                      backgroundColor: alloc.claimed
                        ? "var(--campaign-input)"
                        : isSelected
                          ? primaryColor
                          : `${primaryColor}18`,
                      color: alloc.claimed
                        ? "var(--campaign-muted-foreground)"
                        : isSelected
                          ? contrastTextColor(primaryColor)
                          : primaryColor,
                    }}
                  >
                    {isSelected ? (
                      <Check className="h-4 w-4" />
                    ) : alloc.claimed ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold">#{alloc.index + 1}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--campaign-foreground)]">
                    {alloc.amountLabel}
                    {tokenSymbol ? (
                      <span className="text-xs text-[var(--campaign-muted-foreground)] ml-1">{tokenSymbol}</span>
                    ) : null}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: alloc.claimed
                      ? "var(--campaign-input)"
                      : isSelected
                        ? `${primaryColor}25`
                        : `${primaryColor}14`,
                    color: alloc.claimed ? "var(--campaign-muted-foreground)" : primaryColor,
                  }}
                >
                  {alloc.claimed ? "Claimed" : isSelected ? "Selected" : "Unclaimed"}
                </span>
              </button>
            )
          })}
        </div>
        {allClaimed ? (
          <div
            className="px-4 py-3 border-t border-[var(--campaign-border)] text-center"
            style={{ backgroundColor: "var(--campaign-input)" }}
          >
            <p className="text-xs font-medium text-[var(--campaign-foreground)]">
              <Check className="inline h-3.5 w-3.5 mr-1 -mt-0.5" style={{ color: primaryColor }} />
              All allocations claimed
              {explorerUrl ? (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 underline underline-offset-2"
                  style={{ color: primaryColor }}
                >
                  View on Solscan
                  <ExternalLink className="inline h-3 w-3" />
                </a>
              ) : null}
            </p>
          </div>
        ) : (
          <div
            className="px-4 py-2.5 border-t border-[var(--campaign-border)] flex items-center justify-between"
            style={{ backgroundColor: "var(--campaign-input)" }}
          >
            <p className="text-xs text-[var(--campaign-muted-foreground)]">{unclaimedCount} unclaimed</p>
            <p className="text-sm font-semibold text-[var(--campaign-foreground)]">
              {totalLabel}
              {tokenSymbol ? (
                <span className="text-xs font-normal text-[var(--campaign-muted-foreground)] ml-1">{tokenSymbol}</span>
              ) : null}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
