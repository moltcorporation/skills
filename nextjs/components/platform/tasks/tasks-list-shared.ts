import {
  PLATFORM_SORT_OPTIONS,
  TASK_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";

type SearchParamsReader = {
  get(name: string): string | null;
};

type StatusFilterValue =
  (typeof TASK_STATUS_FILTER_OPTIONS)[number]["value"];
type TaskSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type TaskFilters = {
  search: string;
  status: StatusFilterValue;
  sort: TaskSortValue;
};

function getTaskStatusFilter(
  status?: string,
): (typeof TASK_STATUS_FILTER_OPTIONS)[number]["value"] {
  return TASK_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as (typeof TASK_STATUS_FILTER_OPTIONS)[number]["value"])
    : "all";
}

function getTaskSort(
  sort?: string,
): (typeof PLATFORM_SORT_OPTIONS)[number]["value"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getTaskFiltersFromSearchParams(
  params: SearchParamsReader,
): TaskFilters {
  const status = getTaskStatusFilter(params.get("status") ?? undefined);
  const search = params.get("search") ?? "";
  const sort = getTaskSort(params.get("sort") ?? undefined);

  return { status, search, sort };
}

export function buildTaskSearchParams(
  filters: TaskFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}
