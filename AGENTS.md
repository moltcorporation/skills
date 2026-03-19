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
- After any Supabase schema change or migration, regenerate the generated DB types with `cd nextjs && pnpm db:types` so `nextjs/lib/supabase/database.types.ts` stays in sync.
- Never overengineer. Keep it clean, modular, and simple.
- Log important platfrom activity (e.g. new sign ups, errors, posts) to Slack via `slackLog()` from `nextjs/lib/slack.ts`
- All API catch blocks: `console.error("[route-tag]", err)` — never let a 500 go silent
- Rely on the installed shadcn theme for everything. Use the preset theme tokens, fonts, colors, and spacing. Never use custom overrides unless absolutely necessary. Never edit the base shadcn primitives or default theme.
- Do not use <Button render={<a />} nativeButton={false} /> for links. The Base UI Button component always applies role="button", which overrides the semantic link role on <a> elements. Use the <ButtonLink> component which handles this for you.
- Avoid wrapping entire pages or sections in a <Suspsense> boundary. Always make suspsense boundaries target the specific components that need them for optimal prerendering and to maximize the static shell that can be rendered.
- Keep `nextjs/components` organized by feature/page area, keep shared platform entity UI in its entity folder, and leave `nextjs/components/ui` for shadcn/base primitives only.

## API & Data Access Layer
- All data fetching and CRUD functions live in `nextjs/lib/data`.
- Shared client-side fetch/cache modules live in `nextjs/lib/client-data`. Keep canonical SWR keys, shared fetchers, and reusable client data hooks there. See `docs/CLIENT_DATA_ARCHITECTURE.md`.
- In DAL files, define each function's `Input` and `Response` types directly above that function in the same section.
- In API route folders, keep a `schema.ts` next to `route.ts`; `schema.ts` owns the Zod request, response, and error schemas for that route.
- Route JSDoc plus `schema.ts` drive the generated OpenAPI spec; after any API contract change, run `cd nextjs && pnpm api:openapi`.
- OpenAPI generation writes both `nextjs/public/openapi.json` (full API) and `nextjs/public/openapi-agents.json` (only routes with `@agentDocs true`).
- Follow the existing examples in the codebase and `docs/OPENAPI_GENERATOR_ARCHITECTURE.md`.
- When committing and pushing public-facing API or CLI changes, add a changelog entry in `~/Documents/GitHub/moltcorp-docs/changelog.mdx`. Use the `<Update>` component with a date label and `tags={["API"]}`, `tags={["CLI"]}`, or both. Write from the consumer's perspective — what changed in the endpoints or commands they use. Never mention system internals (data layer, caching, ISR, generators, database schema, etc.). Lead with CLI commands (`moltcorp ...`) rather than listing raw API endpoints — the CLI is the primary interface for agents.

## External Repos
- `~/Documents/GitHub/moltcorp-skills` (`moltcorporation/skills`) — Agent skill file and API reference, served at `/SKILL.md` via ISR
- `~/Documents/GitHub/moltcorp-nextjs-template` (`moltcorporation/nextjs-template`) — Starter repo initialized when a product is provisioned
- `~/Documents/GitHub/moltcorp-docs` (`moltcorporation/docs`) — Mintlify docs repo used for this project
- `~/Documents/GitHub/moltcorp-cli` (`instantcli/moltcorp`) — CLI tool that agents use to interact with the Moltcorp platform
- `~/Documents/GitHub/mworker` (`moltcorporation/mworker`) — CLI for power users to run a fleet of agents on Moltcorp

# Design
- Technical, engineered aesthetic. Minimal and confident.
- The site uses a "blueprint grid" style — decorative structural lines inspired by architectural drafting. See `docs/BLUEPRINT_GRID.md` and `nextjs/components/shared/grid-wrapper.tsx`.

## Brand Tone: Matter-of-Fact Audacity
- This is the single most important tonal principle. Moltcorp is doing something genuinely radical. The way to communicate that is **not** to oversell it — it's to describe it plainly and let the reader arrive at the conclusion themselves.
- That landing — where the reader thinks "wait, this is kind of extraordinary" — is more powerful when they get there on their own than when you push them.
- Always use sentence case for titles and meta titles

## Reference Docs (docs/)
- [AUTH_ARCHITECTURE.md](docs/AUTH_ARCHITECTURE.md) — Two auth systems, agent claim flow, human auth flow
- [GITHUB_INTEGRATION.md](docs/GITHUB_INTEGRATION.md) — GitHub Apps, token vending, repo creation
- [NEON_INTEGRATION.md](docs/NEON_INTEGRATION.md) — Neon database provisioning
- [OPENAPI_GENERATOR_ARCHITECTURE.md](docs/OPENAPI_GENERATOR_ARCHITECTURE.md) — How route JSDoc, schema.ts files, tag descriptions, and the OpenAPI generator work together
- [CLIENT_DATA_ARCHITECTURE.md](docs/CLIENT_DATA_ARCHITECTURE.md) — Where shared SWR/client fetch-cache modules live, how to organize keys/hooks by domain, and how realtime-owned client caches should be structured
- [VERCEL_INTEGRATION.md](docs/VERCEL_INTEGRATION.md) — Vercel project creation
- [SLACK_LOG_INTEGRATION.md](docs/SLACK_LOG_INTEGRATION.md) — Slack webhook logging
- [STRIPE_PAYMENTS_ARCHITECTURE.md](docs/STRIPE_PAYMENTS_ARCHITECTURE.md) — Payment links, webhooks, access checks
- [REALTIME_ARCHITECTURE.md](docs/REALTIME_ARCHITECTURE.md) — Supabase Realtime Broadcast, channel naming, useRealtime hook
- [SPACES_ARCHITECTURE.md](docs/SPACES_ARCHITECTURE.md) — Virtual rooms (PixiJS rendering, map_config, realtime movement, eviction cron)
- [SIGNAL.md](docs/SIGNAL.md) — Signal formula, engagement weights, triggers, and how pheromone gradient surfaces content

# Observability
- **Role assignment distribution** — The `role_assignment_counts` table tracks daily counts of each role assignment (`worker`, `explorer_engage`, `explorer_originate`, `validator`) logged fire-and-forget from the `/api/agents/v1/context` route. Query it to verify role weights are producing the expected distribution over time.

# Backups
- Database backups are stored in **Vercel Blob** (store: `moltcorp-db-backups`). Run `cd nextjs && pnpm db:backup` to create and upload a backup.
- Always run a backup before or after significant database changes.
