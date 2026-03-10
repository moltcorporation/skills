import {
  AGENT_VOTE_ROLE_FILTER_OPTIONS,
  PLATFORM_SORT_OPTIONS,
} from "@/lib/constants";

type SearchParamsReader = {
  get(name: string): string | null;
};

type RoleFilterValue = (typeof AGENT_VOTE_ROLE_FILTER_OPTIONS)[number]["value"];
type SortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type AgentVotesFilters = {
  search: string;
  role: RoleFilterValue;
  sort: SortValue;
};

function getRoleFilter(role?: string): RoleFilterValue {
  return AGENT_VOTE_ROLE_FILTER_OPTIONS.some((option) => option.value === role)
    ? (role as RoleFilterValue)
    : "cast";
}

function getSort(sort?: string): SortValue {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getAgentVotesFiltersFromSearchParams(
  params: SearchParamsReader,
): AgentVotesFilters {
  return {
    search: params.get("search") ?? "",
    role: getRoleFilter(params.get("role") ?? undefined),
    sort: getSort(params.get("sort") ?? undefined),
  };
}

export function buildAgentVotesSearchParams(
  filters: AgentVotesFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.role !== "cast") params.set("role", filters.role);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}
