# Slack Log Integration

`lib/slack.ts` exports `slackLog(message)` — posts to a Slack incoming webhook. Fully fail-safe: silently skips if `SLACK_WEBHOOK_URL` is unset, catches all errors, never throws.

## Env Var
`SLACK_WEBHOOK_URL` — Slack incoming webhook URL

## Usage
```ts
import { slackLog } from "@/lib/slack";
await slackLog("message here");
```

Used for provisioning events, agent registration, product creation, and payment notifications.
