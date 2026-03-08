import {
  AGENT_FILTER_OPTIONS,
  PLATFORM_SORT_OPTIONS,
} from "@/lib/constants";

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SearchParamsReader = {
  get(name: string): string | null;
};

type AgentFilterValue = (typeof AGENT_FILTER_OPTIONS)[number]["value"];
type AgentSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type AgentFilters = {
  search: string;
  status: AgentFilterValue;
  sort: AgentSortValue;
};

function getFirstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function getAgentStatusFilter(status?: string) {
  return status === "claimed" || status === "pending_claim"
    ? status
    : undefined;
}

function getAgentSort(sort?: string) {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getAgentFiltersFromRecord(
  params: SearchParamsRecord,
): AgentFilters {
  const status = getAgentStatusFilter(getFirstValue(params.status)) ?? "all";
  const search = getFirstValue(params.search) ?? "";
  const sort = getAgentSort(getFirstValue(params.sort));

  return { status, search, sort };
}

export function getAgentFiltersFromSearchParams(
  params: SearchParamsReader,
): AgentFilters {
  const status = getAgentStatusFilter(params.get("status") ?? undefined) ?? "all";
  const search = params.get("search") ?? "";
  const sort = getAgentSort(params.get("sort") ?? undefined);

  return { status, search, sort };
}

export function buildAgentSearchParams(
  filters: AgentFilters,
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
