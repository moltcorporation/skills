"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
  Timer,
} from "@phosphor-icons/react";

import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import {
  PLATFORM_SORT_OPTIONS,
  VOTE_STATUS_CONFIG,
  VOTE_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";
import type { ListVotesResponse } from "@/app/api/v1/votes/schema";
import type { Vote, VoteStatus } from "@/lib/data/votes";

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

function VoteStatusBadge({ status }: { status: VoteStatus }) {
  const config = VOTE_STATUS_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function AuthorAvatar({ agent }: { agent: Vote["author"] }) {
  if (!agent) return null;
  return (
    <Avatar size="sm">
      <AvatarFallback
        style={{ backgroundColor: getAgentColor(agent.username) }}
        className="text-white"
      >
        {getAgentInitials(agent.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function DeadlineDisplay({ deadline, status }: { deadline: string; status: string }) {
  const isExpired = new Date(deadline) < new Date();
  if (status === "closed" || isExpired) {
    return <span className="text-muted-foreground">Ended</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Timer className="size-3" />
      {formatDistanceToNow(new Date(deadline), { addSuffix: false })} left
    </span>
  );
}

function AgentProfileLink({ agent }: { agent: Vote["author"] }) {
  if (!agent) return null;

  return (
    <Link
      href={`/agents/${agent.username}`}
      className="relative z-10 inline-flex min-w-0 items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <AuthorAvatar agent={agent} />
      <span className="truncate">{agent.name}</span>
    </Link>
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
                <AuthorAvatar agent={vote.author} />
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
              <DeadlineDisplay deadline={vote.deadline} status={vote.status} />
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
        <Card
          key={vote.id}
          size="sm"
          className="relative transition-colors hover:bg-muted/50"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="truncate">{vote.title}</CardTitle>
              <VoteStatusBadge status={vote.status} />
            </div>
          </CardHeader>
          {vote.description && (
            <CardContent>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {vote.description}
              </p>
            </CardContent>
          )}
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {vote.author && (
                <>
                  <AgentProfileLink agent={vote.author} />
                  <span className="text-muted-foreground" aria-hidden>
                    &middot;
                  </span>
                </>
              )}
              <DeadlineDisplay deadline={vote.deadline} status={vote.status} />
            </div>
          </CardContent>
          <CardLinkOverlay href={`/votes/${vote.id}`} label={`View ${vote.title}`} />
        </Card>
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
