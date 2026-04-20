# CLAUDE.md

## What This Is

Static React SPA for a Solana token airdrop campaign. Users connect a wallet, check eligibility, and claim tokens. No SSR, no server-side logic.

## Commands

```bash
pnpm dev        # Vite dev server with hot reload
pnpm build      # TypeScript check + Vite production build
pnpm preview    # Preview production build locally
```

## Critical Rules

### MUST

- **MUST** keep the app static-hostable. No SSR, no server-side dependencies, no API routes.
- **MUST** preserve wallet connection, eligibility check, and claim functionality — these are the core purpose of this app.
- **MUST** use `--campaign-*` CSS custom properties for all theme colors. Never hardcode color values.
- **MUST** maintain the layout slot interface: layouts receive `config: LayoutConfig`, `colors: LayoutColors`, `slots: SlotProps`. Do not change this contract.
- **MUST** keep the `ErrorBoundary` wrapper in `App.tsx`.
- **MUST** run `pnpm build` to verify changes compile before reporting completion.

### MUST NOT

- **MUST NOT** modify or read the `.bonkit/` directory. It contains recipient wallet addresses, signer data, and studio workspace state.
- **MUST NOT** add dependencies that require a server runtime (Express, Next.js API routes, database drivers, etc.).
- **MUST NOT** remove or bypass the wallet adapter's connection flow.
- **MUST NOT** expose private keys, secret keys, or signer data in client-side code.
- **MUST NOT** use `dangerouslySetInnerHTML` for any user-configured content.

## File Safety

| File | Safe to edit? | Notes |
|------|---------------|-------|
| `src/layout-config.ts` | Yes with care | Typed as `LayoutConfig`. TS catches structural errors but not invalid values (bad colors, broken URLs). Verify visually after changes. |
| `src/theme.ts` | Yes with care | Typed as `ThemeTokens`. Same caveat — TS validates shape, not value correctness. |
| `.env` | Yes | Simple key=value. Invalid `VITE_RPC_URL` causes data loading failure. |
| `public/*` | Yes | Image/asset replacement. Do not remove files referenced by `layout-config.ts`. |
| `src/layouts/*` | Yes with care | Must maintain `(config, colors, slots)` prop interface. Changes affect page rendering. |
| `src/App.tsx` | Careful | Do not remove ErrorBoundary, wallet provider, or query client. |
| `src/layouts/slots.tsx` | Careful | Type changes break all layouts and wallet-slots. |
| `src/layouts/wallet-slots.tsx` | Careful | Core claim/connect/eligibility logic. |
| `src/components/wallet/*` | Careful | Core wallet connectivity. |
| `src/hooks/use-airdrop.ts` | Careful | Core airdrop state machine. |
| `campaign.config.json` | Avoid | Zod-schema validated. Invalid edits break the app AND prevent the studio from reopening the workspace. If changes are needed, edit `layout-config.ts` instead — it's the runtime-facing equivalent without schema validation constraints. |
| `.bonkit/*` | **Never** | Contains recipient data, signer info, studio state. |

## Project Structure

```
campaign.config.json          # Schema-validated config (avoid direct edits)
.env                          # VITE_RPC_URL, VITE_SITE_URL
src/
  main.tsx                    # React DOM mount entry point
  App.tsx                     # Error boundary, wallet provider, theme CSS vars, layout binding
  styles.css                  # Tailwind entry point (imports styles/campaign.css)
  theme.ts                    # Theme tokens (colors, fonts, radius)
  layout-config.ts            # Layout config (labels, images, addresses, visibility, options)
  types.ts                    # LayoutConfig + ThemeTokens type definitions
  layouts/                    # Layout components
    centered.tsx              # Centered single-column layout
    two-column.tsx            # Hero left + content right
    hero-banner.tsx           # Full-width hero image overlay
    step-card.tsx             # Step-based card layout
    slots.tsx                 # SlotProps type + Stat/Announcement slot components
    wallet-slots.tsx          # Wallet-aware slots: connect, claim, eligibility
    shared/                   # HeroBackground, FooterBlock, CountdownBlock, StatusBadge, TokenIdentity, theme-utils
  components/
    wallet/                   # Solana wallet adapter integration
    ui/                       # shadcn-style primitives (Dialog, Popover, Skeleton, Toast, etc.)
  hooks/                      # use-airdrop, use-airdrop-context, use-sol-balance, use-toast, use-wallet-modal
  lib/                        # utils (cn), airdrop-client, airdrop-transactions
  styles/campaign.css         # Tailwind CSS + campaign custom properties
```

## Editing Priority

1. `src/layout-config.ts` — labels, visibility toggles, layout options
2. `src/theme.ts` — color tokens, fonts, radius
3. `.env` — RPC endpoint, site URL
4. `src/App.tsx` — switch layout, adjust providers
5. `src/layouts/` — modify layout structure or create new layouts
6. `src/components/ui/` — modify UI primitives (last resort)

## Switching Layouts

Change the import in `App.tsx`:

```tsx
import { TwoColumnLayout } from "./layouts/two-column"
```

Update the JSX component name. Available: `CenteredLayout`, `TwoColumnLayout`, `HeroBannerLayout`, `StepCardLayout`.

## Theme System

CSS custom properties set in `App.tsx` from `theme.ts`:
`--campaign-primary`, `--campaign-background`, `--campaign-card`, `--campaign-radius-*`, `--campaign-font-body`, `--campaign-font-heading`
Use `var(--campaign-*)` in Tailwind arbitrary values or inline styles.

## Environment Variables

- `VITE_RPC_URL` — Solana RPC endpoint
- `VITE_SITE_URL` — Deployment URL. Set before production build for OG tags and canonical link.

## Social Sharing (OG Image)

No OG image is included by default. To add:

1. Create a 1200x630 PNG or JPG → `public/og-image.png`
2. Add to `index.html` `<head>`:
   ```html
   <meta property="og:image" content="%VITE_SITE_URL%/og-image.png" />
   <meta property="og:image:width" content="1200" />
   <meta property="og:image:height" content="630" />
   <meta name="twitter:image" content="%VITE_SITE_URL%/og-image.png" />
   ```
3. Change `twitter:card` to `"summary_large_image"`
4. Set `VITE_SITE_URL` in `.env`

## Conventions

- No semicolons (ASI style)
- All layout slot implementations must follow `SlotProps` in `slots.tsx`
