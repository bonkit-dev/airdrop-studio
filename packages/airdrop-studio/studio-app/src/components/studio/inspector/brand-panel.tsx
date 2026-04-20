"use client"

import { ExternalLink, Plus, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { themePresets, useStudioStore, type FooterLinkCategory } from "../../../lib/studio-store"
import { Button } from "../../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog"
import { Field, FieldGroup, FieldLabel } from "../../ui/field"
import { Input } from "../../ui/input"
import { Separator } from "../../ui/separator"
import { Switch } from "../../ui/switch"
import { Textarea } from "../../ui/textarea"
import {
  EnableableSection,
  HeroImageControls,
  HexColorField,
  ImageUploadField,
  TextWithColorField,
  heroImageRecommendations,
} from "./shared"

function isLightBg(hex: string): boolean {
  const raw = hex.replace("#", "")
  if (raw.length < 6) return false
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b) > 0.4
}

export function BrandPanel() {
  const { config, updateConfig } = useStudioStore()
  const activeField = useStudioStore((s) => s.activeField)
  const setActiveField = useStudioStore((s) => s.setActiveField)
  const heroImageGuidance = config.layoutPreset ? heroImageRecommendations[config.layoutPreset] : null
  const colors = config.useCustomColors ? config.customColors : themePresets[config.themePreset ?? "midnight"]
  const themeFgColor = isLightBg(colors.background) ? "#0F172A" : "#F5F7FF"
  const heroImageRef = useRef<HTMLDivElement>(null)
  const [heroImageHighlight, setHeroImageHighlight] = useState(false)

  useEffect(() => {
    if (activeField !== "heroImage") return
    // Scroll into view and flash highlight
    heroImageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    setHeroImageHighlight(true)
    const id = setTimeout(() => {
      setHeroImageHighlight(false)
      setActiveField(null)
    }, 2000)
    return () => clearTimeout(id)
  }, [activeField, setActiveField])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Brand Identity</h3>
        <p className="text-sm text-muted-foreground">
          Define the copy, labels, and imagery that shape the campaign's public face.
        </p>
      </div>

      {/* IDENTITY */}
      <FieldGroup>
        <TextWithColorField
          label="Brand Name"
          value={config.brandName}
          onChange={(value) => updateConfig("brandName", value)}
          colorValue={config.brandNameColor}
          onColorChange={(value) => updateConfig("brandNameColor", value)}
          defaultColor={themeFgColor}
        />
        <ImageUploadField
          label="Logo"
          description="Shows in the header / brand area across presets."
          value={config.logoUrl}
          onChange={(value) => updateConfig("logoUrl", value)}
        />
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-3 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Show brand name next to logo</p>
            <p className="text-xs text-muted-foreground">Enable for symbol-only logos. Disable for wordmarks.</p>
          </div>
          <Switch
            checked={config.showBrandNameWithLogo}
            onCheckedChange={(checked) => updateConfig("showBrandNameWithLogo", checked)}
          />
        </div>
        <EnableableSection
          title="Tagline"
          description="Short brand line shown in the footer area."
          enabled={config.showTagline}
          onToggle={(enabled) => updateConfig("showTagline", enabled)}
        >
          <Input value={config.tagline} onChange={(event) => updateConfig("tagline", event.target.value)} />
        </EnableableSection>
      </FieldGroup>

      <Separator />

      {/* HERO */}
      <div className="space-y-4">
        <FieldLabel>Hero</FieldLabel>
        <FieldGroup>
          <TextWithColorField
            label="Hero Title"
            value={config.heroTitle}
            onChange={(value) => updateConfig("heroTitle", value)}
            colorValue={config.heroTitleColor}
            onColorChange={(value) => updateConfig("heroTitleColor", value)}
            defaultColor={themeFgColor}
          />
          <Field>
            <FieldLabel>Hero Body</FieldLabel>
            <Textarea
              value={config.heroBody}
              onChange={(event) => updateConfig("heroBody", event.target.value)}
              rows={4}
            />
          </Field>
          <div
            ref={heroImageRef}
            className={heroImageHighlight
              ? "rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background transition-all duration-300"
              : "transition-all duration-300"
            }
          >
            <ImageUploadField
              label="Hero Image"
              description={
                heroImageGuidance
                  ? `${heroImageGuidance.usage} Recommended ratio: ${heroImageGuidance.ratio}. Suggested export size: ${heroImageGuidance.size}.`
                  : "Select a layout first to see hero image recommendations."
              }
              value={config.heroImageUrl}
              onChange={(value) => updateConfig("heroImageUrl", value)}
              disabled={!heroImageGuidance?.supportsHero}
            />
          </div>
          {heroImageGuidance && !heroImageGuidance.supportsHero ? (
            <p className="text-xs text-muted-foreground">Step Card currently does not render a hero image surface.</p>
          ) : null}
          <HeroImageControls />
          {!config.heroImageUrl ? (
            <Field>
              <FieldLabel>Background Gradient Override</FieldLabel>
              <p className="mb-2 text-xs text-muted-foreground">
                Customize the fallback gradient when no hero image is set. Leave empty to follow theme colors.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <HexColorField
                  description="Primary glow"
                  value={config.heroGradientPrimary}
                  onChange={(value) => updateConfig("heroGradientPrimary", value)}
                />
                <HexColorField
                  description="Accent glow"
                  value={config.heroGradientAccent}
                  onChange={(value) => updateConfig("heroGradientAccent", value)}
                />
              </div>
              {config.heroGradientPrimary || config.heroGradientAccent ? (
                <button
                  type="button"
                  className="mt-2 text-xs text-primary hover:text-primary/80 underline underline-offset-2"
                  onClick={() => {
                    updateConfig("heroGradientPrimary", "")
                    updateConfig("heroGradientAccent", "")
                  }}
                >
                  Reset to theme defaults
                </button>
              ) : null}
            </Field>
          ) : null}
          <ImageUploadField
            label="Token Symbol"
            description="Used in the hero / media token mark area."
            value={config.symbolUrl}
            onChange={(value) => updateConfig("symbolUrl", value)}
          />
        </FieldGroup>
      </div>

      <Separator />

      {/* BUTTONS */}
      <div className="space-y-3">
        <FieldLabel>Button Labels</FieldLabel>
        <FieldGroup>
          <Field>
            <FieldLabel>Connect Wallet</FieldLabel>
            <Input
              value={config.connectWalletLabel}
              onChange={(event) => updateConfig("connectWalletLabel", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Primary CTA</FieldLabel>
            <Input
              value={config.claimButtonLabel}
              onChange={(event) => updateConfig("claimButtonLabel", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Secondary CTA</FieldLabel>
            <Input
              value={config.eligibilityButtonLabel}
              onChange={(event) => updateConfig("eligibilityButtonLabel", event.target.value)}
            />
          </Field>
        </FieldGroup>
      </div>

      <Separator />

      {/* ANNOUNCEMENT */}
      <EnableableSection
        title="Announcement Bar"
        description="Top-of-page banner for limited-time messaging."
        enabled={config.showAnnouncement}
        onToggle={(enabled) => updateConfig("showAnnouncement", enabled)}
      >
        <Field>
          <FieldLabel>Text</FieldLabel>
          <Input
            value={config.announcementText}
            onChange={(event) => updateConfig("announcementText", event.target.value)}
          />
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-3 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Override theme primary</p>
            <p className="text-xs text-muted-foreground">Use a custom color instead of following the theme.</p>
          </div>
          <Switch
            checked={config.useAnnouncementBarColorOverride}
            onCheckedChange={(checked) => updateConfig("useAnnouncementBarColorOverride", checked)}
          />
        </div>
        <HexColorField
          label="Bar Color"
          value={config.announcementBarColorOverride}
          onChange={(value) => updateConfig("announcementBarColorOverride", value)}
          disabled={!config.useAnnouncementBarColorOverride}
        />
      </EnableableSection>

      <Separator />

      {/* COUNTDOWN */}
      <EnableableSection
        title="Countdown"
        description="Urgency timer that ends at the airdrop schedule."
        enabled={config.showCountdown}
        onToggle={(enabled) => updateConfig("showCountdown", enabled)}
      >
        <Field>
          <FieldLabel>Eyebrow — before start</FieldLabel>
          <Input
            value={config.countdownStartEyebrow}
            onChange={(event) => updateConfig("countdownStartEyebrow", event.target.value)}
            placeholder="Airdrop starts in"
          />
        </Field>
        <Field>
          <FieldLabel>Eyebrow — during claim</FieldLabel>
          <Input
            value={config.countdownEndEyebrow}
            onChange={(event) => updateConfig("countdownEndEyebrow", event.target.value)}
            placeholder="Airdrop ends in"
          />
        </Field>
        <Field>
          <FieldLabel>Ended label</FieldLabel>
          <Input
            value={config.countdownEndedLabel}
            onChange={(event) => updateConfig("countdownEndedLabel", event.target.value)}
            placeholder="Claim window closed"
          />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field>
            <FieldLabel>Hours</FieldLabel>
            <Input
              value={config.countdownHoursLabel}
              onChange={(event) => updateConfig("countdownHoursLabel", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Minutes</FieldLabel>
            <Input
              value={config.countdownMinutesLabel}
              onChange={(event) => updateConfig("countdownMinutesLabel", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Seconds</FieldLabel>
            <Input
              value={config.countdownSecondsLabel}
              onChange={(event) => updateConfig("countdownSecondsLabel", event.target.value)}
            />
          </Field>
        </div>
      </EnableableSection>

      <Separator />

      {/* STATUS BADGE — always visible, labels are configurable */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Status Badge</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Always visible. Shows the airdrop phase (Starting Soon / Claim Live / Ended) with the
            scheduled date. End users rely on this when the countdown timer is hidden.
          </p>
        </div>
        <Field>
          <FieldLabel>Before start</FieldLabel>
          <Input
            value={config.statusBadgeStartLabel}
            onChange={(event) => updateConfig("statusBadgeStartLabel", event.target.value)}
            placeholder="Starting Soon"
          />
        </Field>
        <Field>
          <FieldLabel>During claim</FieldLabel>
          <Input
            value={config.statusBadgeLiveLabel}
            onChange={(event) => updateConfig("statusBadgeLiveLabel", event.target.value)}
            placeholder="Claim Live"
          />
        </Field>
        <Field>
          <FieldLabel>After ended</FieldLabel>
          <Input
            value={config.statusBadgeEndedLabel}
            onChange={(event) => updateConfig("statusBadgeEndedLabel", event.target.value)}
            placeholder="Ended"
          />
        </Field>
      </div>

      <Separator />

      {/* STATISTICS */}
      <EnableableSection
        title="Statistics"
        description="Total claims, allocation, and claimed metrics."
        enabled={config.showStats}
        onToggle={(enabled) => updateConfig("showStats", enabled)}
      >
        <div className="grid grid-cols-1 gap-2">
          <Field>
            <FieldLabel>Total Claims</FieldLabel>
            <Input
              value={config.statTotalClaimsLabel}
              onChange={(event) => updateConfig("statTotalClaimsLabel", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Allocated</FieldLabel>
            <Input
              value={config.statAllocatedLabel}
              onChange={(event) => updateConfig("statAllocatedLabel", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Claimed</FieldLabel>
            <Input
              value={config.statClaimedLabel}
              onChange={(event) => updateConfig("statClaimedLabel", event.target.value)}
            />
          </Field>
        </div>
      </EnableableSection>

      <Separator />

      {/* FOOTER LINKS */}
      <EnableableSection
        title="Footer Links"
        description="Support, legal, and social destinations."
        enabled={config.showFooter}
        onToggle={(enabled) => updateConfig("showFooter", enabled)}
      >
        <FooterLinksDialogTrigger />
      </EnableableSection>
    </div>
  )
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

const footerLinkCategories = [
  { value: "telegram" as const, label: "Telegram" },
  { value: "x" as const, label: "X" },
  { value: "discord" as const, label: "Discord" },
  { value: "medium" as const, label: "Medium" },
  { value: "custom" as const, label: "Custom" },
]

function FooterLinksDialogTrigger() {
  const { config, updateConfig } = useStudioStore()
  const [open, setOpen] = useState(false)

  const updateLink = (linkId: string, field: string, value: string | boolean) =>
    updateConfig(
      "footerLinks",
      config.footerLinks.map((link) => (link.id === linkId ? { ...link, [field]: value } : link)),
    )
  const addLink = (category: FooterLinkCategory) => {
    const preset = footerLinkCategories.find((c) => c.value === category)
    updateConfig("footerLinks", [
      ...config.footerLinks,
      {
        id:
          typeof globalThis.crypto?.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : `footer-link-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        label: category === "custom" ? "" : preset?.label ?? "",
        href: "",
        category,
        iconOnly: category !== "custom",
      },
    ])
  }
  const removeLink = (id: string) =>
    updateConfig("footerLinks", config.footerLinks.filter((link) => link.id !== id))

  const filledCount = config.footerLinks.filter((l) => l.label.trim() && l.href.trim()).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-lg border border-border bg-card px-3 py-3 text-left transition hover:border-muted-foreground/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              {filledCount > 0 ? `${filledCount} link${filledCount > 1 ? "s" : ""} configured` : "No links yet"}
            </div>
            <span className="text-xs text-primary">Edit</span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>Footer Links</DialogTitle>
          <DialogDescription>
            Add links to social profiles, support pages, or legal documents. These appear in the campaign footer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {config.footerLinks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No footer links yet. Pick a category below to add one.
            </p>
          ) : (
            config.footerLinks.map((link) => (
              <div key={link.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground">
                      {footerLinkCategories.find((c) => c.value === link.category)?.label ?? "Custom"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLink(link.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field>
                    <FieldLabel>Label</FieldLabel>
                    <Input
                      value={link.label}
                      onChange={(event) => updateLink(link.id, "label", event.target.value)}
                      placeholder="Display name"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>URL</FieldLabel>
                    <Input
                      value={link.href}
                      onChange={(event) => updateLink(link.id, "href", event.target.value)}
                      placeholder="https://..."
                      className={link.href.trim() && !isValidUrl(link.href.trim()) ? "border-destructive" : ""}
                    />
                    {link.href.trim() && !isValidUrl(link.href.trim()) ? (
                      <p className="mt-1 text-[11px] text-destructive">URL must start with https:// or http://</p>
                    ) : null}
                  </Field>
                </div>
                {link.category !== "custom" ? (
                  <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
                    <p className="text-xs text-muted-foreground">Show as icon only</p>
                    <Switch
                      checked={link.iconOnly}
                      onCheckedChange={(checked) => updateLink(link.id, "iconOnly", checked)}
                    />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add link</p>
          <div className="flex flex-wrap gap-2">
            {footerLinkCategories.map((cat) => (
              <Button
                key={cat.value}
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => addLink(cat.value)}
              >
                <Plus className="h-3.5 w-3.5" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
