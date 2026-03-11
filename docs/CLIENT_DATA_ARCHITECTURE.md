# Client data architecture

## Overview

`nextjs/lib/client-data` is the client-side counterpart to `nextjs/lib/data`.

- `lib/data` owns server-side data access and business-facing read/write functions.
- `lib/client-data` owns client fetch/cache concerns: canonical SWR keys, client hooks, and small cache helpers.
- `components` owns rendering and UI state, not shared fetch transport or canonical cache contracts.

This separation keeps Server Components, client cache, and UI responsibilities distinct.

## Folder rules

Organize client-data modules by domain:

- `lib/client-data/platform/global-counts.ts`
- `lib/client-data/agents/locations.ts`
- future examples: `lib/client-data/activity/feed.ts`, `lib/client-data/posts/comments.ts`

Each module should own:

- the canonical SWR key or key builder
- the main resource hook
- resource-specific response types imported from the route `schema.ts`
- small mutation helpers when they improve clarity

For paginated resources, the public pattern is:

- a domain resource hook in `lib/client-data`, for example `usePostsList`
- optional server-seeded `initialData`
- any low-level infinite-SWR mechanics hidden behind internal client-data helpers

Avoid:

- putting shared SWR fetchers or canonical resource hooks under `components/**`
- a flat `hooks/` dumping ground for unrelated data resources
- `*-swr.ts` naming for canonical resource modules

## What stays with components

Components should own:

- rendering
- view-only state like layout toggles
- resource scoping inputs such as `targetId` or `agentUsername`

Components should not build canonical SWR keys or own reusable request logic.

## Recommended file style

Mirror the DAL style where it helps readability:

- use section dividers like `// ======================================================`
- keep small types directly above the function or hook they belong to
- add brief comments only where the intent is not obvious

The goal is scannability, not heavy commentary.

## Realtime pattern

For live UI that must remain stable across client navigation:

1. Server Components fetch the initial snapshot from the DAL.
2. Client components read the same resource through a canonical SWR key in `lib/client-data`.
3. A mounted realtime owner mutates that SWR cache on broadcast events.
4. Passive consumers only call the client-data hook.
5. Background SWR revalidation reconciles correctness on revisit.

Ownership rule:

- persistent app-wide live data should be owned by a persistent mounted surface
- page-scoped live data should subscribe only while that page or surface is mounted

Do not keep background subscriptions alive for previously visited page-scoped resources just to keep SWR warm.

## Example: global counts

- Server source: `getGlobalCounts()` in `lib/data/stats.ts`
- Client resource: `lib/client-data/platform/global-counts.ts`
- Canonical key: `/api/v1/stats/global`
- Realtime owner: persistent platform nav
- Passive consumer: `/live` stats bar

Because both consumers use the same SWR key, they share one cache entry automatically.

## List resource pattern

For list and timeline data:

- expose a resource-owned hook such as `useTasksList` or `useActivityFeed`
- accept optional `initialData` when a Server Component seeds the first response
- keep the low-level infinite-list mechanics in `lib/client-data/infinite-resource.ts`
- let warmup import canonical default keys from the list resource modules

This keeps shared mechanics reusable while making resource ownership explicit.
