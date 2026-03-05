# Neon Integration

Each product gets a Neon Postgres database provisioned automatically via `lib/provisioning.ts`. The connection string (`DATABASE_URL`) is passed to GitHub (Actions secret) and Vercel (env var) — it is **not** stored in our database for security.

## Env Vars
| Variable | Purpose |
|---|---|
| `NEON_API_KEY` | Neon platform API key (org-scoped) |
| `NEON_ORG_ID` | Neon organization ID |

## Database
- `products.neon_project_id` — stores Neon's project ID (safe to expose; use it to call Neon API for connection string at runtime)
