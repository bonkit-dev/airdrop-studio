"use client"

import type { ThemeColors } from "./studio-store"

type Rgb = { r: number; g: number; b: number }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b].map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0")).join("")}`
}

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "")
  const parsed =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized
  return {
    r: parseInt(parsed.slice(0, 2), 16),
    g: parseInt(parsed.slice(2, 4), 16),
    b: parseInt(parsed.slice(4, 6), 16),
  }
}

function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  }
}

function getLuminance({ r, g, b }: Rgb) {
  const channels = [r, g, b].map((value) => {
    const normalized = value / 255
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function rgbToHsl({ r, g, b }: Rgb) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness }
  }

  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue: number

  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0)
      break
    case green:
      hue = (blue - red) / delta + 2
      break
    default:
      hue = (red - green) / delta + 4
  }

  return { h: hue * 60, s: saturation, l: lightness }
}

function hueDistance(a: number, b: number) {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

async function loadImage(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.referrerPolicy = "no-referrer"
    image.decoding = "async"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Image could not be loaded for palette analysis."))
    image.src = src
  })
}

function sampleImageColors(image: HTMLImageElement) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d", { willReadFrequently: true })

  if (!context) {
    throw new Error("Canvas context is not available.")
  }

  const targetWidth = 64
  const scale = targetWidth / image.width
  canvas.width = targetWidth
  canvas.height = Math.max(16, Math.round(image.height * scale))
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  let imageData: ImageData
  try {
    imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  } catch {
    throw new Error("Image blocks pixel access. Use a same-origin or CORS-enabled image URL.")
  }

  const bins = new Map<string, { count: number; color: Rgb }>()
  let totalWeight = 0
  let average = { r: 0, g: 0, b: 0 }
  let lightPixels = 0
  let darkPixels = 0

  for (let index = 0; index < imageData.data.length; index += 16) {
    const alpha = imageData.data[index + 3]
    if (alpha < 180) continue

    const color = {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
    }

    const { l } = rgbToHsl(color)
    if (l < 0.04 || l > 0.97) continue

    if (l > 0.6) lightPixels++
    else if (l < 0.4) darkPixels++

    average = {
      r: average.r + color.r,
      g: average.g + color.g,
      b: average.b + color.b,
    }
    totalWeight += 1

    const quantized = {
      r: Math.round(color.r / 24) * 24,
      g: Math.round(color.g / 24) * 24,
      b: Math.round(color.b / 24) * 24,
    }
    const key = `${quantized.r}-${quantized.g}-${quantized.b}`
    const current = bins.get(key)
    bins.set(key, {
      count: (current?.count ?? 0) + 1,
      color: quantized,
    })
  }

  if (!totalWeight || bins.size === 0) {
    throw new Error("The image did not contain enough usable color information.")
  }

  average = {
    r: average.r / totalWeight,
    g: average.g / totalWeight,
    b: average.b / totalWeight,
  }

  const isImageLight = lightPixels > darkPixels * 1.5

  return { bins, average, isImageLight }
}

function rankColors(bins: Map<string, { count: number; color: Rgb }>) {
  return Array.from(bins.values())
    .map((entry) => {
      const hsl = rgbToHsl(entry.color)
      return {
        ...entry,
        hsl,
        score: entry.count * (0.7 + hsl.s * 0.9 + Math.max(0, 0.55 - Math.abs(hsl.l - 0.5))),
      }
    })
    .sort((a, b) => b.score - a.score)
}

function extractKeyColors(ranked: ReturnType<typeof rankColors>, average: Rgb) {
  const primaryEntry =
    ranked.find((entry) => entry.hsl.s > 0.18 && entry.hsl.l > 0.2 && entry.hsl.l < 0.78) ?? ranked[0]
  const primary = primaryEntry.color
  const primaryHsl = primaryEntry.hsl

  const secondaryEntry =
    ranked.find((entry) => entry !== primaryEntry && hueDistance(entry.hsl.h, primaryHsl.h) > 18) ??
    ranked.find((entry) => entry !== primaryEntry && Math.abs(entry.hsl.l - primaryHsl.l) > 0.08) ??
    primaryEntry
  const secondary = mix(secondaryEntry.color, average, 0.28)

  const accentEntry =
    ranked.find((entry) => entry !== primaryEntry && entry.hsl.s >= primaryHsl.s * 0.7 && entry.hsl.l > primaryHsl.l) ??
    secondaryEntry
  const accent = mix(accentEntry.color, { r: 255, g: 255, b: 255 }, 0.12)

  return { primary, secondary, accent }
}

function buildDarkTheme(primary: Rgb, secondary: Rgb, accent: Rgb, average: Rgb): ThemeColors {
  const darkBase = mix(average, { r: 4, g: 8, b: 16 }, 0.82)
  const background = mix(darkBase, { r: 3, g: 6, b: 12 }, 0.25)
  const surface = mix(background, primary, 0.08)

  const result = {
    primary: rgbToHex(primary),
    secondary: rgbToHex(secondary),
    accent: rgbToHex(accent),
    background: rgbToHex(background),
    surface: rgbToHex(surface),
  }

  const bgLum = getLuminance(hexToRgb(result.background))
  if (bgLum > 0.12) {
    result.background = rgbToHex(mix(hexToRgb(result.background), { r: 4, g: 8, b: 16 }, 0.3))
  }
  const sfLum = getLuminance(hexToRgb(result.surface))
  if (sfLum <= getLuminance(hexToRgb(result.background))) {
    result.surface = rgbToHex(mix(hexToRgb(result.background), hexToRgb(result.primary), 0.12))
  }

  return result
}

function buildLightTheme(primary: Rgb, secondary: Rgb, accent: Rgb, average: Rgb): ThemeColors {
  const lightBase = mix(average, { r: 250, g: 250, b: 250 }, 0.88)
  const background = mix(lightBase, { r: 255, g: 255, b: 255 }, 0.6)
  const surface = mix(background, primary, 0.06)

  const result = {
    primary: rgbToHex(primary),
    secondary: rgbToHex(secondary),
    accent: rgbToHex(mix(accent, { r: 0, g: 0, b: 0 }, 0.15)),
    background: rgbToHex(background),
    surface: rgbToHex(surface),
  }

  const bgLum = getLuminance(hexToRgb(result.background))
  if (bgLum < 0.85) {
    result.background = rgbToHex(mix(hexToRgb(result.background), { r: 250, g: 250, b: 250 }, 0.4))
  }
  const sfLum = getLuminance(hexToRgb(result.surface))
  if (sfLum >= bgLum) {
    result.surface = rgbToHex(mix(hexToRgb(result.background), hexToRgb(result.primary), 0.08))
  }

  return result
}

export async function generateThemeFromImage(src: string): Promise<ThemeColors> {
  if (!src) {
    throw new Error("No image source was provided.")
  }

  const image = await loadImage(src)
  const { bins, average, isImageLight } = sampleImageColors(image)
  const ranked = rankColors(bins)
  const { primary, secondary, accent } = extractKeyColors(ranked, average)

  if (isImageLight) {
    return buildLightTheme(primary, secondary, accent, average)
  }

  return buildDarkTheme(primary, secondary, accent, average)
}
