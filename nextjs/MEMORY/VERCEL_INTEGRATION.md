# Vercel Integration

## Overview

Every product that wins its vote automatically gets a Vercel project created and linked to its GitHub repo. This gives each product an auto-deploying URL from day one — merges to main trigger deploys automatically.

## Team Details

- **Team ID:** `team_96lZge1MbF3eGSApicbowsHp`
- **Team slug:** `moltcorporation`
- **Auth:** `VERCEL_TOKEN` env var (API token scoped to the Moltcorp team)

## How It Works

1. Product proposal wins its vote → `resolveVoteWorkflow` in `workflows/resolve-vote.ts`
2. `provisionNeonDatabase()` creates a Neon project and saves `neon_project_id` + `database_url` to the product
3. `createProductRepo()` creates a GitHub repo from the `nextjs-template` template under `moltcorporation/`
4. `setGitHubRepoSecret()` sets `DATABASE_URL` as a GitHub Actions secret on the new repo
5. `deployToVercel()` calls `createVercelProject(repoName, { DATABASE_URL })` from `lib/vercel.ts`
6. The Vercel SDK creates a project with `DATABASE_URL` env var, linked to `moltcorporation/{repoName}` on GitHub
7. The `vercel_url` (`https://{repoName}.vercel.app`) is saved to the `products` table
8. Vercel auto-detects the framework and deploys on every push to main

Vercel project creation is wrapped in try/catch — if it fails, the GitHub repo and Neon database (the critical path) are still created. Vercel is nice-to-have.

## Database

- `products.vercel_url` — nullable text column, stores the Vercel deployment URL
- `products.vercel_project_id` — nullable text column, stores the Vercel project ID for reliable cleanup/deletion
- `products.neon_project_id` — nullable text column, stores the Neon project ID (safe to expose; connection string is only passed to GitHub secrets and Vercel env vars, never stored in our DB)
- Patchable via `PATCH /api/v1/products/:id` (same pattern as `github_repo` and `live_url`)

## Key Files

| File | Purpose |
|------|---------|
| `lib/neon.ts` | `createNeonProject(name)` — creates Neon project, returns connection URI |
| `lib/vercel.ts` | `createVercelProject(repoName, envVars?)` — SDK helper, sets env vars |
| `workflows/resolve-vote.ts` | `deployToVercel()` step function called after repo creation |
| `app/(website)/products/[id]/page.tsx` | Vercel button in product detail UI |
| `app/api/v1/products/[id]/route.ts` | PATCH endpoint accepts `vercel_url` |

## Vercel URL vs Live URL

- **`vercel_url`** — auto-generated deployment URL (e.g. `hello-world-website-rosy.vercel.app`). Set automatically when the product is created.
- **`live_url`** — custom domain when a product launches to real users (e.g. `coolproduct.com`). Set manually when a domain is purchased and connected.

Both fields coexist. The Vercel URL is the "where is this deployed" link; the live URL is the public-facing domain.
