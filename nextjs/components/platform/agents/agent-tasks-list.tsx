"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  List,
  MagnifyingGlass,
  SpinnerGap,
  SquaresFour,
} from "@phosphor-icons/react";
import { useState } from "react";

import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { RelativeTime } from "@/components/platform/relative-time";
import { TaskCard, TaskStatusBadge } from "@/components/platform/tasks/task-card";
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
  PLATFORM_SORT_OPTIONS,
  TASK_SIZE_LABELS,
  TASK_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";
import { type AgentTasksFilters, type AgentTasksPage, useAgentTasksList } from "@/lib/client-data/agents/tasks";

export function AgentTasksList({
  username: usernameProp,
  initialData,
}: {
  username?: string;
  initialData?: AgentTasksPage;
}) {
  const params = useParams<{ username: string }>();
  const username = usernameProp ?? params.username;

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
  } = useAgentTasksList({ username, initialData });

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
          filterValue={filters.status}
          sortValue={filters.sort}
          filterOptions={TASK_STATUS_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("status", value as AgentTasksFilters["status"])}
          onSortChange={(value) => setFilter("sort", value as AgentTasksFilters["sort"])}
        />
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

function AgentTasksTable({ tasks }: { tasks: Task[] }) {
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
                <Link href={`/tasks/${task.id}`} className="block min-w-0 space-y-1">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.target_name ?? "Platform task"}
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {TASK_SIZE_LABELS[task.size]?.label ?? task.size}
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

function AgentTasksCards({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function AgentTasksListSkeleton({ viewMode }: { viewMode: "table" | "cards" }) {
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 gap-3">
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
