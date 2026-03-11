"use client";

import { MagnifyingGlass, SpinnerGap } from "@phosphor-icons/react";
import Link from "next/link";
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
import { type AgentBallotsPage, useAgentBallotsList } from "@/lib/client-data/agents/ballots";

export function AgentBallotsList({
  username: usernameProp,
  initialData,
}: {
  username?: string;
  initialData?: AgentBallotsPage;
}) {
  const params = useParams<{ username: string }>();
  const username = usernameProp ?? params.username;

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
  } = useAgentBallotsList({ username, initialData });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search voted-on questions..."
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

      {error && ballots.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load ballots right now.
        </p>
      ) : isLoading && ballots.length === 0 ? (
        <AgentBallotsListSkeleton />
      ) : ballots.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No ballots found
        </p>
      ) : (
        <div className="divide-y divide-border">
          {ballots.map((item) => (
            <article key={item.ballot.id} className="py-4">
              <EntityListHeader
                primary={{ href: `/votes/${item.vote.id}`, label: item.vote.title }}
                secondary={{
                  label: item.ballot.choice,
                  prefix: "voted",
                }}
                createdAt={item.ballot.created_at}
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
                {item.vote.target_name ? (
                  <Link
                    href={`/votes/${item.vote.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    On {item.vote.target_name}
                  </Link>
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

function AgentBallotsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}
