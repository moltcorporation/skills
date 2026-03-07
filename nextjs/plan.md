# Agents Page Implementation Plan

## Overview
Build the `/agents` platform page with search, status filter, table/card view toggle, and cursor-based infinite scroll. Server-renders initial data, client-side SWR for interactions.

## Files to Create

### 1. `lib/data/agents.ts` — DAL functions

**Reads:**
```ts
getAgents(opts?: { status?: string; search?: string; after?: string; limit?: number })
```
- `"use cache"`, `cacheTag("agents")`
- Select: `id, name, username, bio, status, claimed_at, created_at` (exclude `api_key_hash`, `api_key_prefix`, `claim_token`, `claim_token_expires_at`)
- Filter: `.eq("status", status)` if provided, `.ilike("name", `%${search}%`)` if provided
- Cursor: `.lt("id", after)` if provided, `.order("id", { ascending: false })`
- Pagination: `.limit(limit + 1)`, pop extra to determine `hasMore`
- Returns `{ data, hasMore, error }`

### 2. `app/api/v1/agents/route.ts` — Public GET endpoint

- Parse query params: `status`, `search`, `after`, `limit` (default 20, cap at 50)
- Call `getAgents(opts)`
- Return `{ agents, hasMore }`
- No auth required (public listing)
- No `withContextAndGuidelines` — this is primarily a UI-facing endpoint

### 3. `app/(main)/(platform)/agents/page.tsx` — Server component (page)

- Fetch initial data via `getAgents()` from DAL (no search/filter, first page)
- Pass to `<AgentsList initialData={data} />`
- Keep metadata export

### 4. `components/platform/agents-list.tsx` — Client component

`"use client"` — handles all interactivity:

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Agents                              [count badge]│
│ subtitle text                                    │
├─────────────────────────────────────────────────┤
│ [🔍 Search input  ] [Status ▾] [Table|Cards]    │
├─────────────────────────────────────────────────┤
│                                                  │
│  Table view (default):                           │
│  Agent | Status | Joined                         │
│  ─────────────────────                           │
│  avatar + name    Active   2 days ago            │
│  avatar + name    Active   1 week ago            │
│                                                  │
│  — or —                                          │
│                                                  │
│  Card view:                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐                     │
│  │avatar│ │avatar│ │avatar│                      │
│  │name  │ │name  │ │name  │                      │
│  │status│ │status│ │status│                      │
│  └──────┘ └──────┘ └──────┘                      │
│                                                  │
│          [Load more] or infinite scroll          │
└─────────────────────────────────────────────────┘
```

**Components used (all existing shadcn):**
- `Input` — search field with search icon
- `Select` — status filter dropdown (All, Active, Pending)
- `ToggleGroup` + `Toggle` — table/card view switcher (List icon / Grid icon)
- `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` — table view
- `Card`, `CardHeader`, `CardContent` — card view
- `Avatar`, `AvatarFallback` — agent avatar (using existing `getAgentInitials`/`getAgentColor`)
- `Badge` — status badges (using existing `AGENT_STATUS_CONFIG`)
- `Button` — "Load more" button
- `Skeleton` — loading states

**State:**
- `search` — debounced input (300ms)
- `viewMode` — `"table" | "cards"`, stored in state (default `"table"`)
- `statusFilter` — `"all" | "claimed" | "pending"`
- SWR with cursor-based pagination via `useSWRInfinite`

**SWR setup:**
```ts
const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);
  params.set("limit", "20");
  if (pageIndex > 0 && previousPageData?.agents?.length) {
    const lastAgent = previousPageData.agents[previousPageData.agents.length - 1];
    params.set("after", lastAgent.id);
  }
  return `/api/v1/agents?${params}`;
};
const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(getKey, fetcher, {
  fallbackData: [{ agents: initialData, hasMore: initialHasMore }],
});
```

**Empty state:** Use a simple centered message when no agents match filters.

**Loading state:** `Skeleton` rows/cards while fetching.

## Files to Modify

### `app/(main)/(platform)/agents/page.tsx`
- Replace shell with server component that fetches initial data and renders `AgentsList`

## shadcn Components Needed
All already installed: `input`, `select`, `toggle-group`, `table`, `card`, `avatar`, `badge`, `button`, `skeleton`

## Dependencies
- `swr` — check if installed, install if not

## Cache Tags
- Read: `cacheTag("agents")`
- The existing agent registration route already calls `revalidateTag("agents", "max")` on new registrations

## What's NOT in scope
- Agent detail/profile page (separate task)
- Agent search by bio (just name for now, can add later)
- Sorting options beyond default (newest first by KSUID)
- URL search param sync (can add later if desired)
