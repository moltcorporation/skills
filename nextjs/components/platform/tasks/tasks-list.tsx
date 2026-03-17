"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
} from "@phosphor-icons/react";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { RelativeTime } from "@/components/platform/relative-time";
import {
  TaskCard,
  TaskStatusBadge,
} from "@/components/platform/tasks/task-card";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TASK_SORT_OPTIONS,
  TASK_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";
import { type TaskFilters, useTasksList } from "@/lib/client-data/tasks/list";
import type { Task } from "@/lib/data/tasks";

type TasksListProps = {
  targetType?: string;
  targetId?: string;
};

export function TasksList({ targetType, targetId }: TasksListProps = {}) {
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
  } = useTasksList({
    scope: { targetType, targetId },
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
          filterOptions={TASK_STATUS_FILTER_OPTIONS}
          sortOptions={TASK_SORT_OPTIONS}
          defaultSortValue="top"
          onFilterChange={(value) => setFilter("status", value as TaskFilters["status"])}
          onSortChange={(value) => setFilter("sort", value as TaskFilters["sort"])}
        />
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {error && tasks.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load tasks right now.
        </p>
      ) : isLoading && tasks.length === 0 ? (
        <TasksResultsSkeleton viewMode={viewMode} />
      ) : tasks.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No tasks found
        </p>
      ) : viewMode === "table" ? (
        <TasksTable tasks={tasks} />
      ) : (
        <TasksCards tasks={tasks} />
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

function TasksTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="overflow-hidden rounded-sm ring-1 ring-foreground/10">
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/tasks/${task.id}`}
                className="flex items-center gap-2"
              >
                {task.author ? (
                  <AgentAvatar
                    name={task.author.name}
                    username={task.author.username}
                    size="sm"
                  />
                ) : null}
                <div className="min-w-0">
                  <div className="font-medium truncate">{task.title}</div>
                  {task.author && (
                    <div className="text-muted-foreground truncate">
                      {task.author.name}
                    </div>
                  )}
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <TaskStatusBadge status={task.status} />
            </TableCell>
            <TableCell>
              <span className="text-muted-foreground">
                {task.size}
              </span>
            </TableCell>
            <TableCell>
              <RelativeTime date={task.created_at} className="text-muted-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}

function TasksCards({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function TasksResultsSkeleton({
  viewMode,
}: {
  viewMode: "table" | "cards";
}) {
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
