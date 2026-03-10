"use client";

import Link from "next/link";
import { useState } from "react";
import {
  List,
  MagnifyingGlass,
  SpinnerGap,
  SquaresFour,
} from "@phosphor-icons/react";

import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import {
  ForumListCard,
  ForumPostCount,
  ForumRelativeTime,
} from "@/components/platform/forums/forum-card";
import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FORUM_FILTER_OPTIONS,
  PLATFORM_SORT_OPTIONS,
} from "@/lib/constants";
import type { ListForumsResponse } from "@/app/api/v1/forums/schema";
import type { Forum } from "@/lib/data/forums";
import {
  buildForumSearchParams,
  getForumFiltersFromSearchParams,
  type ForumFilters,
} from "@/components/platform/forums/forums-list-shared";

type ApiResponse = Pick<ListForumsResponse, "forums" | "nextCursor">;

export function ForumsList() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const {
    filters,
    items: forums,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = usePlatformInfiniteList<ForumFilters, ApiResponse, Forum>({
    apiPath: "/api/v1/forums",
    defaultFilters: getForumFiltersFromSearchParams(new URLSearchParams()),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.forums,
    getFiltersFromSearchParams: getForumFiltersFromSearchParams,
    buildSearchParams: buildForumSearchParams,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value) => {
            if (value.length > 0) {
              setViewMode(value[value.length - 1] as "table" | "cards");
            }
          }}
          variant="outline"
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Card view">
            <SquaresFour />
          </ToggleGroupItem>
        </ToggleGroup>

        <PlatformFilterSortMenu
          filterValue={filters.type}
          sortValue={filters.sort}
          filterOptions={FORUM_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("type", value as ForumFilters["type"])}
          onSortChange={(value) => setFilter("sort", value as ForumFilters["sort"])}
        />

        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search forums..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {error && forums.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load forums right now.
        </p>
      ) : isLoading && forums.length === 0 ? (
        <ForumsResultsSkeleton viewMode={viewMode} />
      ) : forums.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No forums found
        </p>
      ) : viewMode === "table" ? (
        <ForumsTable forums={forums} />
      ) : (
        <ForumsCards forums={forums} />
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <SpinnerGap className="animate-spin" /> : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function ForumsTable({ forums }: { forums: Forum[] }) {
  return (
    <div className="overflow-hidden rounded-sm ring-1 ring-foreground/10">
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead>Forum</TableHead>
          <TableHead>Posts</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {forums.map((forum) => (
          <TableRow key={forum.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/forums/${forum.id}`}
                className="flex items-center gap-2"
              >
                <GeneratedAvatar name={forum.name} seed={forum.id} size="sm" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{forum.name}</div>
                  {forum.description ? (
                    <div className="text-muted-foreground truncate">
                      {forum.description}
                    </div>
                  ) : null}
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <ForumPostCount count={forum.post_count} />
            </TableCell>
            <TableCell>
              <ForumRelativeTime date={forum.created_at} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}

function ForumsCards({ forums }: { forums: Forum[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {forums.map((forum) => (
        <ForumListCard key={forum.id} forum={forum} />
      ))}
    </div>
  );
}

function ForumsResultsSkeleton({
  viewMode,
}: {
  viewMode: "table" | "cards";
}) {
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
