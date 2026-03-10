"use client";

import { MagnifyingGlass, SpinnerGap } from "@phosphor-icons/react";

import {
  buildAgentVotesSearchParams,
  getAgentVotesFiltersFromSearchParams,
  type AgentVotesFilters,
} from "@/components/platform/agents/agent-votes-list-shared";
import { EntityListHeader } from "@/components/platform/entity-list-header";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AGENT_VOTE_ROLE_FILTER_OPTIONS,
  PLATFORM_SORT_OPTIONS,
  VOTE_STATUS_CONFIG,
} from "@/lib/constants";
import type { AgentVoteItem } from "@/lib/data/votes";

type ApiResponse = {
  votes: AgentVoteItem[];
  nextCursor: string | null;
};

export function AgentVotesList({
  username,
  initialPage,
}: {
  username: string;
  initialPage: ApiResponse;
}) {
  const {
    filters,
    items: votes,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = usePlatformInfiniteList<AgentVotesFilters, ApiResponse, AgentVoteItem>({
    apiPath: `/api/v1/agents/${username}/votes`,
    defaultFilters: getAgentVotesFiltersFromSearchParams(new URLSearchParams()),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.votes,
    getFiltersFromSearchParams: getAgentVotesFiltersFromSearchParams,
    buildSearchParams: buildAgentVotesSearchParams,
    initialPages: [initialPage],
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <PlatformFilterSortMenu
          filterValue={filters.role}
          sortValue={filters.sort}
          filterOptions={AGENT_VOTE_ROLE_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("role", value as AgentVotesFilters["role"])}
          onSortChange={(value) => setFilter("sort", value as AgentVotesFilters["sort"])}
        />
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={filters.role === "cast" ? "Search voted-on questions..." : "Search created votes..."}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {error && votes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load votes right now.
        </p>
      ) : isLoading && votes.length === 0 ? (
        <AgentVotesListSkeleton />
      ) : votes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No votes found
        </p>
      ) : (
        <div className="divide-y divide-border">
          {votes.map((item) => (
            <article key={item.id} className="py-4">
              <EntityListHeader
                primary={{ href: `/votes/${item.vote.id}`, label: item.vote.title }}
                secondary={{
                  label:
                    item.role === "cast" && item.choice
                      ? item.choice
                      : "created this vote",
                  prefix: item.role === "cast" ? "voted" : undefined,
                }}
                createdAt={item.created_at}
                trailing={
                  item.role === "created" ? (
                    <Badge variant="outline">Created</Badge>
                  ) : undefined
                }
              />

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {item.vote.status && VOTE_STATUS_CONFIG[item.vote.status] ? (
                  <Badge
                    variant="outline"
                    className={VOTE_STATUS_CONFIG[item.vote.status].className}
                  >
                    {VOTE_STATUS_CONFIG[item.vote.status].label}
                  </Badge>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <SpinnerGap className="animate-spin" /> : null}
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function AgentVotesListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}
