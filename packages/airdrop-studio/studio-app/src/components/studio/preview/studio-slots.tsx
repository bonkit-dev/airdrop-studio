"use client"

import type { LayoutSlots, TextSlotProps, ButtonSlotProps, StatSlotProps, AllocationSlotProps } from "../../../../../src/runtime/layouts/slots"
import { useStudioStore, type CampaignConfigDraft, type PreviewField } from "../../../lib/studio-store"
import { InlineText, InlineButton, SampleStat, MockAllocationSection } from "./shared"

const BUTTON_FIELD_TO_CONFIG_KEY: Record<string, keyof CampaignConfigDraft> = {
  connectWallet: "connectWalletLabel",
  claimButton: "claimButtonLabel",
  eligibilityButton: "eligibilityButtonLabel",
}

function StudioText({ field, value, placeholder, className, style, tag, multiline }: TextSlotProps) {
  const { updateConfig } = useStudioStore()
  return (
    <InlineText
      field={field as PreviewField}
      value={value}
      placeholder={placeholder}
      onChange={(v: string) => updateConfig(field as keyof CampaignConfigDraft, v)}
      className={className}
      style={style}
      tag={tag}
      multiline={multiline}
    />
  )
}

function StudioButton({ field, label, className, style, stretch, disabled }: ButtonSlotProps) {
  const { updateConfig } = useStudioStore()
  const configKey = BUTTON_FIELD_TO_CONFIG_KEY[field] ?? field
  return (
    <InlineButton
      field={field as PreviewField}
      label={label}
      onLabelChange={(v: string) => updateConfig(configKey as keyof CampaignConfigDraft, v)}
      className={className}
      style={style}
      stretch={stretch}
      disabled={disabled}
    />
  )
}

function StudioStat({ value, className, style }: StatSlotProps) {
  return <SampleStat value={value} className={className} style={style} />
}

function StudioAllocationSection({ colors, className, maxWidthClass }: AllocationSlotProps) {
  return <MockAllocationSection colors={colors} className={className} maxWidthClass={maxWidthClass} />
}

export const studioSlots: LayoutSlots = {
  Text: StudioText,
  Button: StudioButton,
  Stat: StudioStat,
  AllocationSection: StudioAllocationSection,
}
