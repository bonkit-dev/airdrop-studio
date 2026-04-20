"use client"

import { Check, Image as ImageIcon, Loader2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { generateThemeFromImage } from "../../../lib/image-palette"
import { fontPresets, useStudioStore, themePresets, type FontPreset, type ThemePreset } from "../../../lib/studio-store"
import { Button } from "../../ui/button"
import { FieldLabel } from "../../ui/field"
import { Input } from "../../ui/input"
import { Separator } from "../../ui/separator"
import { EnableableSection } from "./shared"

export function ThemePanel() {
  const { config, updateConfig, applyThemePreset } = useStudioStore()
  const [showAdvanced, setShowAdvanced] = useState(config.useCustomColors)
  const [paletteLoading, setPaletteLoading] = useState(false)
  const [paletteError, setPaletteError] = useState<string | null>(null)
  const [suggestedPalette, setSuggestedPalette] = useState<null | {
    source: string
    colors: typeof config.customColors
  }>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const generateSuggestedPalette = async (file: File) => {
    setPaletteLoading(true)
    setPaletteError(null)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ""))
        reader.onerror = () => reject(new Error("Failed to read the selected image."))
        reader.readAsDataURL(file)
      })
      const colors = await generateThemeFromImage(dataUrl)
      setSuggestedPalette({ source: file.name, colors })
    } catch (error) {
      setSuggestedPalette(null)
      setPaletteError(error instanceof Error ? error.message : "Palette generation failed.")
    } finally {
      setPaletteLoading(false)
    }
  }

  const applySuggestedPalette = () => {
    if (!suggestedPalette) return
    updateConfig("customColors", suggestedPalette.colors)
    updateConfig("useCustomColors", true)
    setShowAdvanced(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Theme</h3>
        <p className="text-sm text-muted-foreground">
          Set the overall color direction, then optionally derive a palette from an uploaded image.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div>
          <FieldLabel>Generate Theme From Image</FieldLabel>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload one reference image and derive a matching palette for the campaign.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void generateSuggestedPalette(file)
            }
            event.currentTarget.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          disabled={paletteLoading}
          onClick={() => fileInputRef.current?.click()}
        >
          {paletteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          Choose Image For Palette
        </Button>
        {suggestedPalette ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Suggested palette from {suggestedPalette.source}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This applies `primary`, `secondary`, `accent`, `background`, and `surface` as custom colors.
                </p>
              </div>
              <Button type="button" size="sm" onClick={applySuggestedPalette}>
                Apply Palette
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.entries(suggestedPalette.colors) as Array<[keyof typeof suggestedPalette.colors, string]>).map(
                ([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="h-10 rounded-lg border border-white/10" style={{ backgroundColor: value }} />
                    <div>
                      <p className="text-[11px] font-medium capitalize text-foreground">{key}</p>
                      <p className="text-[10px] text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : null}
        {paletteError ? <p className="text-xs text-warning">{paletteError}</p> : null}
        <p className="text-[11px] text-muted-foreground">
          The image is analyzed locally in the browser and is not sent anywhere.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <FieldLabel>Theme Presets</FieldLabel>
        {(Object.keys(themePresets) as ThemePreset[]).map((preset) => {
          const colors = themePresets[preset]
          const isSelected = config.themePreset === preset && !config.useCustomColors
          return (
            <button
              key={preset}
              onClick={() => applyThemePreset(preset)}
              className={`w-full p-3 rounded-lg border flex items-start gap-3 text-left transition-all ${isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground/50"}`}
            >
              <div className="flex shrink-0 gap-1.5 pt-0.5">
                <div
                  className="h-4 w-4 rounded-full border border-white/10"
                  style={{ backgroundColor: colors.primary }}
                />
                <div
                  className="h-4 w-4 rounded-full border border-white/10"
                  style={{ backgroundColor: colors.secondary }}
                />
                <div
                  className="h-4 w-4 rounded-full border border-white/10"
                  style={{ backgroundColor: colors.accent }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{colors.label}</p>
                  <span className="rounded-full border border-border px-1.5 py-px text-[10px] uppercase tracking-wider text-muted-foreground">
                    {colors.mode}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{colors.description}</p>
              </div>
              {isSelected ? <Check className="mt-1 h-4 w-4 shrink-0 text-primary" /> : null}
            </button>
          )
        })}
      </div>

      <Separator />

      <div className="space-y-2">
        <FieldLabel>Font</FieldLabel>
        <div className="grid gap-2">
          {(Object.entries(fontPresets) as [FontPreset, typeof fontPresets[FontPreset]][]).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => updateConfig("fontPreset", key)}
              className={`rounded-lg border p-3 text-left transition-colors flex items-start gap-3 ${config.fontPreset === key ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:border-muted-foreground/40"}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground" style={{ fontFamily: preset.heading }}>
                  {preset.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: preset.body }}>
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
              {config.fontPreset === key ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <EnableableSection
        title="Advanced Color Overrides"
        description="Use this only when the preset direction is close but not enough."
        enabled={showAdvanced}
        onToggle={(checked) => {
          setShowAdvanced(checked)
          updateConfig("useCustomColors", checked)
        }}
      >
        <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4">
          {(["primary", "secondary", "accent", "background", "surface"] as const).map((colorKey) => (
            <ThemeColorRow
              key={colorKey}
              colorKey={colorKey}
              value={config.customColors[colorKey]}
              onChange={(v) => updateConfig("customColors", { ...config.customColors, [colorKey]: v })}
            />
          ))}
        </div>
      </EnableableSection>
    </div>
  )
}

function ThemeColorRow({
  colorKey,
  value,
  onChange,
}: {
  colorKey: string
  value: string
  onChange: (v: string) => void
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
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium capitalize text-foreground">{colorKey}</label>
        <code className="text-[11px] text-muted-foreground">{local}</code>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={local}
          onChange={(event) => handleChange(event.target.value)}
          className="h-9 w-10 rounded-md border border-border bg-transparent"
        />
        <Input
          value={local}
          onChange={(event) => handleChange(event.target.value)}
          className="font-mono text-xs"
        />
      </div>
    </div>
  )
}
