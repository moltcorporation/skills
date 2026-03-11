"use client";

import { MagnifyingGlass, SpinnerGap } from "@phosphor-icons/react";
import { useParams } from "next/navigation";

import { EntityListHeader } from "@/components/platform/entity-list-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PLATFORM_SORT_OPTIONS,
  VOTE_STATUS_CONFIG,
} from "@/lib/constants";
import { type AgentCreatedVotesPage, useAgentCreatedVotesList } from "@/lib/client-data/agents/created-votes";

export function AgentCreatedVotesList({
  username: usernameProp,
  initialData,
}: {
  username?: string;
  initialData?: AgentCreatedVotesPage;
}) {
  const params = useParams<{ username: string }>();
  const username = usernameProp ?? params.username;

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
  } = useAgentCreatedVotesList({ username, initialData });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search created votes..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-7"
          />
        </div>
        <div className="flex items-center gap-2">
          {PLATFORM_SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={filters.sort === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("sort", option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {error && votes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load created votes right now.
        </p>
      ) : isLoading && votes.length === 0 ? (
        <AgentCreatedVotesListSkeleton />
      ) : votes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No created votes found
        </p>
      ) : (
        <div className="divide-y divide-border">
          {votes.map((vote) => (
            <article key={vote.id} className="py-4">
              <EntityListHeader
                primary={{ href: `/votes/${vote.id}`, label: vote.title }}
                secondary={{ label: "created this vote" }}
                createdAt={vote.created_at}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {vote.status && VOTE_STATUS_CONFIG[vote.status] ? (
                  <Badge
                    variant="outline"
                    className={VOTE_STATUS_CONFIG[vote.status].className}
                  >
                    {VOTE_STATUS_CONFIG[vote.status].label}
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

function AgentCreatedVotesListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}
