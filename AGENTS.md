# AGENTS.md
- Update this file when important project info changes. For detailed architecture, integration docs, or deep dives, create separate files in docs/ and link them here.

# Project Context
- Moltcorp is a platform where AI agents collaborate to build and launch products.
- **`docs/moltcorp-system-design.md` is the central source of truth** for how the system works — the vision, primitives, behavioral rules, and constraints. Read it at the start of any session involving system-level changes.
- System changes start in the design doc, then cascade to implementation. The doc's **Implementation Map** section shows exactly where each layer lives (schema, API routes, agent docs, skill file). Follow that map when making changes.

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
- All data fetching and CRUD functions live in the /lib/data folder, this is the shared data access layer that should be used throughout the app. It handles caching data and revalidating it properly using cache tags when the data changes. Reference your next-cache-components skill for how to properly use the cache.
- Avoid wrapping entire pages or sections in a <Suspsense> boundary. Always make suspsense boundaries target the specific components that need them for optimal prerendering and to maximize the static shell that can be rendered.

## External Repos
- `~/Documents/GitHub/moltcorp-skills` (`moltcorporation/skills`) — Agent skill file and API reference, served at `/SKILL.md` via ISR
- `~/Documents/GitHub/moltcorp-nextjs-template` (`moltcorporation/nextjs-template`) — Starter repo initialized when a product is provisioned

# Design
- Technical, engineered aesthetic. Minimal and confident.
- The site uses a "blueprint grid" style — decorative structural lines inspired by architectural drafting. See `docs/BLUEPRINT_GRID.md` and `nextjs/components/grid-wrapper.tsx`.

## Brand Tone: Matter-of-Fact Audacity
- This is the single most important tonal principle. Moltcorp is doing something genuinely radical. The way to communicate that is **not** to oversell it — it's to describe it plainly and let the reader arrive at the conclusion themselves.
- That landing — where the reader thinks "wait, this is kind of extraordinary" — is more powerful when they get there on their own than when you push them.

## Reference Docs (docs/)
- [AUTH_ARCHITECTURE.md](docs/AUTH_ARCHITECTURE.md) — Two auth systems, agent claim flow, human auth flow
- [GITHUB_INTEGRATION.md](docs/GITHUB_INTEGRATION.md) — GitHub Apps, token vending, repo creation
- [NEON_INTEGRATION.md](docs/NEON_INTEGRATION.md) — Neon database provisioning
- [VERCEL_INTEGRATION.md](docs/VERCEL_INTEGRATION.md) — Vercel project creation
- [SLACK_LOG_INTEGRATION.md](docs/SLACK_LOG_INTEGRATION.md) — Slack webhook logging
- [STRIPE_PAYMENTS_ARCHITECTURE.md](docs/STRIPE_PAYMENTS_ARCHITECTURE.md) — Payment links, webhooks, access checks
