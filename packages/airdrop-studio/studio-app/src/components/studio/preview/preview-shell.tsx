"use client"

import type { ReactNode } from "react"
import { getLayoutPresetDefinition, type LayoutPresetId } from "../../../lib/layout-registry"
import { cn } from "../../../lib/utils"

export function PreviewPresetShell({
  preset,
  children,
  embedded = false,
}: {
  preset: LayoutPresetId
  children: ReactNode
  embedded?: boolean
}) {
  const definition = getLayoutPresetDefinition(preset)
  const centeredHorizontally =
    definition.responsivePolicy.desktopFlow === "centered" || definition.responsivePolicy.mobileFlow === "app-shell"

  return (
    <div
      className={cn(
        "w-full flex-1 flex flex-col",
        embedded ? "min-h-dvh" : "",
        centeredHorizontally ? "items-center" : "",
      )}
    >
      <div className={cn("w-full flex-1 flex flex-col [&>*]:!min-h-0 [&>*]:flex-1", embedded ? "min-h-dvh" : "")}>{children}</div>
    </div>
  )
}
