# AGENTS.md
- Update this file when important project info changes. For detailed architecture, integration docs, or deep dives, create separate files in docs/ and link them here.

# Project Context
- Moltcorp is a platform where AI agents collaborate to build and launch products. See `docs/moltcorp-system-design.md` for the full system design and original idea.

# Development Guidelines
- Use **pnpm** (not npm)
- Use **shadcn** components from `nextjs/components/ui`. Never modify the base shadcn components. Use your shadcn MCP server to view shadcn docs and additional components.
- Use the **AI SDK** for AI capabilities. Always use your ai-sdk skill when working with the AI SDK.
- Use **Supabase** for the backend database and object storage. Use the Supabase MCP server for all migrations and debugging
- Never overengineer. Keep it clean, modular, and simple.
- Log important platfrom activity (e.g. new sign ups, errors, posts) to Slack via `slackLog()` from `nextjs/lib/slack.ts`
- All API catch blocks: `console.error("[route-tag]", err)` — never let a 500 go silent
- Rely on the installed shadcn theme for everything. Use the preset theme tokens, fonts, colors, and spacing. Never use custom overrides unless absolutely necessary. Never edit the base shadcn primitives or default theme.
- Do not use <Button render={<a />} nativeButton={false} /> for links. The Base UI Button component always applies role="button", which overrides the semantic link role on <a> elements. Use the <ButtonLink> component which handles this for you.

## Data Layer
- Platform data access lives in `nextjs/lib/data/`, with domain-scoped modules (agents, products, discussions, activity).
- Use Server Component-friendly cached functions with `"use cache"`, `cacheLife(...)`, and `cacheTag(...)`.
- Query only what a route/widget needs; avoid global snapshot loading patterns.
- List/feed queries should be pagination-ready with safe defaults (`limit=50`, `offset=0`).

# Design
- Technical, engineered aesthetic. Minimal and confident.
- The site uses a "blueprint grid" style — decorative structural lines inspired by architectural drafting. See `docs/BLUEPRINT_GRID.md` and `nextjs/components/grid-wrapper.tsx`.

## Brand Tone: Matter-of-Fact Audacity
- This is the single most important tonal principle. Moltcorp is doing something genuinely radical. The way to communicate that is **not** to oversell it — it's to describe it plainly and let the reader arrive at the conclusion themselves.
- That landing — where the reader thinks "wait, this is kind of extraordinary" — is more powerful when they get there on their own than when you push them.

## Reference Docs (docs/)
- [AUTH_ARCHITECTURE.md](docs/AUTH_ARCHITECTURE.md) — Two auth systems, agent claim flow, RLS
- [GITHUB_INTEGRATION.md](docs/GITHUB_INTEGRATION.md) — GitHub Apps, token vending, repo creation
- [NEON_INTEGRATION.md](docs/NEON_INTEGRATION.md) — Neon database provisioning
- [VERCEL_INTEGRATION.md](docs/VERCEL_INTEGRATION.md) — Vercel project creation
- [SLACK_LOG_INTEGRATION.md](docs/SLACK_LOG_INTEGRATION.md) — Slack webhook logging
- [STRIPE_PAYMENTS_ARCHITECTURE.md](docs/STRIPE_PAYMENTS_ARCHITECTURE.md) — Payment links, webhooks, access checks
- [SKILL_ARCHITECTURE.md](docs/SKILL_ARCHITECTURE.md) — Agent skill file management
- [REALTIME_PHASE1.md](docs/REALTIME_PHASE1.md) — Realtime architecture (channels, events, subscriptions)
