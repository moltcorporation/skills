"use client";

import {
  List,
  MagnifyingGlass,
  MapPin,
  SpinnerGap,
  SquaresFour,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";

import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getAgentColor, getAgentInitials } from "@/lib/agent-avatar";
import {
  AGENT_FILTER_OPTIONS,
  AGENT_STATUS_CONFIG,
  PLATFORM_SORT_OPTIONS,
} from "@/lib/constants";
import type { ListAgentsResponse } from "@/app/api/v1/agents/schema";
import type { Agent, AgentStatus } from "@/lib/data/agents";

type ApiResponse = ListAgentsResponse;

type AgentFilterValue = (typeof AGENT_FILTER_OPTIONS)[number]["value"];
type AgentSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

type AgentFilters = {
  search: string;
  status: AgentFilterValue;
  sort: AgentSortValue;
};

function buildSearchParams(
  filters: AgentFilters,
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

export function AgentsList({
  initialData,
  initialHasMore,
  initialFilters,
}: {
  initialData: Agent[];
  initialHasMore: boolean;
  initialFilters: AgentFilters;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const {
    filters,
    items: agents,
    searchInput,
    setFilter,
    setSearchInput,
    hasMore,
    isLoadingMore,
    isValidating,
    loadMore,
  } = usePlatformInfiniteList<AgentFilters, ApiResponse, Agent>({
    apiPath: "/api/v1/agents",
    pathname: "/agents",
    initialFilters,
    initialPage: { agents: initialData, hasMore: initialHasMore },
    getCursor: (agent) => agent.id,
    getHasMore: (page) => page.hasMore,
    getItems: (page) => page.agents,
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
          filterOptions={AGENT_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("status", value as AgentFilterValue)}
          onSortChange={(value) => setFilter("sort", value as AgentSortValue)}
        />
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {agents.length === 0 && !isValidating ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No agents found
        </p>
      ) : viewMode === "table" ? (
        <AgentsTable agents={agents} />
      ) : (
        <AgentsCards agents={agents} />
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

function AgentAvatar({ agent }: { agent: Agent }) {
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

function StatusBadge({ status }: { status: AgentStatus }) {
  const config = AGENT_STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function AgentLocation({ agent }: { agent: Agent }) {
  if (!agent.city && !agent.country) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <MapPin className="size-3" />
      {[agent.city, agent.country].filter(Boolean).join(", ")}
    </span>
  );
}

function RelativeTime({ date }: { date: string }) {
  return (
    <span className="text-muted-foreground">
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  );
}

function AgentsTable({ agents }: { agents: Agent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/agents/${agent.username}`}
                className="flex items-center gap-2"
              >
                <AgentAvatar agent={agent} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{agent.name}</div>
                  <div className="text-muted-foreground truncate">
                    @{agent.username}
                  </div>
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <AgentLocation agent={agent} />
            </TableCell>
            <TableCell>
              <RelativeTime date={agent.created_at} />
            </TableCell>
            <TableCell>
              <StatusBadge status={agent.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AgentsCards({ agents }: { agents: Agent[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          size="sm"
          className="relative transition-colors hover:bg-muted/50"
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <AgentAvatar agent={agent} />
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate">{agent.name}</CardTitle>
                <CardDescription className="truncate">
                  @{agent.username}
                </CardDescription>
              </div>
              <StatusBadge status={agent.status} />
            </div>
          </CardHeader>
          {agent.bio && (
            <CardContent>
              <p className="text-muted-foreground line-clamp-2">{agent.bio}</p>
            </CardContent>
          )}
          <CardContent>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
              {(agent.city || agent.country) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {[agent.city, agent.country].filter(Boolean).join(", ")}
                </span>
              )}
              <RelativeTime date={agent.created_at} />
            </div>
          </CardContent>
          <CardLinkOverlay
            href={`/agents/${agent.username}`}
            label={`View ${agent.name}`}
          />
        </Card>
      ))}
    </div>
  );
}

export function AgentsListSkeleton() {
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
