"use client";

import Link from "next/link";
import {
  List,
  MagnifyingGlass,
  SpinnerGap,
  SquaresFour,
} from "@phosphor-icons/react";
import { useState } from "react";

import {
  buildAgentTasksSearchParams,
  getAgentTasksFiltersFromSearchParams,
  type AgentTasksFilters,
} from "@/components/platform/agents/agent-tasks-list-shared";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { RelativeTime } from "@/components/platform/relative-time";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Badge } from "@/components/ui/badge";
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
  AGENT_TASK_ROLE_FILTER_OPTIONS,
  PLATFORM_SORT_OPTIONS,
  SUBMISSION_STATUS_STYLES,
  TASK_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";
import type { AgentTask } from "@/lib/data/tasks";
import { TaskStatusBadge } from "@/components/platform/tasks/task-card";

type ApiResponse = {
  tasks: AgentTask[];
  nextCursor: string | null;
};

export function AgentTasksList({
  username,
  initialPage,
}: {
  username: string;
  initialPage: ApiResponse;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const {
    filters,
    items: tasks,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = usePlatformInfiniteList<AgentTasksFilters, ApiResponse, AgentTask>({
    apiPath: `/api/v1/agents/${username}/tasks`,
    defaultFilters: getAgentTasksFiltersFromSearchParams(new URLSearchParams()),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.tasks,
    getFiltersFromSearchParams: getAgentTasksFiltersFromSearchParams,
    buildSearchParams: buildAgentTasksSearchParams,
    initialPages: [initialPage],
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value) => {
            if (value.length > 0) setViewMode(value[value.length - 1] as "table" | "cards");
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
          filterValue={filters.role}
          sortValue={filters.sort}
          filterOptions={AGENT_TASK_ROLE_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("role", value as AgentTasksFilters["role"])}
          onSortChange={(value) => setFilter("sort", value as AgentTasksFilters["sort"])}
        />
        <ToggleGroup
          value={[filters.status]}
          onValueChange={(value) => {
            if (value.length > 0) {
              setFilter("status", value[value.length - 1] as AgentTasksFilters["status"]);
            }
          }}
          variant="outline"
        >
          {TASK_STATUS_FILTER_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {error && tasks.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load tasks right now.
        </p>
      ) : isLoading && tasks.length === 0 ? (
        <AgentTasksListSkeleton viewMode={viewMode} />
      ) : tasks.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No tasks found
        </p>
      ) : viewMode === "table" ? (
        <AgentTasksTable tasks={tasks} />
      ) : (
        <AgentTasksCards tasks={tasks} />
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

function AgentTasksTable({ tasks }: { tasks: AgentTask[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Latest event</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={`${task.role}-${task.id}`}>
            <TableCell>
              <div className="min-w-0 space-y-1">
                <div className="font-medium">{task.title}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {task.target_type === "product" && task.target_id && task.target_name ? (
                    <Link href={`/products/${task.target_id}`}>
                      {task.target_name}
                    </Link>
                  ) : (
                    <span>{task.target_name ?? "Platform task"}</span>
                  )}
                  {task.latest_submission ? (
                    <SubmissionStatusBadge status={task.latest_submission.status} />
                  ) : null}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <RoleBadge role={task.role} />
            </TableCell>
            <TableCell>
              <TaskStatusBadge status={task.status} />
            </TableCell>
            <TableCell>
              <RelativeTime date={task.agent_event_at} className="text-muted-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AgentTasksCards({ tasks }: { tasks: AgentTask[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {tasks.map((task) => (
        <article
          key={`${task.role}-${task.id}`}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">{task.title}</h3>
            <RoleBadge role={task.role} />
            <TaskStatusBadge status={task.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {task.target_type === "product" && task.target_id && task.target_name ? (
              <Link
                href={`/products/${task.target_id}`}
                className="underline-offset-4 hover:underline"
              >
                {task.target_name}
              </Link>
            ) : (
              <span>{task.target_name ?? "Platform task"}</span>
            )}
            <span aria-hidden>&middot;</span>
            <RelativeTime date={task.agent_event_at} />
          </div>
          {task.latest_submission ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <SubmissionStatusBadge status={task.latest_submission.status} />
              {task.latest_submission.submission_url ? (
                <a
                  href={task.latest_submission.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Submission
                </a>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function RoleBadge({ role }: { role: AgentTask["role"] }) {
  return (
    <Badge variant="outline">
      {role === "created" ? "Created" : "Claimed"}
    </Badge>
  );
}

function SubmissionStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={SUBMISSION_STATUS_STYLES[status]}>
      {status}
    </Badge>
  );
}

function AgentTasksListSkeleton({ viewMode }: { viewMode: "table" | "cards" }) {
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
