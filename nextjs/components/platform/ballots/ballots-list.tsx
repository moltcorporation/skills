"use client";

import {
  MagnifyingGlass,
  SpinnerGap,
  UserCircle,
} from "@phosphor-icons/react";
import { useMemo } from "react";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import {
  buildBallotsSearchParams,
  getBallotsFiltersFromSearchParams,
  type BallotsFilters,
} from "@/components/platform/ballots/ballots-list-shared";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { FullPrefetchOnHoverLink } from "@/components/platform/full-prefetch-on-hover-link";
import { RelativeTime } from "@/components/platform/relative-time";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLATFORM_SORT_OPTIONS } from "@/lib/constants";
import type { Ballot, GetBallotsResponse } from "@/lib/data/votes";

type ApiResponse = {
  ballots: Ballot[];
  hasMore: boolean;
};

function formatAsApiResponse(page: GetBallotsResponse): ApiResponse {
  return { ballots: page.data, hasMore: page.hasMore };
}

export function BallotsList({
  voteId,
  voteOptions,
  initialPage,
}: {
  voteId: string;
  voteOptions: string[];
  initialPage: GetBallotsResponse;
}) {
  const choiceFilterOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      ...voteOptions.map((option) => ({ value: option, label: option })),
    ],
    [voteOptions],
  );

  const {
    filters,
    items: ballots,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = usePlatformInfiniteList<BallotsFilters, ApiResponse, Ballot>({
    apiPath: "/api/v1/ballots",
    defaultFilters: { search: "", choice: "all", sort: "newest" },
    getCursor: (ballot) => ballot.id,
    getHasMore: (page) => page.hasMore,
    getItems: (page) => page.ballots,
    getFiltersFromSearchParams: getBallotsFiltersFromSearchParams,
    buildSearchParams: (activeFilters, options) => {
      const params = buildBallotsSearchParams(activeFilters, options);
      params.set("vote_id", voteId);
      return params;
    },
    initialPages: [formatAsApiResponse(initialPage)],
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search voters..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
        <PlatformFilterSortMenu
          filterValue={filters.choice}
          sortValue={filters.sort}
          filterOptions={choiceFilterOptions}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("choice", value)}
          onSortChange={(value) => setFilter("sort", value as BallotsFilters["sort"])}
        />
      </div>

      {error && ballots.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load ballots right now.
        </p>
      ) : isLoading && ballots.length === 0 ? (
        <BallotsListSkeleton />
      ) : ballots.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <UserCircle className="mx-auto mb-2 size-5 text-muted-foreground/50" />
          No ballots have been cast yet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {ballots.map((ballot) => (
            <BallotItem key={ballot.id} ballot={ballot} />
          ))}
        </div>
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

function BallotItem({ ballot }: { ballot: Ballot }) {
  const agentHref = `/agents/${ballot.agent_username}`;

  return (
    <div className="flex items-center gap-2.5 py-2.5">
      <AgentAvatar
        name={ballot.agent_username}
        username={ballot.agent_username}
        size="sm"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs">
          <FullPrefetchOnHoverLink
            href={agentHref}
            className="underline-offset-4 hover:underline"
          >
            {ballot.agent_username}
          </FullPrefetchOnHoverLink>
          <span className="text-muted-foreground" aria-hidden>
            &middot;
          </span>
          <RelativeTime
            date={ballot.created_at}
            className="text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          voted {ballot.choice}
        </p>
      </div>
    </div>
  );
}

function BallotsListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 py-2.5">
          <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { BallotsListSkeleton };
