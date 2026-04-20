"use client"

import { ChevronDown, Loader2, Trash2, Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import { useStudioStore, type LayoutPreset } from "../../../lib/studio-store"
import { cn } from "../../../lib/utils"
import { Button } from "../../ui/button"
import { Field, FieldLabel } from "../../ui/field"
import { Input } from "../../ui/input"
import { Switch } from "../../ui/switch"

export const heroImageRecommendations: Record<
  LayoutPreset,
  { ratio: string; size: string; usage: string; supportsHero: boolean }
> = {
  "two-column": {
    ratio: "4:5 portrait",
    size: "1600 x 2000 px",
    usage: "Fills the left media panel and becomes the main visual anchor.",
    supportsHero: true,
  },
  "hero-banner": {
    ratio: "16:9 landscape",
    size: "1920 x 1080 px",
    usage: "Required wide banner above headline, stats, and CTAs. Choose an image that fits your theme.",
    supportsHero: true,
  },
  centered: {
    ratio: "16:9 landscape",
    size: "1920 x 1080 px",
    usage: "Acts as an immersive backdrop behind the centered content.",
    supportsHero: true,
  },
  "step-card": {
    ratio: "16 : 9",
    size: "1200 x 675 px",
    usage: "Compact hero strip above the step cards. Keep it simple — the card content is the focus.",
    supportsHero: true,
  },
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image file"))
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.readAsDataURL(file)
  })
}

export function ImageUploadField({
  label,
  value,
  onChange,
  description,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sizeWarning, setSizeWarning] = useState<string | null>(null)

  const handleSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSizeWarning(null)
      const dataUrl = await readImageFile(file)

      if (file.size > 500 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
        setSizeWarning(`This image is ${sizeMB} MB. Large images increase the deployed app size. Consider optimizing before publishing.`)
      }

      onChange(dataUrl)
    } catch {
      setError("Failed to load this image file.")
    } finally {
      setLoading(false)
      event.target.value = ""
    }
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {description ? <p className="mb-2 text-xs text-muted-foreground">{description}</p> : null}
      {value ? (
        <div className="mb-3 overflow-hidden rounded-lg border border-border bg-muted/20">
          <img src={value} alt={label} className="h-28 w-full object-cover" />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSelectFile}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || loading}
          onClick={() => fileInputRef.current?.click()}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Choose File
        </Button>
        <Button type="button" variant="ghost" disabled={disabled || !value} onClick={() => { setSizeWarning(null); onChange("") }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Stored locally in the workspace. Images are included as-is in the generated app — no resizing is applied.
      </p>
      {sizeWarning ? <p className="mt-1.5 text-xs text-warning">{sizeWarning}</p> : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </Field>
  )
}

/**
 * Text input with an inline color override picker. The text value is required; the color
 * value is optional and acts as a "use this color instead of theme default" override.
 * Use for fields like Brand Name and Hero Title where the user types text but can also
 * tweak the rendered color.
 */
/**
 * Text input with an inline color override picker. When colorValue is empty, the picker
 * shows the `defaultColor` (typically the theme's fg color) so the swatch matches what the
 * user actually sees. Setting a color creates an override; the Reset link clears it back to
 * the theme default.
 */
export function TextWithColorField({
  label,
  value,
  onChange,
  colorValue,
  onColorChange,
  defaultColor = "#FFFFFF",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  colorValue: string
  onColorChange: (value: string) => void
  defaultColor?: string
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="flex-1" />
        <input
          type="color"
          value={colorValue || defaultColor}
          onChange={(event) => onColorChange(event.target.value)}
          className="h-9 w-10 shrink-0 rounded-md border border-border bg-transparent"
          title={colorValue ? `Override: ${colorValue}` : `Theme default: ${defaultColor}`}
        />
      </div>
      {colorValue ? (
        <button
          type="button"
          className="mt-1 text-xs text-primary hover:text-primary/80 underline underline-offset-2"
          onClick={() => onColorChange("")}
        >
          Reset to default
        </button>
      ) : null}
    </Field>
  )
}

/**
 * Standalone color picker with hex input. Use for fields where the entire value is a color
 * (announcement bar override, gradient stops). Pass `disabled` to lock the field — useful
 * for "follow theme primary" toggles.
 */
export function HexColorField({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: {
  label?: string
  description?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localRef = useRef(local)

  useEffect(() => { setLocal(value) }, [value])
  useEffect(() => { localRef.current = local }, [local])

  const handleChange = useCallback((v: string) => {
    setLocal(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), 60)
  }, [onChange])

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      onChange(localRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Field>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      {description ? <p className="mb-2 text-xs text-muted-foreground">{description}</p> : null}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={local || "#000000"}
          onChange={(event) => handleChange(event.target.value)}
          disabled={disabled}
          className="h-9 w-11 shrink-0 rounded-md border border-border bg-transparent"
        />
        <Input
          value={local}
          onChange={(event) => handleChange(event.target.value)}
          disabled={disabled}
          placeholder="Theme default"
          className="font-mono text-xs"
        />
      </div>
    </Field>
  )
}

/**
 * Section with a header that contains a toggle switch. When the toggle is off, children
 * are hidden entirely. Use for optional content blocks (announcement, countdown, stats,
 * footer) where enabling/disabling and editing live in the same place.
 */
export function EnableableSection({
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  title: string
  description?: string
  enabled: boolean
  onToggle: (next: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled ? <div className="space-y-3">{children}</div> : null}
    </div>
  )
}

/**
 * Hero image position and overlay controls. Collapsible — defaults to closed so it doesn't
 * dominate the brand inspector. Reads the hero image fields directly from the studio store.
 */
export function HeroImageControls() {
  const { config, updateConfig } = useStudioStore()
  const [expanded, setExpanded] = useState(false)
  if (!config.heroImageUrl) return null
  return (
    <div className="rounded-lg border border-border bg-muted/20">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-foreground"
      >
        <span>Image Adjustments</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <div className="overflow-hidden rounded-md border border-border bg-muted/20">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src={config.heroImageUrl}
                alt="Hero preview crop"
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${config.heroImagePositionX}% ${config.heroImagePositionY}%`,
                  transform: `scale(${config.heroImageScale})`,
                  transformOrigin: `${config.heroImagePositionX}% ${config.heroImagePositionY}%`,
                }}
              />
            </div>
          </div>
          <Field>
            <FieldLabel>Zoom</FieldLabel>
            <input
              type="range"
              min={100}
              max={220}
              step={1}
              value={Math.round(config.heroImageScale * 100)}
              onChange={(event) => updateConfig("heroImageScale", Number(event.target.value) / 100)}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">{Math.round(config.heroImageScale * 100)}%</p>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Horizontal Focus</FieldLabel>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={config.heroImagePositionX}
                onChange={(event) => updateConfig("heroImagePositionX", Number(event.target.value))}
                className="w-full accent-primary"
              />
            </Field>
            <Field>
              <FieldLabel>Vertical Focus</FieldLabel>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={config.heroImagePositionY}
                onChange={(event) => updateConfig("heroImagePositionY", Number(event.target.value))}
                className="w-full accent-primary"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel>Overlay Darkness</FieldLabel>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={config.heroOverlayOpacity}
              onChange={(event) => updateConfig("heroOverlayOpacity", Number(event.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {config.heroOverlayOpacity}% — {config.heroOverlayOpacity === 0 ? "No overlay" : config.heroOverlayOpacity < 30 ? "Subtle" : config.heroOverlayOpacity < 60 ? "Moderate" : "Heavy"}
            </p>
          </Field>
          <Field>
            <FieldLabel>Glass Blur</FieldLabel>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={config.heroGlassBlur}
              onChange={(event) => updateConfig("heroGlassBlur", Number(event.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {config.heroGlassBlur}% — {config.heroGlassBlur === 0 ? "No blur" : config.heroGlassBlur < 30 ? "Subtle" : config.heroGlassBlur < 60 ? "Medium" : "Strong"}
            </p>
          </Field>
          <HexColorField
            label="Glass Panel Color"
            description="Empty = theme background"
            value={config.heroGlassPanelColor}
            onChange={(value) => updateConfig("heroGlassPanelColor", value)}
          />
          <Field>
            <FieldLabel>Glass Panel Opacity</FieldLabel>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={config.heroGlassPanelOpacity}
              onChange={(event) => updateConfig("heroGlassPanelOpacity", Number(event.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {config.heroGlassPanelOpacity}%
            </p>
          </Field>
        </div>
      ) : null}
    </div>
  )
}

