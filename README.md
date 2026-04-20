# airdrop-studio

CLI that launches a local browser-based studio for creating self-hosted Solana airdrop campaign pages. Generates a deployable static SPA — no server required.

## Quick Start

```bash
npx @bonkit/airdrop-studio my-campaign
```

This opens the studio in your browser. Configure layout, theme, branding, and the on-chain airdrop, then click **Generate App** to produce a deployable project.

## What You Get

- **4 layout presets** — centered, two-column, hero banner, step card
- **Solana wallet integration** — Phantom, Solflare, and all Wallet Standard compatible wallets
- **On-chain airdrop claim** — draft → recipients → deposit → start → claim
- **Customizable theme** — colors, fonts, radius via CSS custom properties
- **Static-hostable output** — deploy to Vercel, Netlify, Cloudflare Pages, S3, GitHub Pages

> Creating an on-chain airdrop requires a Solana wallet and SOL for transaction fees.

## Usage

```bash
# Create a new campaign workspace and open the studio
npx @bonkit/airdrop-studio my-campaign

# Install globally
npm install -g @bonkit/airdrop-studio
airdrop-studio my-campaign

# Re-open an existing workspace
airdrop-studio ./my-campaign

# Help
airdrop-studio --help
```

## Deploying the Generated App

```bash
cd my-campaign
pnpm install

# Optional: set deployment URL for social sharing meta tags
# Edit .env and set VITE_SITE_URL=https://your-domain.com

pnpm build
# Upload dist/ to your hosting provider
```

HTTPS is required — Solana wallet extensions refuse to connect on plain HTTP.

## Requirements

- Node.js >= 18
- pnpm

## Repository Layout

This repository mirrors the public surface of the `@bonkit/airdrop-studio` package.

- `packages/airdrop-studio/` — CLI + embedded studio app + runtime source + project generators

## Links

- [Bonkit](https://bonkit.dev)
- [npm package](https://www.npmjs.com/package/@bonkit/airdrop-studio)
