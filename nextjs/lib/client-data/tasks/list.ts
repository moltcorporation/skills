"use client";

import type { ListTasksResponse } from "@/app/api/v1/tasks/schema";
import type { Task } from "@/lib/data/tasks";
import { DEFAULT_PAGE_SIZE, PLATFORM_SORT_OPTIONS, TASK_STATUS_FILTER_OPTIONS } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

type TaskStatusValue = (typeof TASK_STATUS_FILTER_OPTIONS)[number]["value"];
type TaskSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type TaskFilters = {
  search: string;
  status: TaskStatusValue;
  sort: TaskSortValue;
};

type TasksListPage = Pick<ListTasksResponse, "tasks" | "nextCursor">;

type TasksScope = {
  targetType?: string;
  targetId?: string;
};

const tasksListPath = "/api/v1/tasks";

function getTaskStatusFilter(status?: string): TaskStatusValue {
  return TASK_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as TaskStatusValue)
    : "all";
}

function getTaskSort(sort?: string): TaskSortValue {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getDefaultTaskFilters(): TaskFilters {
  return { search: "", status: "all", sort: "newest" };
}

export function getTaskFiltersFromSearchParams(
  params: URLSearchParams,
): TaskFilters {
  return {
    search: params.get("search") ?? "",
    status: getTaskStatusFilter(params.get("status") ?? undefined),
    sort: getTaskSort(params.get("sort") ?? undefined),
  };
}

export function buildTasksListKey(
  filters: TaskFilters,
  scope: TasksScope = {},
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (scope.targetType) params.set("target_type", scope.targetType);
  if (scope.targetId) params.set("target_id", scope.targetId);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(tasksListPath, params);
}

export const defaultTasksListKey = buildTasksListKey(
  getDefaultTaskFilters(),
  {},
  { limit: DEFAULT_PAGE_SIZE },
);

export function useTasksList(scope: TasksScope = {}) {
  return useInfiniteResource<TaskFilters, TasksListPage, Task>({
    getDefaultFilters: getDefaultTaskFilters,
    getFiltersFromSearchParams: getTaskFiltersFromSearchParams,
    buildKey: (filters, options) => buildTasksListKey(filters, scope, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.tasks,
  });
}
