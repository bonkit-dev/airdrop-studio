"use client"

export type LayoutPresetId =
  | "two-column"
  | "hero-banner"
  | "centered"
  | "step-card"
export type BlockId =
  | "header"
  | "announcement"
  | "hero-image"
  | "title"
  | "body"
  | "cta"
  | "stats"
  | "countdown"
  | "eligibility"
  | "footer"

export type CanonicalPresetId = LayoutPresetId

export type WidthMode = "full" | "content" | "narrow"
export type ToneToken = "primary" | "secondary" | "accent" | "surface" | "background" | "muted"
export type BlockCategory = "brand" | "content" | "action" | "data" | "meta"
export type LayoutContainerKind = "section" | "stack" | "split" | "row" | "grid" | "hero-shell"
export type BlockVariant =
  | "default"
  | "stacked"
  | "split"
  | "inline"
  | "poster"
  | "token-chip"
  | "banner"
  | "card-grid"
  | "step-list"

export type ResponsiveValue<T> = {
  mobile: T
  tablet?: T
  desktop?: T
}

export type ColorRef = { mode: "token"; value: ToneToken } | { mode: "fixed"; value: string }

export type BlockPropDefinition =
  | {
      key: string
      type: "boolean"
      label: string
    }
  | {
      key: string
      type: "select"
      label: string
      options: string[]
    }
  | {
      key: string
      type: "width-mode"
      label: string
      options: WidthMode[]
    }
  | {
      key: string
      type: "color-token"
      label: string
      allowFixedColor?: boolean
    }

export type BlockDefinition = {
  kind: BlockId
  label: string
  description: string
  category: BlockCategory
  variants: BlockVariant[]
  defaultVariant: BlockVariant
  supports: {
    removable: boolean
    reorderable: boolean
    duplicable: boolean
  }
  constraints?: {
    maxInstances?: number
    requires?: BlockId[]
    incompatibleWith?: BlockId[]
  }
  editableProps: BlockPropDefinition[]
}

export type LayoutBlockNode = {
  id: string
  type: "block"
  kind: BlockId
  variant?: BlockVariant
  props?: {
    width?: WidthMode
    tone?: ColorRef
    background?: ColorRef
    align?: "left" | "center" | "right"
    visible?: {
      mobile?: boolean
      desktop?: boolean
    }
  }
}

export type LayoutContainerNode = {
  id: string
  type: "container"
  kind: LayoutContainerKind
  props?: {
    width?: WidthMode
    gap?: "sm" | "md" | "lg"
    align?: ResponsiveValue<"start" | "center" | "end">
    columns?: ResponsiveValue<1 | 2 | 3>
    direction?: ResponsiveValue<"vertical" | "horizontal">
  }
  children: LayoutNode[]
}

export type LayoutNode = LayoutBlockNode | LayoutContainerNode

export type LayoutDocument = {
  version: 1
  presetId: CanonicalPresetId
  root: LayoutContainerNode
}

export type LayoutPresetDefinition = {
  id: LayoutPresetId
  label: string
  description: string
  details: string
  responsivePolicy: {
    mobileFlow: "stack-top" | "stack-centered" | "app-shell"
    desktopFlow: "stack" | "split-left-right" | "centered"
  }
  document: LayoutDocument
}

// Fallback preset used when a saved campaign references a preset that no longer exists in
// code (e.g. a removed preset name left over in an older campaign.config.json). Pairs with
// `isLayoutPresetId` as a type guard — renders safely instead of showing a blank page.
// Not used when `layoutPreset` is explicitly null; the studio shows an empty state in that case.
export const DEFAULT_LAYOUT_PRESET_ID: LayoutPresetId = "hero-banner"

export function isLayoutPresetId(value: string | null | undefined): value is LayoutPresetId {
  if (!value) {
    return false
  }

  return value in LAYOUT_PRESET_DEFINITIONS
}

export const BLOCK_DEFINITIONS: Record<BlockId, BlockDefinition> = {
  header: {
    kind: "header",
    label: "Header",
    description: "Logo, brand name, connect wallet",
    category: "brand",
    variants: ["default", "inline"],
    defaultVariant: "default",
    supports: { removable: false, reorderable: true, duplicable: false },
    constraints: { maxInstances: 1 },
    editableProps: [
      { key: "width", type: "width-mode", label: "Width", options: ["full", "content", "narrow"] },
      { key: "tone", type: "color-token", label: "Tone", allowFixedColor: false },
    ],
  },
  announcement: {
    kind: "announcement",
    label: "Announcement",
    description: "Public announcement banner",
    category: "meta",
    variants: ["banner", "inline"],
    defaultVariant: "banner",
    supports: { removable: true, reorderable: true, duplicable: false },
    constraints: { maxInstances: 1 },
    editableProps: [
      { key: "background", type: "color-token", label: "Background", allowFixedColor: true },
      { key: "tone", type: "color-token", label: "Text Tone", allowFixedColor: true },
    ],
  },
  "hero-image": {
    kind: "hero-image",
    label: "Hero Image",
    description: "Featured banner image",
    category: "content",
    variants: ["poster", "token-chip", "banner"],
    defaultVariant: "poster",
    supports: { removable: true, reorderable: true, duplicable: false },
    editableProps: [
      { key: "width", type: "width-mode", label: "Width", options: ["content", "full"] },
      { key: "background", type: "color-token", label: "Backdrop", allowFixedColor: true },
    ],
  },
  title: {
    kind: "title",
    label: "Title",
    description: "Main title and subtitle",
    category: "content",
    variants: ["default", "inline"],
    defaultVariant: "default",
    supports: { removable: true, reorderable: true, duplicable: false },
    editableProps: [{ key: "width", type: "width-mode", label: "Width", options: ["content", "narrow", "full"] }],
  },
  body: {
    kind: "body",
    label: "Body",
    description: "Description text",
    category: "content",
    variants: ["default"],
    defaultVariant: "default",
    supports: { removable: true, reorderable: true, duplicable: false },
    editableProps: [{ key: "width", type: "width-mode", label: "Width", options: ["content", "narrow", "full"] }],
  },
  cta: {
    kind: "cta",
    label: "CTA Buttons",
    description: "Claim and eligibility buttons",
    category: "action",
    variants: ["stacked", "split", "inline"],
    defaultVariant: "stacked",
    supports: { removable: true, reorderable: true, duplicable: false },
    editableProps: [
      { key: "width", type: "width-mode", label: "Width", options: ["content", "full"] },
      { key: "tone", type: "color-token", label: "Primary Tone", allowFixedColor: false },
    ],
  },
  stats: {
    kind: "stats",
    label: "Statistics",
    description: "Claims and allocation metrics",
    category: "data",
    variants: ["inline", "card-grid", "stacked"],
    defaultVariant: "inline",
    supports: { removable: true, reorderable: true, duplicable: false },
    editableProps: [
      { key: "background", type: "color-token", label: "Background", allowFixedColor: true },
      { key: "width", type: "width-mode", label: "Width", options: ["content", "full"] },
    ],
  },
  countdown: {
    kind: "countdown",
    label: "Countdown",
    description: "Time-based countdown timer",
    category: "data",
    variants: ["default"],
    defaultVariant: "default",
    supports: { removable: true, reorderable: true, duplicable: false },
    constraints: { maxInstances: 1 },
    editableProps: [{ key: "tone", type: "color-token", label: "Tone", allowFixedColor: false }],
  },
  eligibility: {
    kind: "eligibility",
    label: "Eligibility",
    description: "Qualification checklist",
    category: "data",
    variants: ["default", "card-grid"],
    defaultVariant: "default",
    supports: { removable: true, reorderable: true, duplicable: false },
    editableProps: [{ key: "background", type: "color-token", label: "Background", allowFixedColor: true }],
  },
  footer: {
    kind: "footer",
    label: "Footer",
    description: "Tagline and social links",
    category: "meta",
    variants: ["default", "inline"],
    defaultVariant: "default",
    supports: { removable: true, reorderable: true, duplicable: false },
    constraints: { maxInstances: 1 },
    editableProps: [{ key: "tone", type: "color-token", label: "Tone", allowFixedColor: false }],
  },
}

const buildDocument = (
  presetId: CanonicalPresetId,
  blocks: BlockId[],
  flow: LayoutPresetDefinition["responsivePolicy"],
): LayoutDocument => ({
  version: 1,
  presetId,
  root: {
    id: `${presetId}-root`,
    type: "container",
    kind: "section",
    props: {
      width: "full",
      gap: "lg",
      align: {
        mobile: "start",
        desktop: flow.desktopFlow === "centered" ? "center" : "start",
      },
    },
    children: blocks.map((blockId, index) => ({
      id: `${presetId}-${blockId}-${index + 1}`,
      type: "block",
      kind: blockId,
    })),
  },
})

export function getLayoutPresetDefinition(preset: LayoutPresetId): LayoutPresetDefinition {
  return LAYOUT_PRESET_DEFINITIONS[preset] ?? LAYOUT_PRESET_DEFINITIONS[DEFAULT_LAYOUT_PRESET_ID]
}

export const LAYOUT_PRESET_DEFINITIONS: Record<LayoutPresetId, LayoutPresetDefinition> = {
  "two-column": {
    id: "two-column",
    label: "Two-Column",
    description: "Token art or hero visual sits on one side, while copy and claim actions stack on the other.",
    details: "Stacks vertically on mobile and splits on desktop.",
    responsivePolicy: { mobileFlow: "stack-top", desktopFlow: "split-left-right" },
    document: buildDocument(
      "two-column",
      ["announcement", "header", "countdown", "hero-image", "title", "body", "cta", "stats", "footer"],
      {
        mobileFlow: "stack-top",
        desktopFlow: "split-left-right",
      },
    ),
  },
  "hero-banner": {
    id: "hero-banner",
    label: "Hero Banner",
    description: "A wide banner image fronts the page, with stats and CTAs configurable below.",
    details:
      "Toggle CTA arrangement (inline or stacked) and stats placement (top bar or inline cards) in the layout panel. Requires a hero image to feel complete.",
    responsivePolicy: { mobileFlow: "stack-top", desktopFlow: "centered" },
    document: buildDocument(
      "hero-banner",
      ["announcement", "header", "countdown", "stats", "title", "body", "cta", "eligibility", "footer"],
      {
        mobileFlow: "stack-top",
        desktopFlow: "centered",
      },
    ),
  },
  centered: {
    id: "centered",
    label: "Centered",
    description: "A single centered composition that adapts from copy-led editorial to timer-first urgency via options.",
    details: "Configure width, density, announcement style, countdown emphasis, CTA layout, and stats size in the Layout panel.",
    responsivePolicy: { mobileFlow: "stack-top", desktopFlow: "centered" },
    document: buildDocument(
      "centered",
      ["announcement", "header", "countdown", "title", "body", "cta", "stats", "footer"],
      {
        mobileFlow: "stack-top",
        desktopFlow: "centered",
      },
    ),
  },
  "step-card": {
    id: "step-card",
    label: "Step Card",
    description: "A compact, app-like flow that feels guided and transactional rather than editorial.",
    details: "Useful for wallet-first claim flows where the user should move through a clear sequence.",
    responsivePolicy: { mobileFlow: "app-shell", desktopFlow: "centered" },
    document: buildDocument(
      "step-card",
      ["announcement", "header", "countdown", "hero-image", "title", "body", "cta", "eligibility", "stats", "footer"],
      {
        mobileFlow: "app-shell",
        desktopFlow: "centered",
      },
    ),
  },
}

export const BLOCK_METADATA = Object.fromEntries(
  Object.entries(BLOCK_DEFINITIONS).map(([key, definition]) => [
    key,
    { label: definition.label, description: definition.description },
  ]),
) as Record<BlockId, { label: string; description: string }>

export const LAYOUT_PRESET_LABELS = Object.fromEntries(
  Object.entries(LAYOUT_PRESET_DEFINITIONS).map(([key, definition]) => [key, definition.label]),
) as Record<LayoutPresetId, string>
