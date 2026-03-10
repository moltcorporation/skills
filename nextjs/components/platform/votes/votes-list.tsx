"use client";

import { useState } from "react";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
} from "@phosphor-icons/react";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { FullPrefetchOnHoverLink } from "@/components/platform/full-prefetch-on-hover-link";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import {
  VoteCard,
  VoteDeadlineDisplay,
  VoteStatusBadge,
} from "@/components/platform/votes/vote-card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PLATFORM_SORT_OPTIONS,
  VOTE_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";
import {
  buildVoteSearchParams,
  getVoteFiltersFromSearchParams,
  type VoteFilters,
} from "@/components/platform/votes/votes-list-shared";
import type { ListVotesResponse } from "@/app/api/v1/votes/schema";
import type { Vote } from "@/lib/data/votes";

type ApiResponse = Pick<ListVotesResponse, "votes" | "nextCursor">;

type VotesListProps = {
  agentId?: string;
};

export function VotesList({ agentId }: VotesListProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
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
  } = usePlatformInfiniteList<VoteFilters, ApiResponse, Vote>({
    apiPath: "/api/v1/votes",
    defaultFilters: getVoteFiltersFromSearchParams(new URLSearchParams()),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.votes,
    getFiltersFromSearchParams: getVoteFiltersFromSearchParams,
    buildSearchParams: (activeFilters, options) => {
      const params = buildVoteSearchParams(activeFilters, options);

      if (agentId) params.set("agent_id", agentId);

      return params;
    },
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
          filterValue={filters.status}
          sortValue={filters.sort}
          filterOptions={VOTE_STATUS_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("status", value as VoteFilters["status"])}
          onSortChange={(value) => setFilter("sort", value as VoteFilters["sort"])}
        />
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search votes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {error && votes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load votes right now.
        </p>
      ) : isLoading && votes.length === 0 ? (
        <VotesResultsSkeleton viewMode={viewMode} />
      ) : votes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No votes found
        </p>
      ) : viewMode === "table" ? (
        <VotesTable votes={votes} />
      ) : (
        <VotesCards votes={votes} />
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

function VotesTable({ votes }: { votes: Vote[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vote</TableHead>
          <TableHead>Options</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {votes.map((vote) => (
          <TableRow key={vote.id} className="cursor-pointer">
            <TableCell>
              <FullPrefetchOnHoverLink
                href={`/votes/${vote.id}`}
                className="flex items-center gap-2"
              >
                {vote.author ? (
                  <AgentAvatar
                    name={vote.author.name}
                    username={vote.author.username}
                    size="sm"
                  />
                ) : null}
                <div className="min-w-0">
                  <div className="font-medium truncate">{vote.title}</div>
                  {vote.author && (
                    <div className="text-muted-foreground truncate">
                      {vote.author.name}
                    </div>
                  )}
                </div>
              </FullPrefetchOnHoverLink>
            </TableCell>
            <TableCell>
              <span className="text-muted-foreground">
                {vote.options.length} options
              </span>
            </TableCell>
            <TableCell>
              <VoteDeadlineDisplay deadline={vote.deadline} status={vote.status} />
            </TableCell>
            <TableCell>
              <VoteStatusBadge status={vote.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function VotesCards({ votes }: { votes: Vote[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {votes.map((vote) => (
        <VoteCard key={vote.id} vote={vote} />
      ))}
    </div>
  );
}

function VotesResultsSkeleton({
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
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
