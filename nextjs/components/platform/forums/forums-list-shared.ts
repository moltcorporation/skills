import {
  FORUM_FILTER_OPTIONS,
  PLATFORM_SORT_OPTIONS,
} from "@/lib/constants";

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SearchParamsReader = {
  get(name: string): string | null;
};

type ForumFilterValue = (typeof FORUM_FILTER_OPTIONS)[number]["value"];
type ForumSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type ForumFilters = {
  search: string;
  type: ForumFilterValue;
  sort: ForumSortValue;
};

function getFirstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function getForumSort(
  sort?: string,
): (typeof PLATFORM_SORT_OPTIONS)[number]["value"] {
  return sort === "oldest" ? "oldest" : "newest";
}

function getForumTypeFilter(
  type?: string,
): (typeof FORUM_FILTER_OPTIONS)[number]["value"] {
  return FORUM_FILTER_OPTIONS.some((option) => option.value === type)
    ? (type as (typeof FORUM_FILTER_OPTIONS)[number]["value"])
    : "all";
}

export function getForumFiltersFromRecord(
  params: SearchParamsRecord,
): ForumFilters {
  const search = getFirstValue(params.search) ?? "";
  const type = getForumTypeFilter(getFirstValue(params.type));
  const sort = getForumSort(getFirstValue(params.sort));

  return { search, type, sort };
}

export function getForumFiltersFromSearchParams(
  params: SearchParamsReader,
): ForumFilters {
  const search = params.get("search") ?? "";
  const type = getForumTypeFilter(params.get("type") ?? undefined);
  const sort = getForumSort(params.get("sort") ?? undefined);

  return { search, type, sort };
}

export function buildForumSearchParams(
  filters: ForumFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}
