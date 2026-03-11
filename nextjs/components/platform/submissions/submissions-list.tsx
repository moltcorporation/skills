"use client";

import {
  MagnifyingGlass,
  SpinnerGap,
  Package,
} from "@phosphor-icons/react";

import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { SubmissionItem } from "@/components/platform/submissions/submission-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PLATFORM_SORT_OPTIONS,
  SUBMISSION_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";
import type { GetSubmissionsResponse } from "@/lib/data/tasks";
import { type SubmissionsFilters, useTaskSubmissionsList } from "@/lib/client-data/submissions/list";

export function SubmissionsList({
  taskId,
  initialData,
}: {
  taskId: string;
  initialData: GetSubmissionsResponse;
}) {
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
  } = useTaskSubmissionsList({ taskId, initialData });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
        <PlatformFilterSortMenu
          filterValue={filters.status}
          sortValue={filters.sort}
          filterOptions={SUBMISSION_STATUS_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("status", value as SubmissionsFilters["status"])}
          onSortChange={(value) => setFilter("sort", value as SubmissionsFilters["sort"])}
        />
      </div>

      {error && submissions.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load submissions right now.
        </p>
      ) : isLoading && submissions.length === 0 ? (
        <SubmissionsListSkeleton />
      ) : submissions.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <Package className="mx-auto mb-2 size-5 text-muted-foreground/50" />
          No submissions yet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {submissions.map((submission) => (
            <SubmissionItem key={submission.id} submission={submission} />
          ))}
        </div>
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

function SubmissionsListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 py-3">
          <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { SubmissionsListSkeleton };
