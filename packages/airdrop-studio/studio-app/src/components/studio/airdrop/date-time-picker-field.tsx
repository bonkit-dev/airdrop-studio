"use client"

import { useState } from "react"
import { CalendarIcon, Clock3, X } from "lucide-react"
import {
  parseLocalDateTime,
  roundMinute,
  startOfLocalDay,
  toLocalDateTimeValue,
  formatDisplayDateTime,
} from "../../../lib/airdrop-utils"
import { cn } from "../../../lib/utils"
import { Button } from "../../ui/button"
import { Calendar } from "../../ui/calendar"
import { Field, FieldLabel } from "../../ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"

export function DateTimePickerField({
  id,
  label,
  value,
  minValue,
  defaultValue,
  errorMessage,
  onChange,
}: {
  id: string
  label: string
  value: string
  minValue: string
  defaultValue?: string
  errorMessage?: string | null
  onChange: (next: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const parsedValue = parseLocalDateTime(value)
  const parsedMin = parseLocalDateTime(minValue)
  const parsedDefault = parseLocalDateTime(defaultValue ?? "") ?? parsedMin

  // Draft date used inside the popover — starts at defaultValue when no value is set
  const [draftDate, setDraftDate] = useState<Date | null>(null)

  const effectiveDraft = draftDate ?? parsedValue ?? parsedDefault
  const selectedDate = effectiveDraft
    ? new Date(effectiveDraft.getFullYear(), effectiveDraft.getMonth(), effectiveDraft.getDate(), 0, 0, 0, 0)
    : undefined
  const [displayMonth, setDisplayMonth] = useState<Date | undefined>(selectedDate)
  const selectedHour = effectiveDraft?.getHours() ?? 0
  const selectedMinute = effectiveDraft?.getMinutes() ?? 0

  const clampToMin = (date: Date): Date => {
    const rounded = roundMinute(date)
    if (parsedMin && rounded.getTime() < parsedMin.getTime()) {
      return parsedMin
    }
    return rounded
  }

  const updateDraft = (next: Date) => {
    setDraftDate(clampToMin(next))
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset draft to current value or defaultValue on open
      const initial = parsedValue ?? parsedDefault
      setDraftDate(initial ? clampToMin(initial) : null)
      setDisplayMonth(initial ? new Date(initial.getFullYear(), initial.getMonth(), initial.getDate()) : undefined)
    }
    setIsOpen(open)
  }

  const handleApply = () => {
    if (effectiveDraft) {
      const clamped = clampToMin(effectiveDraft)
      onChange(toLocalDateTimeValue(clamped))
    }
    setIsOpen(false)
  }

  return (
    <Field>
      <FieldLabel>
        {label}
        <span className="ml-1.5 font-normal text-muted-foreground">
          ({Intl.DateTimeFormat().resolvedOptions().timeZone})
        </span>
      </FieldLabel>
      <div className="space-y-2">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              className={cn(
                "h-11 w-full justify-start overflow-hidden px-3 text-left font-normal",
                !value && "text-muted-foreground",
                errorMessage && "border-destructive/70",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{formatDisplayDateTime(value)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="w-[18rem] p-2">
            <Calendar
              className="mx-auto rounded-md border border-border bg-transparent p-2"
              mode="single"
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              selected={selectedDate}
              onSelect={(day) => {
                if (!day) return
                const base = effectiveDraft ?? new Date()
                const next = new Date(
                  day.getFullYear(),
                  day.getMonth(),
                  day.getDate(),
                  base.getHours(),
                  base.getMinutes(),
                  0,
                  0,
                )
                updateDraft(next)
              }}
              disabled={parsedMin ? { before: startOfLocalDay(parsedMin) } : undefined}
            />
            <div className="mt-2 border-t border-border pt-2">
              <div className="mb-2 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Time</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={`${selectedHour}`.padStart(2, "0")}
                  onValueChange={(hourValue) => {
                    const base = effectiveDraft ?? new Date()
                    const next = new Date(base)
                    next.setHours(Number(hourValue), next.getMinutes(), 0, 0)
                    updateDraft(next)
                  }}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, index) => (
                      <SelectItem key={`${id}-hour-${index}`} value={`${index}`.padStart(2, "0")}>
                        {`${index}`.padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={`${selectedMinute}`.padStart(2, "0")}
                  onValueChange={(minuteValue) => {
                    const base = effectiveDraft ?? new Date()
                    const next = new Date(base)
                    next.setMinutes(Number(minuteValue), 0, 0)
                    updateDraft(next)
                  }}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Minute" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }, (_, index) => (
                      <SelectItem key={`${id}-minute-${index}`} value={`${index}`.padStart(2, "0")}>
                        {`${index}`.padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" size="sm" className="mt-2 h-9 w-full" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground"
            onClick={() => onChange("")}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        ) : null}
        {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
      </div>
    </Field>
  )
}
