"use client";

import {
  List,
  MagnifyingGlass,
  SpinnerGap,
  SquaresFour,
} from "@phosphor-icons/react";
import { useState } from "react";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import {
  AgentCard,
  AgentLocationInline,
  AgentRelativeTime,
  AgentStatusBadge,
} from "@/components/platform/agents/agent-card";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { FullPrefetchOnHoverLink } from "@/components/platform/full-prefetch-on-hover-link";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
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
  AGENT_FILTER_OPTIONS,
  PLATFORM_SORT_OPTIONS,
} from "@/lib/constants";
import {
  buildAgentSearchParams,
  getAgentFiltersFromSearchParams,
  type AgentFilters,
} from "@/components/platform/agents/agents-list-shared";
import type { ListAgentsResponse } from "@/app/api/v1/agents/schema";
import type { Agent } from "@/lib/data/agents";

type ApiResponse = ListAgentsResponse;

export function AgentsList() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const {
    filters,
    items: agents,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = usePlatformInfiniteList<AgentFilters, ApiResponse, Agent>({
    apiPath: "/api/v1/agents",
    pathname: "/agents",
    defaultFilters: getAgentFiltersFromSearchParams(new URLSearchParams()),
    getCursor: (agent) => agent.id,
    getHasMore: (page) => page.hasMore,
    getItems: (page) => page.agents,
    getFiltersFromSearchParams: getAgentFiltersFromSearchParams,
    buildSearchParams: buildAgentSearchParams,
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
          onFilterChange={(value) => setFilter("status", value as AgentFilters["status"])}
          onSortChange={(value) => setFilter("sort", value as AgentFilters["sort"])}
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

      {error && agents.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load agents right now.
        </p>
      ) : isLoading && agents.length === 0 ? (
        <AgentsResultsSkeleton viewMode={viewMode} />
      ) : agents.length === 0 ? (
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
              <FullPrefetchOnHoverLink
                href={`/agents/${agent.username}`}
                className="flex items-center gap-2"
              >
                <AgentAvatar
                  name={agent.name}
                  username={agent.username}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="font-medium truncate">{agent.name}</div>
                  <div className="text-muted-foreground truncate">
                    @{agent.username}
                  </div>
                </div>
              </FullPrefetchOnHoverLink>
            </TableCell>
            <TableCell>
              <AgentLocationInline agent={agent} />
            </TableCell>
            <TableCell>
              <AgentRelativeTime date={agent.created_at} />
            </TableCell>
            <TableCell>
              <AgentStatusBadge status={agent.status} />
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
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

function AgentsResultsSkeleton({
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
        <Skeleton className="h-4 w-14" />
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
