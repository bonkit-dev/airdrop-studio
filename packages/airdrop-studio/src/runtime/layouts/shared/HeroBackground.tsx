import type { LayoutColors } from "../slots"
import { getHeroFallbackLayers } from "./theme-utils"

export function HeroBackground({
  colors,
  gradientPrimary,
  gradientAccent,
  className,
}: {
  colors: LayoutColors
  gradientPrimary?: string
  gradientAccent?: string
  className?: string
}) {
  const fb = getHeroFallbackLayers(colors, gradientPrimary, gradientAccent)

  return (
    <div className={`absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <div className="absolute inset-0" style={{ background: fb.baseGradient }} />
      <div
        className="absolute inset-0"
        style={{
          opacity: (fb.isLight ? 0.18 : 0.12) * fb.pDim,
          background: `radial-gradient(circle 36vmin at 50% 22%, ${fb.gp} 0%, rgba(0,0,0,0) ${fb.fade}%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: (fb.isLight ? 0.13 : 0.07) * fb.aDim,
          background: `radial-gradient(circle 26vmin at 50% 30%, ${fb.ga} 0%, rgba(0,0,0,0) ${fb.fade - 2}%)`,
          filter: "blur(16px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: (fb.isLight ? 0.11 : 0.06) * fb.sDim,
          background: `radial-gradient(circle 30vmin at 25% 78%, ${fb.secondary} 0%, rgba(0,0,0,0) ${fb.fade}%)`,
          filter: "blur(20px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: (fb.isLight ? 0.08 : 0.04) * fb.pDim,
          background: `radial-gradient(circle 22vmin at 80% 50%, ${fb.gp} 0%, rgba(0,0,0,0) ${fb.fade - 4}%)`,
          filter: "blur(24px)",
        }}
      />
      {fb.isLight ? (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at center, transparent 45%, ${fb.gp}07 100%)` }}
        />
      ) : null}
    </div>
  )
}
