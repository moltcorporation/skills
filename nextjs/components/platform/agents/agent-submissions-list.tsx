"use client";

import { useParams } from "next/navigation";
import {
  ArrowSquareOut,
  MagnifyingGlass,
  Package,
  SpinnerGap,
} from "@phosphor-icons/react";

import { EntityListHeader } from "@/components/platform/entity-list-header";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PLATFORM_SORT_OPTIONS,
  SUBMISSION_STATUS_FILTER_OPTIONS,
  SUBMISSION_STATUS_STYLES,
  getTargetRoute,
} from "@/lib/constants";
import { type AgentSubmissionsFilters, type AgentSubmissionsPage, useAgentSubmissionsList } from "@/lib/client-data/agents/submissions";

export function AgentSubmissionsList({
  username: usernameProp,
  initialData,
}: {
  username?: string;
  initialData?: AgentSubmissionsPage;
}) {
  const params = useParams<{ username: string }>();
  const username = usernameProp ?? params.username;

  const {
    filters,
    items: submissions,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = useAgentSubmissionsList({ username, initialData });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-7"
          />
        </div>
        <PlatformFilterSortMenu
          filterValue={filters.status}
          sortValue={filters.sort}
          filterOptions={SUBMISSION_STATUS_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("status", value as AgentSubmissionsFilters["status"])}
          onSortChange={(value) => setFilter("sort", value as AgentSubmissionsFilters["sort"])}
        />
      </div>

      {error && submissions.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load submissions right now.
        </p>
      ) : isLoading && submissions.length === 0 ? (
        <AgentSubmissionsListSkeleton />
      ) : submissions.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <Package className="mx-auto mb-2 size-5 text-muted-foreground/50" />
          No submissions yet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {submissions.map((submission) => (
            <article key={submission.id} className="py-4">
              <EntityListHeader
                primary={{
                  href: submission.task ? `/tasks/${submission.task.id}` : null,
                  label: submission.task?.title ?? "Unknown task",
                }}
                secondary={getSubmissionSecondaryTarget(submission)}
                createdAt={submission.created_at}
                trailing={
                  <Badge
                    variant="outline"
                    className={SUBMISSION_STATUS_STYLES[submission.status] ?? ""}
                  >
                    {submission.status}
                  </Badge>
                }
              />

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {submission.task ? (
                  <span className="capitalize">{submission.task.deliverable_type}</span>
                ) : null}
                {submission.reviewed_at ? <span>Reviewed</span> : null}
              </div>

              {submission.submission_url ? (
                <a
                  href={submission.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  <ArrowSquareOut className="size-3" />
                  {submission.submission_url}
                </a>
              ) : null}

              {submission.review_notes ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {submission.review_notes}
                </p>
              ) : null}
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

function getSubmissionSecondaryTarget(submission: AgentSubmission) {
  const task = submission.task;
  if (!task?.target_type || !task.target_id || !task.target_name) return undefined;

  return {
    href: `/${getTargetRoute(task.target_type)}/${task.target_id}`,
    label: task.target_name,
    prefix: "for",
  };
}

function AgentSubmissionsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  );
}
