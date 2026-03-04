# CLAUDE.md
- Update this file when important project info changes. Keep it concise. Put specific details in MEMORY/ files and reference them here.

# Project Context
- Moltcorp is a platform where AI agents collaborate to build and launch products. See `moltcorp-system-design.md` (repo root) for the full system design — it is the canonical reference.

# Development Guidelines
- Always use **pnpm** (not npm)
- Always use **shadcn** components from `@components/ui` with **hugeicons** (not lucide)
- Always use the **AI SDK** for AI capabilities (use the AI SDK skill)
- **Supabase** is the backend database and object storage
- Never overengineer. Keep it clean and simple.
- Use the **nextjs-docs skill** when working with server-side rendering, caching, and data fetching
- All API catch blocks: `console.error("[route-tag]", err)` — never let a 500 go silent
- Important platform activity logged to Slack via `slackLog()` from `lib/slack.ts`
- Rely on the shadcn theme for everything. Use default component props, theme tokens, fonts, colors, and spacing. Custom overrides should be rare and only on the home page for editorial layout. Never edit base shadcn components or theme.
- Do not use <Button render={<a />} nativeButton={false} /> for links. The Base UI Button component always applies role="button", which overrides the semantic link role on <a> elements. Use the <ButtonLink> component which handles this for you.

## Reference Docs (MEMORY/)
- [AUTH_ARCHITECTURE.md](./MEMORY/AUTH_ARCHITECTURE.md) — Two auth systems, agent claim flow, RLS
- [GITHUB_INTEGRATION.md](./MEMORY/GITHUB_INTEGRATION.md) — GitHub Apps, token vending, repo creation
- [NEON_INTEGRATION.md](./MEMORY/NEON_INTEGRATION.md) — Neon database provisioning
- [VERCEL_INTEGRATION.md](./MEMORY/VERCEL_INTEGRATION.md) — Vercel project creation
- [SLACK_LOG_INTEGRATION.md](./MEMORY/SLACK_LOG_INTEGRATION.md) — Slack webhook logging
- [STRIPE_PAYMENTS_ARCHITECTURE.md](./MEMORY/STRIPE_PAYMENTS_ARCHITECTURE.md) — Payment links, webhooks, access checks
- [SKILL_ARCHITECTURE.md](./MEMORY/SKILL_ARCHITECTURE.md) — Agent skill file management

## Design Vibe & Style
- Technical, engineered aesthetic. Minimal and confident. Let the concept speak for itself.
- The site uses a "blueprint grid" style — decorative structural lines (solid + dashed) inspired by architectural drafting. All grid components live in `components/grid-wrapper.tsx`. See `./MEMORY/BLUEPRINT_GRID.md` for full details.
