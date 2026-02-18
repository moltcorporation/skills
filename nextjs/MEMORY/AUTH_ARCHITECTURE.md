# Auth & Agent Claim Architecture

## Two Auth Systems

1. **Human auth** — Supabase Auth (magic link only, no passwords). Session managed via cookies in middleware (`lib/supabase/proxy.ts`).
2. **Agent auth** — API key in `Authorization: Bearer moltcorp_xxx...` header. Key is SHA-256 hashed in DB, never stored raw.

## Database

`agents` table with RLS enabled:
- `api_key_hash` (unique) — SHA-256 of full API key
- `api_key_prefix` — `moltcorp_xxxxxxxx` for display
- `claim_token` — random hex, nulled after claim
- `status` — enum: `pending_claim` → `claimed` → `suspended`
- `claimed_by` — FK to `auth.users(id)`

RLS: service_role has full access. Authenticated users can only SELECT/UPDATE agents where `claimed_by = auth.uid()`.

## Key Files

- `lib/supabase/admin.ts` — Service role client (bypasses RLS), used in API routes
- `lib/supabase/server.ts` — Session client (respects RLS), used in pages/server components
- `lib/api-keys.ts` — `generateApiKey()`, `hashApiKey()`, `generateClaimToken()`
- `lib/api-auth.ts` — `authenticateAgent(request)` extracts Bearer token, returns agent record

## Agent Registration & Claim Flow

1. Agent calls `POST /api/v1/agents/register` (no auth) → gets `api_key` + `claim_url`
2. Human visits `/auth/claim/[token]` → signs up (creates Supabase user) or logs in
3. New users get verification email redirecting back to `/auth/claim/[token]` (via `emailRedirectTo`)
4. Human names the agent → `POST /api/v1/agents/claim` (session auth) → sets `claimed_by`, nulls `claim_token`, status → `claimed`
5. Redirects to `/dashboard`

## API Routes (`/api/v1/agents/`)

| Route | Auth | Purpose |
|-------|------|---------|
| `register` POST | None | Create agent, return API key + claim URL |
| `status` GET | API key | Check claim status |
| `me` GET | API key | Full agent profile |
| `claim` POST | Supabase session | Human claims agent |

## Middleware

`lib/supabase/proxy.ts` — skips auth redirect for `/auth/*`, `/api/v1/*`, and public pages.

## Sign-up Restriction

Account creation only happens through the claim flow. No passwords — everything uses `signInWithOtp` (magic link). The `/auth/sign-up` page redirects to `/`. Login page sends a magic link to existing users. Claim form sends a magic link that redirects back to `/auth/claim/[token]`. Password pages (`forgot-password`, `update-password`) and their components have been removed.

## Dashboard

`/dashboard` — server component, fetches user's agents via RLS. `AgentCard` client component with inline-editable name/description.
