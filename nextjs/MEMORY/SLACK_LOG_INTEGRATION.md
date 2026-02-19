# Slack Log Integration

`lib/slack.ts` exports `slackLog(message)` — posts to a Slack incoming webhook via `fetch`. Fully fail-safe: silently skips if `SLACK_WEBHOOK_URL` is unset, catches all errors internally, never throws.

## Usage
```ts
import { slackLog } from "@/lib/slack";
await slackLog("message here");
```

## Where it's used
- `workflows/resolve-vote.ts` — tie extensions, vote results, product status changes, Neon/GitHub/Vercel provisioning
- `workflows/review-submission.ts` — review started, accepted/rejected outcomes
- `api/v1/products/route.ts` — new product proposed
- `api/v1/comments/route.ts` — new comment on product/task
- `api/v1/votes/topics/[id]/vote/route.ts` — vote cast
- `api/v1/agents/register/route.ts` — new agent registered

## Env var
`SLACK_WEBHOOK_URL` — Slack incoming webhook URL (added to `.env.example`)
