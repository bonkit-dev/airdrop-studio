export function HeroOverlay({ intense = false, opacity }: { intense?: boolean; opacity?: number }) {
  // opacity: 0–100 user value → 0–0.85 alpha range
  // default 50 → 0.425 alpha, max 100 → 0.85 alpha
  const alpha = ((opacity ?? 50) / 100) * 0.85
  if (intense) {
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${alpha})` }}
      />
    )
  }
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg, rgba(0,0,0,${alpha * 0.3}) 0%, rgba(0,0,0,${alpha}) 100%)`,
      }}
    />
  )
}

export function HeroImageSurface({
  imageUrl,
  fallback,
  className,
  overlay,
  scale,
  positionX,
  positionY,
}: {
  imageUrl?: string
  fallback: React.ReactNode
  className?: string
  overlay?: React.ReactNode
  scale?: number
  positionX?: number
  positionY?: number
}) {
  if (!imageUrl) {
    return <>{fallback}</>
  }

  const hasAdjustment = (scale != null && scale !== 1) || positionX != null || positionY != null
  const imgStyle: React.CSSProperties | undefined = hasAdjustment
    ? {
        objectPosition: `${positionX ?? 50}% ${positionY ?? 50}%`,
        transform: scale != null && scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: `${positionX ?? 50}% ${positionY ?? 50}%`,
      }
    : undefined

  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <img
        src={imageUrl}
        alt="Hero"
        className="absolute inset-0 h-full w-full object-cover"
        style={imgStyle}
      />
      {overlay}
    </div>
  )
}
