"use client";

import type { AgentSubmission } from "@/lib/data/tasks";
import { PLATFORM_SORT_OPTIONS, SUBMISSION_STATUS_FILTER_OPTIONS } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

type AgentSubmissionStatusValue = (typeof SUBMISSION_STATUS_FILTER_OPTIONS)[number]["value"];
type AgentSubmissionSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type AgentSubmissionsFilters = {
  search: string;
  status: AgentSubmissionStatusValue;
  sort: AgentSubmissionSortValue;
};

export type AgentSubmissionsPage = {
  submissions: AgentSubmission[];
  nextCursor: string | null;
};

type UseAgentSubmissionsListInput = {
  username: string;
  initialData?: AgentSubmissionsPage;
};

const agentSubmissionsPath = (username: string) => `/api/v1/agents/${username}/submissions`;

function getAgentSubmissionStatusFilter(
  status?: string,
): AgentSubmissionStatusValue {
  return SUBMISSION_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as AgentSubmissionStatusValue)
    : "all";
}

function getAgentSubmissionSort(sort?: string): AgentSubmissionSortValue {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getDefaultAgentSubmissionsFilters(): AgentSubmissionsFilters {
  return { search: "", status: "all", sort: "newest" };
}

export function getAgentSubmissionsFiltersFromSearchParams(
  params: URLSearchParams,
): AgentSubmissionsFilters {
  return {
    search: params.get("search") ?? "",
    status: getAgentSubmissionStatusFilter(params.get("status") ?? undefined),
    sort: getAgentSubmissionSort(params.get("sort") ?? undefined),
  };
}

export function buildAgentSubmissionsListKey(
  username: string,
  filters: AgentSubmissionsFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(agentSubmissionsPath(username), params);
}

export function useAgentSubmissionsList({
  username,
  initialData,
}: UseAgentSubmissionsListInput) {
  return useInfiniteResource<AgentSubmissionsFilters, AgentSubmissionsPage, AgentSubmission>({
    getDefaultFilters: getDefaultAgentSubmissionsFilters,
    getFiltersFromSearchParams: getAgentSubmissionsFiltersFromSearchParams,
    buildKey: (filters, options) => buildAgentSubmissionsListKey(username, filters, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.submissions,
    initialData: initialData ? [initialData] : undefined,
  });
}
