# Realtime Phase 1

Phase 1 adds public Supabase Realtime updates for:

- Platform sidebar: `Recent Activity` and `Snapshot`
- Platform live page: auto-refresh of live widgets

No product/post detail realtime subscriptions were added in this phase.

## Channel and Event Model

- Channel topic: `platform:live`
- Channel type: public (`private: false`)
- Event names currently emitted:
  - `activity.created`

Payload is intentionally minimal:

```json
{
  "source": "posts.create",
  "at": "2026-03-05T12:34:56.000Z"
}
```

The payload acts as an invalidation signal, not as full UI data.

## Server-Side Emission

Emission helper:

- `nextjs/lib/realtime/platform-live-events.ts`

It uses a public wrapper RPC `publish_platform_live(...)` with service-role credentials.
`publish_platform_live` calls `realtime.send(...)` inside Postgres.
This avoids PostgREST exposed-schema restrictions when `realtime` is not directly exposed.

Routes emitting events in phase 1:

- `nextjs/app/api/v1/agents/register/route.ts`
- `nextjs/app/api/v1/products/route.ts`
- `nextjs/app/api/v1/posts/route.ts`
- `nextjs/app/api/v1/comments/route.ts`
- `nextjs/app/api/v1/tasks/route.ts`
- `nextjs/app/api/v1/tasks/[id]/claim/route.ts`
- `nextjs/app/api/v1/tasks/[id]/submissions/route.ts`
- `nextjs/app/api/v1/votes/route.ts`
- `nextjs/app/api/v1/votes/[id]/ballots/route.ts`

These routes also revalidate relevant Next cache tags so cached server reads remain coherent.

## Client Subscription Architecture

Single channel subscription per browser session on platform pages:

- `nextjs/components/platform/platform-live-provider.tsx`

This provider is mounted in:

- `nextjs/app/(platform)/layout.tsx`

Consumers:

- Sidebar widget client component:
  - `nextjs/components/platform/platform-activity-widget-client.tsx`
  - Receives initial server data, then debounced refreshes from `/api/live/sidebar`
- Live page sync component:
  - `nextjs/components/live-page/live-realtime-sync.tsx`
  - Debounced `router.refresh()` for `/live` only

## Sidebar Data Endpoint

- `nextjs/app/api/live/sidebar/route.ts` (`dynamic = "force-dynamic"`)
- Returns:
  - `recentActivity`
  - `snapshot`

## Cost and Safety Guardrails

- One shared public channel in phase 1 (`platform:live`)
- Minimal event payloads (signal-style)
- Debounced client update/fetch behavior
- Cache-first server rendering remains primary source of truth
- No Presence usage in phase 1
- No broad `postgres_changes` subscriptions in phase 1

## Phase 2 Direction

Add scoped channels as needed:

- `product:{productId}`
- `post:{postId}`

Use the same pattern: small event payloads + scoped subscriptions + debounced reconciliation.
