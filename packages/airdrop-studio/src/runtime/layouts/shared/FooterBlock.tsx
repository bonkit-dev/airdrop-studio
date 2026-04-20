import { SiDiscord, SiMedium, SiTelegram, SiX } from "@icons-pack/react-simple-icons"
import type { LayoutConfig, LayoutSlots } from "../slots"

const categoryIcons: Record<string, React.ReactNode> = {
  x: <SiX className="h-4 w-4 fill-current" />,
  discord: <SiDiscord className="h-4 w-4 fill-current" />,
  telegram: <SiTelegram className="h-4 w-4 fill-current" />,
  medium: <SiMedium className="h-4 w-4 fill-current" />,
}

export function FooterBlock({
  config,
  slots,
  className,
  immersive = false,
}: {
  config: LayoutConfig
  slots: LayoutSlots
  className?: string
  immersive?: boolean
}) {
  const links = config.footerLinks.filter((l) => l.label.trim().length > 0 && l.href.trim().length > 0)

  if (!config.showTagline && (!config.showFooter || links.length === 0)) return null

  const onImage = immersive && !!config.heroImageUrl
  const mutedColor = onImage ? "text-white/60" : "text-[var(--campaign-muted-foreground)]"
  const hoverColor = onImage ? "hover:text-white/90" : "hover:text-[var(--campaign-foreground)]"

  return (
    <div className={`relative shrink-0 ${className ?? ""}`}>
      {onImage ? (
        <div className="absolute inset-x-0 bottom-0 top-[-4rem] bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
      ) : null}
      <footer className={`relative px-4 py-4 pb-24 text-center sm:pb-4 ${onImage ? "" : "border-t border-[var(--campaign-border)]"}`}>
        {config.showTagline ? (
          <slots.Text
            field="tagline"
            value={config.tagline}
            placeholder="Your tagline here"
            className={`text-sm ${mutedColor}`}
            tag="p"
          />
        ) : null}
        {config.showFooter && links.length > 0 ? (
          <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm ${config.showTagline ? "mt-3" : ""}`}>
            {links.map((link) => {
              const icon = link.category && link.category !== "custom" ? categoryIcons[link.category] : null

              if (icon && link.iconOnly) {
                return (
                  <a key={link.id || link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label}
                    className={`inline-flex items-center justify-center transition ${mutedColor} ${hoverColor}`}>
                    {icon}
                  </a>
                )
              }

              return (
                <a key={link.id || link.label} href={link.href} target="_blank" rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 transition ${mutedColor} ${hoverColor}`}>
                  {icon ? icon : null}
                  <span>{link.label}</span>
                </a>
              )
            })}
          </div>
        ) : null}
      </footer>
    </div>
  )
}
