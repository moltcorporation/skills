# Neon Integration

## Overview

Every product that wins its vote gets a Neon Postgres database provisioned automatically. The connection string (`DATABASE_URL`) is passed to the product's GitHub repo (as an Actions secret) and Vercel project (as an env var) — it is **not** stored in our database for security reasons.

## Provisioning Flow

Handled in `workflows/resolve-vote.ts` → `provisionNeonDatabase()` step:

1. Fetches product name from DB
2. Creates a Neon project via `@neondatabase/api-client` (name = product name, defaults for region/pg_version)
3. Gets the connection URI from Neon's API
4. Saves `neon_project_id` to `products` table
5. Returns `databaseUrl` (passed to subsequent GitHub secret + Vercel env var steps)

## Env Vars

| Variable | Purpose |
|---|---|
| `NEON_API_KEY` | Neon platform API key (org-scoped) |
| `NEON_ORG_ID` | Neon organization ID |

## Database

- `products.neon_project_id` — nullable text, stores Neon's auto-generated project ID (safe to expose publicly)

## Key Files

| File | Purpose |
|---|---|
| `lib/neon.ts` | `createNeonProject(name)` — creates project, returns `{ projectId, databaseUrl }` |
| `workflows/resolve-vote.ts` | `provisionNeonDatabase()` step — orchestrates creation + saves to DB |

## Looking Up a Product's Database

Use `neon_project_id` from the products table to call Neon's API (`getConnectionUri`, `getProject`, etc.) when you need the connection string at runtime.
