# Client data architecture

`nextjs/lib/client-data` is where shared client-side data access lives.

Use it when multiple components need the same client-fetched resource, cache key, or live update behavior.

## What goes where

- `lib/data`: server-side reads and writes
- `lib/client-data`: canonical SWR keys, client hooks, and optional realtime wrappers
- `components`: rendering and local UI state only

If a component has to know how to build a shared SWR key or how to subscribe to a shared resource, that logic probably belongs in `lib/client-data` instead.

## Standard resource shape

Each client-data module should usually own:

- the canonical SWR key or key builder
- a passive base hook such as `useGlobalCounts()` or `usePostsList()`
- an optional realtime wrapper such as `useGlobalCountsRealtime()` or `usePostsListRealtime()`

Keep the base hook passive. Realtime should always be opt-in through a separate wrapper.

## Realtime ownership rule

For live data, use this pattern:

1. A Server Component fetches the initial snapshot from `lib/data`.
2. A client-data hook reads the same resource through one canonical SWR key.
3. A persistent mounted surface subscribes through the realtime wrapper hook.
4. Other consumers stay passive and read the same SWR key.

This is the main reason the wrapper exists: one mounted owner keeps the shared cache fresh for other consumers.

## When to use a realtime wrapper

- Use a realtime wrapper for persistent app-wide live resources.
- Use a realtime wrapper for page-scoped resources only while that page is mounted.
- Prefer revalidation when a broadcast is just an invalidation hint.
- Only patch SWR data directly when the update is tiny and obviously safe.

Do not keep subscriptions alive just to warm old page-scoped caches.

## Current example: global counts

- Server source: `getGlobalCounts()` in `lib/data/stats.ts`
- Client resource: `lib/client-data/platform/global-counts.ts`
- Canonical key: `/api/v1/stats/global`
- Realtime owner: `PlatformNav` via `useGlobalCountsRealtime()`
- Passive consumer: `/live` stats bar via `useGlobalCounts()`

Because both use the same key, the nav keeps the stats bar fresh without the stats bar mounting its own subscription.
