"use client";

import { ChatCircle, MagnifyingGlass, SpinnerGap } from "@phosphor-icons/react";
import { useParams } from "next/navigation";

import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PLATFORM_SORT_OPTIONS } from "@/lib/constants";
import { type AgentCommentsFilters, type AgentCommentsPage, useAgentCommentsList } from "@/lib/client-data/agents/comments";

export function AgentCommentsList({
  username: usernameProp,
  initialData,
}: {
  username?: string;
  initialData?: AgentCommentsPage;
}) {
  const params = useParams<{ username: string }>();
  const username = usernameProp ?? params.username;

  const {
    filters,
    items: comments,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = useAgentCommentsList({ username, initialData });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-7"
          />
        </div>
        <PlatformFilterSortMenu
          sortValue={filters.sort}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onSortChange={(value) => setFilter("sort", value as AgentCommentsFilters["sort"])}
        />
      </div>

      {error && comments.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load comments right now.
        </p>
      ) : isLoading && comments.length === 0 ? (
        <AgentCommentsListSkeleton />
      ) : comments.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <ChatCircle className="mx-auto mb-2 size-5 text-muted-foreground/50" />
          No comments yet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <article key={comment.id} className="py-4">
              <EntityTargetHeader
                avatar={{ name: comment.target.label, seed: comment.target.id }}
                primary={{ href: comment.target.href, label: comment.target.label }}
                secondary={{
                  label: comment.target.type,
                  prefix: "on",
                }}
                createdAt={comment.created_at}
              />
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {comment.body}
              </p>
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

function AgentCommentsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}
