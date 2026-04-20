import { useCallback, useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { LayoutSlots } from "../slots"
import { useCountdownPhase, type CountdownPhase } from "./CountdownBlock"
import { isLightHex } from "./theme-utils"

type BadgeTone = "live" | "pending" | "neutral"

function toneFor(phase: CountdownPhase): BadgeTone {
  if (phase === "starts-in") return "pending"
  if (phase === "ended") return "neutral"
  return "live"
}

function labelFor(
  phase: CountdownPhase,
  startLabel: string,
  liveLabel: string,
  endedLabel: string,
): { value: string; field: "statusBadgeStartLabel" | "statusBadgeLiveLabel" | "statusBadgeEndedLabel" } {
  if (phase === "starts-in") return { value: startLabel, field: "statusBadgeStartLabel" }
  if (phase === "ended") return { value: endedLabel, field: "statusBadgeEndedLabel" }
  return { value: liveLabel, field: "statusBadgeLiveLabel" }
}

function targetDateFor(phase: CountdownPhase, startDate?: string, endDate?: string): string | undefined {
  if (phase === "starts-in") return startDate
  if (phase === "ends-in") return endDate
  if (phase === "ended") return endDate
  return undefined
}

function prefixFor(phase: CountdownPhase): string {
  if (phase === "starts-in") return "Starts"
  if (phase === "ends-in") return "Ends"
  if (phase === "ended") return "Ended"
  return ""
}

// Hook that re-formats the date after hydration so SSR/client output matches on first paint,
// then reveals the locale-formatted version using the user's actual timezone.
function useLocaleDateParts(iso?: string): { short: string; full: string } | null {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  if (!ready) return { short: "", full: "" }
  const short = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
  const full = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date)
  return { short, full }
}

// Lightweight portal tooltip: instant show on hover/focus, tap-to-toggle on touch devices.
// Rendered into document.body so parent backdrop-filter / opacity (glass panels) don't bleed in.
// Colors are inlined (gray-900/gray-100 pair, auto-inverted for light themes) because the portal
// lands outside of any --campaign-* variable scope.
function InlineTooltip({ content, children, className, isLight }: { content: string; children: React.ReactNode; className?: string; isLight: boolean }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const tooltipId = useId()
  const containerRef = useRef<HTMLSpanElement | null>(null)

  const updatePos = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
  }, [])

  const openTooltip = useCallback(() => {
    updatePos()
    setOpen(true)
  }, [updatePos])

  useEffect(() => {
    if (!open) return
    const reposition = () => updatePos()
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
    }
  }, [open, updatePos])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return
      if (e.target instanceof Node && containerRef.current.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener("mousedown", handler)
    window.addEventListener("touchstart", handler)
    return () => {
      window.removeEventListener("mousedown", handler)
      window.removeEventListener("touchstart", handler)
    }
  }, [open])

  const tooltipStyle: React.CSSProperties = isLight
    ? {
        backgroundColor: "rgba(249, 250, 251, 0.97)",
        color: "rgb(17, 24, 39)",
        border: "1px solid rgba(0, 0, 0, 0.12)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
      }
    : {
        backgroundColor: "rgba(17, 24, 39, 0.97)",
        color: "rgb(243, 244, 246)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
      }

  const tooltipNode =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium normal-case tracking-normal"
            style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)", ...tooltipStyle }}
          >
            {content}
          </span>,
          document.body,
        )
      : null

  return (
    <span
      ref={containerRef}
      className={`inline-flex ${className ?? ""}`}
      onMouseEnter={openTooltip}
      onMouseLeave={() => setOpen(false)}
      onFocus={openTooltip}
      onBlur={() => setOpen(false)}
      onClick={() => (open ? setOpen(false) : openTooltip())}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}
      {tooltipNode}
    </span>
  )
}

export function StatusBadge({
  startDate,
  endDate,
  startLabel,
  liveLabel,
  endedLabel,
  accentColor,
  backgroundColor,
  slots,
  className,
  compact = false,
}: {
  startDate?: string
  endDate?: string
  startLabel: string
  liveLabel: string
  endedLabel: string
  accentColor: string
  /** Hero/page background — used to pick a readable tooltip color (light theme → dark text, etc.). */
  backgroundColor: string
  slots: LayoutSlots
  className?: string
  compact?: boolean
}) {
  const phase = useCountdownPhase(startDate, endDate)
  const tone = toneFor(phase)
  const label = labelFor(phase, startLabel, liveLabel, endedLabel)
  const target = targetDateFor(phase, startDate, endDate)
  const prefix = prefixFor(phase)
  const dateParts = useLocaleDateParts(target)
  const isLight = isLightHex(backgroundColor)

  const chipStyle: React.CSSProperties =
    tone === "live"
      ? { backgroundColor: `${accentColor}1F`, color: accentColor, borderColor: `${accentColor}40` }
      : { backgroundColor: "var(--campaign-input)", color: "var(--campaign-muted-foreground)", borderColor: "var(--campaign-border)" }

  const dotStyle: React.CSSProperties =
    tone === "live"
      ? { backgroundColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}25` }
      : { backgroundColor: "var(--campaign-muted-foreground)", opacity: 0.6 }

  const chipClass = compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"

  const chip = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-[0.12em] ${chipClass}`}
      style={chipStyle}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${tone === "live" ? "animate-pulse" : ""}`}
        style={dotStyle}
        aria-hidden
      />
      <slots.Text field={label.field} value={label.value} className="" tag="span" />
    </span>
  )

  const dateLine = dateParts && dateParts.short && target ? (
    <span className="text-[10px] uppercase tracking-wider text-[var(--campaign-muted-foreground)]">
      {prefix} {dateParts.short}
    </span>
  ) : null

  const tooltipText = dateParts && target ? `${prefix} ${dateParts.full}` : null

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className ?? ""}`}>
      {chip}
      {dateLine
        ? tooltipText
          ? <InlineTooltip content={tooltipText} isLight={isLight}>{dateLine}</InlineTooltip>
          : dateLine
        : null}
    </div>
  )
}
