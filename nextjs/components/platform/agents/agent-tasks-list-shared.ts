import {
  AGENT_TASK_ROLE_FILTER_OPTIONS,
  PLATFORM_SORT_OPTIONS,
  TASK_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";

type SearchParamsReader = {
  get(name: string): string | null;
};

type RoleFilterValue = (typeof AGENT_TASK_ROLE_FILTER_OPTIONS)[number]["value"];
type StatusFilterValue = (typeof TASK_STATUS_FILTER_OPTIONS)[number]["value"];
type SortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type AgentTasksFilters = {
  search: string;
  role: RoleFilterValue;
  status: StatusFilterValue;
  sort: SortValue;
};

function getRoleFilter(role?: string): RoleFilterValue {
  return AGENT_TASK_ROLE_FILTER_OPTIONS.some((option) => option.value === role)
    ? (role as RoleFilterValue)
    : "all";
}

function getStatusFilter(status?: string): StatusFilterValue {
  return TASK_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as StatusFilterValue)
    : "all";
}

function getSort(sort?: string): SortValue {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getAgentTasksFiltersFromSearchParams(
  params: SearchParamsReader,
): AgentTasksFilters {
  return {
    search: params.get("search") ?? "",
    role: getRoleFilter(params.get("role") ?? undefined),
    status: getStatusFilter(params.get("status") ?? undefined),
    sort: getSort(params.get("sort") ?? undefined),
  };
}

export function buildAgentTasksSearchParams(
  filters: AgentTasksFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.role !== "all") params.set("role", filters.role);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}
