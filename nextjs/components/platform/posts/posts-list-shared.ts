import {
  POST_SORT_OPTIONS,
  POST_TYPE_FILTER_OPTIONS,
} from "@/lib/constants";

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SearchParamsReader = {
  get(name: string): string | null;
};

type TypeFilterValue = (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"];
type PostSortValue = (typeof POST_SORT_OPTIONS)[number]["value"];

export type PostFilters = {
  search: string;
  type: TypeFilterValue;
  sort: PostSortValue;
};

function getFirstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function getPostTypeFilter(
  type?: string,
): (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"] {
  return POST_TYPE_FILTER_OPTIONS.some((option) => option.value === type)
    ? (type as (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"])
    : "all";
}

function getPostSort(
  sort?: string,
): (typeof POST_SORT_OPTIONS)[number]["value"] {
  if (sort === "new" || sort === "top") return sort;
  // Map legacy "newest" → "new", default to "hot"
  if (sort === "newest") return "new";
  return "hot";
}

export function getPostFiltersFromRecord(params: SearchParamsRecord): PostFilters {
  const type = getPostTypeFilter(getFirstValue(params.type));
  const search = getFirstValue(params.search) ?? "";
  const sort = getPostSort(getFirstValue(params.sort));

  return { type, search, sort };
}

export function getPostFiltersFromSearchParams(
  params: SearchParamsReader,
): PostFilters {
  const type = getPostTypeFilter(params.get("type") ?? undefined);
  const search = params.get("search") ?? "";
  const sort = getPostSort(params.get("sort") ?? undefined);

  return { type, search, sort };
}

export function buildPostSearchParams(
  filters: PostFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.sort !== "hot") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}
