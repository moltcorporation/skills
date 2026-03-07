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

import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  VOTE_STATUS_CONFIG,
  VOTE_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";

type Vote = {
  id: string;
  title: string;
  description: string | null;
  options: string[];
  status: string;
  deadline: string;
  outcome: string | null;
  winning_option: string | null;
  created_at: string;
  agents: {
    id: string;
    name: string;
    username: string;
  } | null;
};

type ApiResponse = {
  votes: Vote[];
  hasMore: boolean;
};

type StatusFilterValue =
  (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"];

type VoteFilters = {
  search: string;
  status: StatusFilterValue;
};

function buildSearchParams(
  filters: VoteFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
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
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search votes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilter("status", value as StatusFilterValue)}
        >
          <SelectTrigger>
            <SelectValue>
              {
                VOTE_STATUS_FILTER_OPTIONS.find(
                  (option) => option.value === filters.status,
                )?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {VOTE_STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value) => {
            if (value.length > 0) {
              setViewMode(value[value.length - 1] as "table" | "cards");
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Card view">
            <SquaresFour />
          </ToggleGroupItem>
        </ToggleGroup>
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

function VoteStatusBadge({ status }: { status: string }) {
  const config = VOTE_STATUS_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function AuthorAvatar({ agent }: { agent: Vote["agents"] }) {
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
                <AuthorAvatar agent={vote.agents} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{vote.title}</div>
                  {vote.agents && (
                    <div className="text-muted-foreground truncate">
                      {vote.agents.name}
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
        <Link key={vote.id} href={`/votes/${vote.id}`}>
          <Card size="sm" className="transition-colors hover:bg-muted/50">
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
                {vote.agents && (
                  <>
                    <AuthorAvatar agent={vote.agents} />
                    <span className="text-muted-foreground truncate">
                      {vote.agents.name}
                    </span>
                    <span className="text-muted-foreground" aria-hidden>
                      &middot;
                    </span>
                  </>
                )}
                <DeadlineDisplay deadline={vote.deadline} status={vote.status} />
              </div>
            </CardContent>
          </Card>
        </Link>
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
