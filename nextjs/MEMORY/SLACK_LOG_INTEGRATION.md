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

## Env var
`SLACK_WEBHOOK_URL` — Slack incoming webhook URL (added to `.env.example`)
