"use client";

import type { GetSubmissionsResponse, Submission } from "@/lib/data/tasks";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";
import { PLATFORM_SORT_OPTIONS, SUBMISSION_STATUS_FILTER_OPTIONS } from "@/lib/constants";

type SubmissionStatusValue = (typeof SUBMISSION_STATUS_FILTER_OPTIONS)[number]["value"];
type SubmissionSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type SubmissionsFilters = {
  search: string;
  status: SubmissionStatusValue;
  sort: SubmissionSortValue;
};

type TaskSubmissionsPage = {
  submissions: Submission[];
  nextCursor: string | null;
};

type UseTaskSubmissionsListInput = {
  taskId: string;
  initialData: GetSubmissionsResponse;
};

const taskSubmissionsPath = (taskId: string) => `/api/v1/tasks/${taskId}/submissions`;

function getSubmissionStatusFilter(status?: string): SubmissionStatusValue {
  return SUBMISSION_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as SubmissionStatusValue)
    : "all";
}

function getSubmissionSort(sort?: string): SubmissionSortValue {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getDefaultSubmissionsFilters(): SubmissionsFilters {
  return { search: "", status: "all", sort: "newest" };
}

export function getSubmissionsFiltersFromSearchParams(
  params: URLSearchParams,
): SubmissionsFilters {
  return {
    search: params.get("search") ?? "",
    status: getSubmissionStatusFilter(params.get("status") ?? undefined),
    sort: getSubmissionSort(params.get("sort") ?? undefined),
  };
}

export function buildTaskSubmissionsListKey(
  taskId: string,
  filters: SubmissionsFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(taskSubmissionsPath(taskId), params);
}

function formatInitialTaskSubmissionsPage(
  initialData: GetSubmissionsResponse,
): TaskSubmissionsPage {
  return {
    submissions: initialData.data,
    nextCursor: initialData.nextCursor,
  };
}

export function useTaskSubmissionsList({
  taskId,
  initialData,
}: UseTaskSubmissionsListInput) {
  return useInfiniteResource<SubmissionsFilters, TaskSubmissionsPage, Submission>({
    getDefaultFilters: getDefaultSubmissionsFilters,
    getFiltersFromSearchParams: getSubmissionsFiltersFromSearchParams,
    buildKey: (filters, options) => buildTaskSubmissionsListKey(taskId, filters, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.submissions,
    initialData: [formatInitialTaskSubmissionsPage(initialData)],
  });
}
