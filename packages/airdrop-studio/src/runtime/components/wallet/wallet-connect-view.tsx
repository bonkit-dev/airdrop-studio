export type WalletOptionItem = {
  name: string
  icon?: string
  statusLabel: string
  onClick: () => void
}

export type WalletConnectViewProps = {
  title?: string
  wallets: WalletOptionItem[]
  footer?: React.ReactNode
}

export function WalletConnectView({
  title = "Connect Wallet",
  wallets,
  footer,
}: WalletConnectViewProps) {
  return (
    <>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--campaign-border)" }}
      >
        <h3 className="text-sm font-semibold text-[var(--campaign-foreground)]">
          {title}
        </h3>
      </div>

      {/* Wallet list */}
      <div className="flex flex-col gap-1 p-2">
        {wallets.map((w) => (
          <button
            key={w.name}
            type="button"
            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors active:scale-[0.98]"
            style={{
              borderRadius: "var(--campaign-radius-md)",
              color: "var(--campaign-foreground)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--campaign-input-hover)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
            onClick={w.onClick}
          >
            {w.icon ? (
              <img
                src={w.icon}
                alt={w.name}
                className="h-10 w-10 shadow-sm"
                style={{ borderRadius: "var(--campaign-radius-md)" }}
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center text-[var(--campaign-muted-foreground)]"
                style={{
                  borderRadius: "var(--campaign-radius-md)",
                  backgroundColor: "var(--campaign-input)",
                }}
              >
                <span className="text-lg">?</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{w.name}</span>
              <span
                className="text-[11px]"
                style={{ color: "var(--campaign-muted-foreground)" }}
              >
                {w.statusLabel}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Optional footer */}
      {footer}
    </>
  )
}
