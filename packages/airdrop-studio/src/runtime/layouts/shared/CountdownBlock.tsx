import { memo, useEffect, useState } from "react"
import type { LayoutSlots } from "../slots"
import { getGlassPanelStyle } from "./theme-utils"

export type CountdownPhase = "hidden" | "ended" | "starts-in" | "ends-in"

function computePhase(startMs: number, endMs: number, nowMs: number): CountdownPhase {
  if (startMs && nowMs < startMs) return "starts-in"
  if (endMs) {
    if (nowMs <= endMs) return "ends-in"
    return "ended"
  }
  // No end date. If we're past the start (or no start), the airdrop is live indefinitely
  // and a countdown conveys nothing — hide it. The Live status badge elsewhere covers this.
  return "hidden"
}

export function useCountdownPhase(startDate?: string, endDate?: string): CountdownPhase {
  return useCountdownState(startDate, endDate).phase
}

function useCountdownState(startDate?: string, endDate?: string): {
  phase: CountdownPhase
  h: number
  m: number
  s: number
} {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const startMs = startDate ? new Date(startDate).getTime() : 0
  const endMs = endDate ? new Date(endDate).getTime() : 0
  const phase = computePhase(startMs, endMs, now)
  const target = phase === "starts-in" ? startMs : phase === "ends-in" ? endMs : 0
  const remaining = Math.max(0, target - now)
  const sec = Math.floor(remaining / 1000)
  return {
    phase,
    h: Math.floor(sec / 3600),
    m: Math.floor((sec % 3600) / 60),
    s: sec % 60,
  }
}

const CountdownUnit = memo(function CountdownUnit({
  value,
  label,
  field,
  color,
  slots,
  hero,
  glass,
}: {
  value: string
  label: string
  field: string
  color: string
  slots: LayoutSlots
  hero?: boolean
  glass?: boolean
}) {
  if (glass) {
    return (
      <div className="flex flex-col items-center">
        <span
          className={hero ? "text-4xl font-bold sm:text-5xl" : "text-2xl font-bold sm:text-3xl"}
          style={{ color }}
        >
          {value}
        </span>
        <slots.Text
          field={field}
          value={label}
          className={hero
            ? "mt-1 text-[10px] uppercase tracking-[0.15em] text-[var(--campaign-muted-foreground)] font-medium"
            : "mt-0.5 text-[9px] uppercase tracking-[0.15em] text-[var(--campaign-muted-foreground)] font-medium"
          }
          tag="span"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={hero
          ? "flex h-16 w-16 items-center justify-center rounded-[var(--campaign-radius-lg)] text-2xl font-bold text-[var(--campaign-foreground)] sm:h-20 sm:w-20 sm:text-3xl"
          : "flex h-11 w-11 items-center justify-center rounded-[var(--campaign-radius-lg)] text-base font-bold text-[var(--campaign-foreground)] sm:h-12 sm:w-12 sm:text-lg"
        }
        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
      >
        {value}
      </div>
      <slots.Text
        field={field}
        value={label}
        className={hero
          ? "mt-2 text-xs uppercase tracking-[0.2em] text-[var(--campaign-muted-foreground)]"
          : "mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--campaign-muted-foreground)]"
        }
        tag="span"
      />
    </div>
  )
})

export function CountdownBlock({
  startEyebrow,
  endEyebrow,
  endedLabel,
  hoursLabel,
  minutesLabel,
  secondsLabel,
  startDate,
  endDate,
  accentColor,
  compact = false,
  variant = "compact",
  glass = false,
  glassPanel = false,
  glassBlur,
  glassPanelColor,
  glassPanelOpacity,
  className,
  slots,
}: {
  startEyebrow: string
  endEyebrow: string
  endedLabel: string
  hoursLabel: string
  minutesLabel: string
  secondsLabel: string
  startDate?: string
  endDate?: string
  accentColor: string
  compact?: boolean
  variant?: "compact" | "hero"
  /** Use minimal text-only style (no boxes) */
  glass?: boolean
  /** Wrap in its own glass backdrop panel (for non-immersive layouts over hero images) */
  glassPanel?: boolean
  glassBlur?: number
  glassPanelColor?: string
  glassPanelOpacity?: number
  className?: string
  slots: LayoutSlots
}) {
  const state = useCountdownState(startDate, endDate)
  const isHero = variant === "hero"

  if (state.phase === "hidden") return null

  const { eyebrowValue, eyebrowField } =
    state.phase === "starts-in"
      ? { eyebrowValue: startEyebrow, eyebrowField: "countdownStartEyebrow" }
      : state.phase === "ended"
        ? { eyebrowValue: endedLabel, eyebrowField: "countdownEndedLabel" }
        : { eyebrowValue: endEyebrow, eyebrowField: "countdownEndEyebrow" }

  const showTime = state.phase !== "ended"

  if (glass) {
    const content = (
      <div className={`text-center ${isHero ? "py-4" : compact ? "py-3 px-5" : "py-4 px-6 sm:py-5"}`}>
        <slots.Text
          field={eyebrowField}
          value={eyebrowValue}
          className={isHero
            ? "text-xs font-medium uppercase tracking-[0.15em] text-[var(--campaign-muted-foreground)]"
            : "text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--campaign-muted-foreground)]"
          }
          tag="p"
        />
        {showTime ? (
          <div className={`mt-3 flex items-baseline justify-center ${isHero ? "gap-2" : "gap-2"}`}>
            <CountdownUnit value={String(state.h).padStart(2, "0")} label={hoursLabel} field="countdownHoursLabel" color={accentColor} slots={slots} hero={isHero} glass />
            <span className={`font-light text-[var(--campaign-muted-foreground)] ${isHero ? "text-3xl" : "text-2xl"} -translate-y-0.5`}>:</span>
            <CountdownUnit value={String(state.m).padStart(2, "0")} label={minutesLabel} field="countdownMinutesLabel" color={accentColor} slots={slots} hero={isHero} glass />
            <span className={`font-light text-[var(--campaign-muted-foreground)] ${isHero ? "text-3xl" : "text-2xl"} -translate-y-0.5`}>:</span>
            <CountdownUnit value={String(state.s).padStart(2, "0")} label={secondsLabel} field="countdownSecondsLabel" color={accentColor} slots={slots} hero={isHero} glass />
          </div>
        ) : null}
      </div>
    )

    if (glassPanel) {
      return (
        <div
          className={`shrink-0 rounded-[var(--campaign-radius-xl)] ${className ?? ""}`}
          style={getGlassPanelStyle(glassBlur, glassPanelColor, glassPanelOpacity) as React.CSSProperties}
        >
          {content}
        </div>
      )
    }

    return <div className={`shrink-0 ${className ?? ""}`}>{content}</div>
  }

  return (
    <div className={`shrink-0 ${className ?? ""}`}>
      <div className={`px-4 text-center rounded-[var(--campaign-radius-xl)] ${isHero ? "py-2" : compact ? "py-4" : "py-5 sm:py-6"}`}>
        <div
          className={`mx-auto rounded-[var(--campaign-radius-lg)] border px-4 py-2 ${isHero ? "max-w-sm" : compact ? "max-w-sm" : "max-w-md"}`}
          style={{ color: accentColor, backgroundColor: `${accentColor}12`, borderColor: `${accentColor}30` }}
        >
          <slots.Text
            field={eyebrowField}
            value={eyebrowValue}
            className={isHero ? "text-xs font-medium" : "text-[11px] font-semibold uppercase tracking-[0.2em]"}
            tag="span"
          />
        </div>
        {showTime ? (
          <div className={`mt-4 flex items-start justify-center ${isHero ? "gap-3" : compact ? "gap-3" : "gap-4"}`}>
            <CountdownUnit value={String(state.h).padStart(2, "0")} label={hoursLabel} field="countdownHoursLabel" color={accentColor} slots={slots} hero={isHero} />
            <span className={`font-bold text-[var(--campaign-muted-foreground)] ${isHero ? "pt-4 text-2xl" : "pt-2 text-xl"}`}>:</span>
            <CountdownUnit value={String(state.m).padStart(2, "0")} label={minutesLabel} field="countdownMinutesLabel" color={accentColor} slots={slots} hero={isHero} />
            <span className={`font-bold text-[var(--campaign-muted-foreground)] ${isHero ? "pt-4 text-2xl" : "pt-2 text-xl"}`}>:</span>
            <CountdownUnit value={String(state.s).padStart(2, "0")} label={secondsLabel} field="countdownSecondsLabel" color={accentColor} slots={slots} hero={isHero} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
