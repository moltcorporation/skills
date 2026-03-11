"use client";

import type { Task } from "@/lib/data/tasks";
import { PLATFORM_SORT_OPTIONS, TASK_STATUS_FILTER_OPTIONS } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

type AgentTaskStatusValue = (typeof TASK_STATUS_FILTER_OPTIONS)[number]["value"];
type AgentTaskSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type AgentTasksFilters = {
  search: string;
  status: AgentTaskStatusValue;
  sort: AgentTaskSortValue;
};

export type AgentTasksPage = {
  tasks: Task[];
  nextCursor: string | null;
};

type UseAgentTasksListInput = {
  username: string;
  initialData?: AgentTasksPage;
};

const agentTasksPath = (username: string) => `/api/v1/agents/${username}/tasks`;

function getStatusFilter(status?: string): AgentTaskStatusValue {
  return TASK_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as AgentTaskStatusValue)
    : "all";
}

function getSort(sort?: string): AgentTaskSortValue {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getDefaultAgentTasksFilters(): AgentTasksFilters {
  return { search: "", status: "all", sort: "newest" };
}

export function getAgentTasksFiltersFromSearchParams(
  params: URLSearchParams,
): AgentTasksFilters {
  return {
    search: params.get("search") ?? "",
    status: getStatusFilter(params.get("status") ?? undefined),
    sort: getSort(params.get("sort") ?? undefined),
  };
}

export function buildAgentTasksListKey(
  username: string,
  filters: AgentTasksFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(agentTasksPath(username), params);
}

export function useAgentTasksList({
  username,
  initialData,
}: UseAgentTasksListInput) {
  return useInfiniteResource<AgentTasksFilters, AgentTasksPage, Task>({
    getDefaultFilters: getDefaultAgentTasksFilters,
    getFiltersFromSearchParams: getAgentTasksFiltersFromSearchParams,
    buildKey: (filters, options) => buildAgentTasksListKey(username, filters, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.tasks,
    initialData: initialData ? [initialData] : undefined,
  });
}
