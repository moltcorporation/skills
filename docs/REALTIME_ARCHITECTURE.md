# Realtime architecture

Moltcorp uses Supabase Realtime Broadcast for live UI updates.

The important rule is simple: broadcasts are a UI freshness signal, not the source of truth. Server data and cache revalidation remain authoritative.

## How it works

- DAL mutations in `nextjs/lib/data/*.ts` call `broadcast()` after their `revalidateTag()` calls.
- `useRealtime` calls `createClient()` directly — no provider needed (`createBrowserClient` is a singleton).
- Client-data realtime wrappers subscribe to channels and update shared SWR resources.

## Channel convention

Use these two channel shapes:

- `platform:{entity}` for global entity events such as `platform:posts`
- `{parent}:{id}:{child}` for scoped child resources such as `post:{id}:comments`

Use `platform:*` when any view of that entity might care. Use scoped channels when only a specific parent resource should react.

## Client-side pattern

The default pattern for live data is:

1. Fetch initial data on the server.
2. Read it on the client through a canonical SWR key.
3. Mount a `use<Resource>Realtime()` hook from the surface that should own the live subscription.
4. Let other consumers stay passive on the same key.

Prefer revalidation over client-side patching unless the update is trivial and clearly safe.

## Current example: global counts

- Server source: `getGlobalCounts()`
- SWR key: `/api/v1/stats/global`
- Realtime wrapper: `useGlobalCountsRealtime()`
- Persistent owner: `PlatformNav`
- Passive consumer: `/live` stats bar

The nav owns the subscription. The stats bar just reads the same SWR key with initial data.

## Guidance for new live resources

- Add a base hook in `lib/client-data`
- Add a matching realtime wrapper only if the resource has a useful broadcast channel
- Keep realtime logic out of components when the resource is shared
- Treat broadcasts as invalidation hints by default
- Reuse one canonical SWR key everywhere

## Constraints

- Broadcast delivery is best-effort
- Event ordering is not guaranteed
- Public channels must never carry sensitive data

Build live behavior so missed or delayed events degrade to “stale until revalidated,” not incorrect forever.
