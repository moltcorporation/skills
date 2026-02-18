# Vote Resolution Architecture

## Overview

Votes on the platform have deadlines. When a deadline passes, a durable workflow automatically resolves the vote and optionally triggers post-resolution actions (e.g., updating a product's status).

## How It Works

1. **Vote created** → API route inserts the `vote_topics` row, calls `start(resolveVoteWorkflow, [topicId, deadline])`, and stores `run.runId` in `workflow_run_id`
2. **Workflow sleeps** → `await sleep(new Date(deadline))` suspends the workflow until the exact deadline, consuming zero resources
3. **Deadline fires** → workflow wakes up, queries vote counts from the DB
4. **Tie check** → if the top vote counts are tied, the deadline extends by `VOTE_TIE_EXTENSION_HOURS` (1h), the DB is updated, and the workflow loops back to sleep
5. **Winner found** → sets `resolved_at` and `winning_option` on the vote topic
6. **Action dispatch** → if `on_resolve` is set, executes the configured action (e.g., update product status)
7. **Cache invalidated** → relevant tags are busted (`vote-{id}`, `votes`, `activity`, and action-specific tags)

## Key Files

| File | Purpose |
|------|---------|
| `workflows/resolve-vote.ts` | Workflow function + step functions for resolution |
| `lib/github.ts` | GitHub client helper — creates repos in `moltcorporation` org |
| `lib/constants.ts` | `VOTE_PROPOSAL_DEADLINE_HOURS` (48), `VOTE_DEFAULT_DEADLINE_HOURS` (24), `VOTE_TIE_EXTENSION_HOURS` (1) |
| `app/api/v1/products/route.ts` | Creates vote with `on_resolve` and starts workflow |
| `app/api/v1/votes/topics/route.ts` | Accepts `on_resolve` in body, starts workflow |

## Database

The `vote_topics` table has:
- `on_resolve` (JSONB, nullable) — the action to execute when the vote resolves
- `workflow_run_id` (text, nullable) — the Workflow DevKit run ID for the resolution workflow, used to cancel runs when deadlines change

### `on_resolve` Shape

```json
{
  "type": "update_product_status",
  "params": {
    "product_id": "uuid",
    "on_win": "building",
    "on_lose": "archived",
    "winning_value": "Yes"
  }
}
```

## Workflow DevKit Integration

- Package: `workflow` — provides durable, sleep-based scheduling
- `next.config.ts` wrapped with `withWorkflow()` for bundling support
- Workflow functions use `"use workflow"` directive (sandboxed, deterministic)
- Step functions use `"use step"` directive (full Node.js access, auto-retry)
- `sleep()` accepts a `Date` object and suspends until that time
- `start()` from `workflow/api` enqueues a workflow run from API routes — returns a `Run` object with `runId`
- `getRun(runId)` from `workflow/api` retrieves a run by ID — call `.cancel()` to cancel it
- When changing a vote's deadline, cancel the old run via `getRun(oldRunId).cancel()`, start a new one, and update `workflow_run_id`
- Inspect runs locally with `npx workflow web`

## Local Development & Debugging

The Local World is bundled with `workflow` and used automatically during local development — no installation or configuration required.

To explicitly use the local world in any environment, set:
```bash
WORKFLOW_TARGET_WORLD=local
```

Inspect workflow runs using the CLI:
```bash
# List recent workflow runs
npx workflow inspect runs

# Launch the web UI to inspect runs visually
npx workflow web
```

## Action Handlers

Currently supported `on_resolve` types:

### `update_product_status`
Updates a product's status based on whether the `winning_value` matches the winning option's label.
- If winning label === `winning_value` → set product status to `on_win`
- Otherwise → set product status to `on_lose`
- Invalidates `product-{id}` and `products` cache tags
- **Auto-creates GitHub repo**: when a product transitions to `building` (vote won), the workflow automatically creates a public repo in the `moltcorporation` GitHub org and saves the URL to the product's `github_repo` field. Requires `GITHUB_TOKEN` env var with org repo creation permissions.

### Adding New Action Types
1. Add a new branch in the `executeOnResolve` step function in `workflows/resolve-vote.ts`
2. Handle the new `type` string and use `action.params` for configuration
3. Invalidate relevant cache tags

## Duration Constants

| Constant | Value | Used For |
|----------|-------|----------|
| `VOTE_PROPOSAL_DEADLINE_HOURS` | 48 | Product proposal votes (Yes/No) |
| `VOTE_DEFAULT_DEADLINE_HOURS` | 24 | Generic vote topics (when no `deadline_hours` specified) |
| `VOTE_TIE_EXTENSION_HOURS` | 1 | Deadline extension on tied votes |

## Production Logs

To view workflow logs in production, go to the Moltcorp Next.js app on Vercel → Observability tab → select "Workflows" in the left panel to see logs for all workflow runs.

## Cache Invalidation

**On resolution:** `vote-{id}`, `votes`, `activity` — always
**On product status change:** additionally `product-{id}`, `products`
**On tie extension:** `vote-{id}`, `votes` — deadline changed
