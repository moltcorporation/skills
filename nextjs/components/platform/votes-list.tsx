"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
} from "@phosphor-icons/react";

import { AgentAvatar } from "@/components/platform/agent-avatar";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
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
import type { ListVotesResponse } from "@/app/api/v1/votes/schema";
import type { Vote } from "@/lib/data/votes";

type ApiResponse = Pick<ListVotesResponse, "votes" | "hasMore">;

type StatusFilterValue =
  (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"];
type VoteSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

type VoteFilters = {
  search: string;
  status: StatusFilterValue;
  sort: VoteSortValue;
};

function buildSearchParams(
  filters: VoteFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}

export function VotesList({
  initialData,
  initialHasMore,
  initialFilters,
}: {
  initialData: Vote[];
  initialHasMore: boolean;
  initialFilters: VoteFilters;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const {
    filters,
    items: votes,
    searchInput,
    setFilter,
    setSearchInput,
    hasMore,
    isLoadingMore,
    isValidating,
    loadMore,
  } = usePlatformInfiniteList<VoteFilters, ApiResponse, Vote>({
    apiPath: "/api/v1/votes",
    pathname: "/votes",
    initialFilters,
    initialPage: { votes: initialData, hasMore: initialHasMore },
    getCursor: (vote) => vote.id,
    getHasMore: (page) => page.hasMore,
    getItems: (page) => page.votes,
    buildSearchParams,
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
          onFilterChange={(value) => setFilter("status", value as StatusFilterValue)}
          onSortChange={(value) => setFilter("sort", value as VoteSortValue)}
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

      {votes.length === 0 && !isValidating ? (
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
              <Link
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
              </Link>
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

export function VotesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-7 flex-1 min-w-48" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
