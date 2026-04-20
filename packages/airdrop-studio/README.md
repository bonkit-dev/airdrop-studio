# @bonkit/airdrop-studio

CLI tool that launches a local browser-based studio for creating Solana airdrop campaign pages. Generates a deployable static SPA — no server required.

## Quick Start

```bash
npx @bonkit/airdrop-studio my-campaign
```

This opens the Bonkit studio in your browser. Configure your campaign visually, then click **Generate App** to produce a deployable project.

## What It Does

1. **Opens a visual studio** in your browser for campaign configuration
2. **Configures layout, theme, branding** with live preview
3. **Creates an on-chain airdrop** (draft → recipients → deposit → start)
4. **Generates a static React app** deployable to any hosting (Vercel, Netlify, GitHub Pages, etc.)

> Creating an on-chain airdrop requires a Solana wallet and SOL for transaction fees.

## Usage

```bash
# Create a new campaign workspace and open the studio
npx @bonkit/airdrop-studio my-campaign

# Or install globally
npm install -g @bonkit/airdrop-studio

# Then use the CLI directly
airdrop-studio my-campaign

# Re-open an existing workspace
airdrop-studio ./my-campaign

# Open studio for current directory
airdrop-studio .

# Help
airdrop-studio --help
```

## Generated App

The studio generates a Vite + React + TypeScript SPA with:

- **4 layout presets** — Centered, Two-Column, Hero Banner, Step Card
- **Solana wallet integration** — Phantom, Solflare, and all Wallet Standard compatible wallets
- **On-chain airdrop claim** — eligibility check + token claim flow
- **Customizable theme** — colors, fonts, radius, all via CSS custom properties
- **AI-ready** — generated apps include `CLAUDE.md` and `AGENTS.md` so AI coding agents (Claude Code, Cursor, etc.) can safely customize the output

### Deploy

```bash
cd my-campaign
pnpm install

# Set deployment URL for social sharing meta tags (optional)
# Edit .env and set VITE_SITE_URL=https://your-domain.com

pnpm build
# Upload dist/ to your hosting provider
```

HTTPS is required — Solana wallet extensions refuse to connect on plain HTTP.

## Requirements

- Node.js >= 18
- pnpm

## Links

- [Bonkit](https://bonkit.dev)
