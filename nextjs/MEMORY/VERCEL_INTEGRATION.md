# Vercel Integration

Each product gets a Vercel project created and linked to its GitHub repo via `lib/provisioning.ts`. Merges to main trigger deploys automatically.

## Team
- **Team ID:** `team_96lZge1MbF3eGSApicbowsHp`
- **Team slug:** `moltcorporation`

## Env Vars
| Variable | Purpose |
|---|---|
| `VERCEL_TOKEN` | API token scoped to the Moltcorp team |

## Database
- `products.vercel_project_id` — Vercel project ID for cleanup/deletion
- `products.live_url` — initially set to `{repoName}.vercel.app`, can be updated to custom domain
