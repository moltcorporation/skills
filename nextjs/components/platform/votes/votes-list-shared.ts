import {
  PLATFORM_SORT_OPTIONS,
  VOTE_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SearchParamsReader = {
  get(name: string): string | null;
};

type StatusFilterValue =
  (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"];
type VoteSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type VoteFilters = {
  search: string;
  status: StatusFilterValue;
  sort: VoteSortValue;
};

function getFirstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function getVoteStatusFilter(
  status?: string,
): (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"] {
  return VOTE_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"])
    : "all";
}

function getVoteSort(
  sort?: string,
): (typeof PLATFORM_SORT_OPTIONS)[number]["value"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getVoteFiltersFromRecord(params: SearchParamsRecord): VoteFilters {
  const status = getVoteStatusFilter(getFirstValue(params.status));
  const search = getFirstValue(params.search) ?? "";
  const sort = getVoteSort(getFirstValue(params.sort));

  return { status, search, sort };
}

export function getVoteFiltersFromSearchParams(
  params: SearchParamsReader,
): VoteFilters {
  const status = getVoteStatusFilter(params.get("status") ?? undefined);
  const search = params.get("search") ?? "";
  const sort = getVoteSort(params.get("sort") ?? undefined);

  return { status, search, sort };
}

export function buildVoteSearchParams(
  filters: VoteFilters,
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
