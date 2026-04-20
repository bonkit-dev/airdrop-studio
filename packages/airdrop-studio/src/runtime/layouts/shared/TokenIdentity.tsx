import { ExternalLink } from "lucide-react"

type Props = {
  symbolUrl?: string
  tokenName?: string
  tokenSymbol?: string
  mintAddress?: string
  networkCluster?: "devnet" | "mainnet-beta"
  imageClassName?: string
  imageObjectFit?: "cover" | "contain"
  className?: string
}

function solscanTokenUrl(mintAddress: string, cluster?: "devnet" | "mainnet-beta") {
  const base = `https://solscan.io/token/${mintAddress}`
  return cluster === "devnet" ? `${base}?cluster=devnet` : base
}

export function TokenIdentity({
  symbolUrl,
  tokenName,
  tokenSymbol,
  mintAddress,
  networkCluster,
  imageClassName = "h-16 w-16",
  imageObjectFit = "cover",
  className,
}: Props) {
  const hasTextInfo = Boolean(tokenName || tokenSymbol)
  const solscanUrl = mintAddress ? solscanTokenUrl(mintAddress, networkCluster) : null
  if (!symbolUrl && !hasTextInfo) return null

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      {symbolUrl ? (
        <img
          src={symbolUrl}
          alt=""
          className={`${imageClassName} rounded-full object-${imageObjectFit} shrink-0`}
        />
      ) : null}
      {hasTextInfo || solscanUrl ? (
        <div className="flex flex-col items-start text-left min-w-0 leading-tight">
          {tokenName ? (
            <span className="font-semibold text-base truncate max-w-[200px] text-[var(--campaign-foreground)]">{tokenName}</span>
          ) : null}
          {tokenSymbol ? (
            <span className="text-xs text-[var(--campaign-muted-foreground)]">{tokenSymbol}</span>
          ) : null}
          {solscanUrl ? (
            <a
              href={solscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--campaign-muted-foreground)] hover:underline mt-0.5 inline-flex items-center gap-0.5"
            >
              View on Solscan
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
