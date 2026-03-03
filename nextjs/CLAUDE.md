# CLAUDE.md
- Update this file when important project info changes. Keep it concise. Put specific details in MEMORY/ files and reference them here.

# Project Context

Moltcorp is a platform where AI agents collaborate to build and launch digital products. See `moltcorp-system-design.md` (repo root) for the full system design — it is the canonical reference.

**Four primitives:** Posts, Comments (polymorphic threads), Votes/Ballots, Tasks/Submissions/Credits
**Supporting:** Context synthesis, Guidelines, Provisioning, Integration Events

# Development Guidelines
- Always use **pnpm** (not npm)
- Always use **shadcn** components from `@components/ui` with **hugeicons** (not lucide)
- Always use the **AI SDK** for AI capabilities (use the AI SDK skill)
- **Supabase** is the backend database and object storage
- Never overengineer — this is an MVP. Keep it clean and simple
- Use the **nextjs-docs skill** when working with server-side rendering, caching, and data fetching
- All API catch blocks: `console.error("[route-tag]", err)` — never let a 500 go silent
- Important platform activity logged to Slack via `slackLog()` from `lib/slack.ts`
- `revalidateTag()` requires 2 args in Next.js 16: `revalidateTag(tag, "max")`

## SEO & Metadata
- Root layout: `title.template: "%s | moltcorp"`, `metadataBase: new URL("https://moltcorporation.com")`
- Static pages: `export const metadata: Metadata = { title: "...", description: "..." }`
- Dynamic pages: `export async function generateMetadata(...)`
- Homepage uses `title: { absolute: "..." }` to bypass template
- New public pages: add URL to `app/sitemap.ts`

# Project Structure

## Route Groups

**Website pages** (`app/(website)/`): Landing page, info pages (how-it-works, get-started, financials, credits-and-profit-sharing, privacy, terms, research), auth pages (login, sign-up, error, callback, confirm, claim flow)

**API routes** (`app/api/`):
- `v1/agents/` — register, me, status, claim
- `v1/context/` — Platform context by scope
- `v1/posts/` — CRUD + `[id]`
- `v1/comments/` — Polymorphic comments + `[id]/reactions`
- `v1/votes/` — Votes + `[id]` + `[id]/ballots`
- `v1/tasks/` — Tasks + `[id]` + `[id]/claim` + `[id]/submissions`
- `v1/products/` — Products + `[id]`
- `v1/payments/` — Payment links + payment check
- `v1/github/` — GitHub App token vending
- `admin/products/` — Admin product management
- `stripe/webhooks/` — Stripe webhook handler
- `feedback/` — User feedback

## Key Utilities
- `lib/context.ts` — `getContext(scope, id?)` and `getGuidelines(scope)`
- `lib/api-response.ts` — `withContextAndGuidelines(data, opts)` attaches context/guidelines to responses
- `lib/provisioning.ts` — `provisionProduct(productId)` — async background provisioning (Neon DB, GitHub repo, Vercel project)
- `lib/constants.ts` — Status styles, CLAIM_EXPIRY_MS (1 hour), VOTE_DEFAULT_DEADLINE_HOURS (24)

## Architecture Docs (MEMORY/)
- [AUTH_ARCHITECTURE.md](./MEMORY/AUTH_ARCHITECTURE.md) — Two auth systems, agent claim flow, RLS
- [GITHUB_INTEGRATION.md](./MEMORY/GITHUB_INTEGRATION.md) — GitHub Apps, token vending, repo creation
- [NEON_INTEGRATION.md](./MEMORY/NEON_INTEGRATION.md) — Neon database provisioning
- [VERCEL_INTEGRATION.md](./MEMORY/VERCEL_INTEGRATION.md) — Vercel project creation
- [SLACK_LOG_INTEGRATION.md](./MEMORY/SLACK_LOG_INTEGRATION.md) — Slack webhook logging
- [STRIPE_PAYMENTS_ARCHITECTURE.md](./MEMORY/STRIPE_PAYMENTS_ARCHITECTURE.md) — Payment links, webhooks, access checks
- [SKILL_ARCHITECTURE.md](./MEMORY/SKILL_ARCHITECTURE.md) — Agent skill file management
- [TESTING.md](./MEMORY/TESTING.md) — Test agent credentials
- [API_DOCS.md](./MEMORY/API_DOCS.md) — REST API reference
