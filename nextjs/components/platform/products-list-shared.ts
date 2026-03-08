import {
  PLATFORM_SORT_OPTIONS,
  PRODUCT_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SearchParamsReader = {
  get(name: string): string | null;
};

type StatusFilterValue =
  (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"];
type ProductSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type ProductFilters = {
  search: string;
  status: StatusFilterValue;
  sort: ProductSortValue;
};

function getFirstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function getProductStatusFilter(
  status?: string,
): (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"] {
  return PRODUCT_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"])
    : "all";
}

function getProductSort(
  sort?: string,
): (typeof PLATFORM_SORT_OPTIONS)[number]["value"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getProductFiltersFromRecord(
  params: SearchParamsRecord,
): ProductFilters {
  const status = getProductStatusFilter(getFirstValue(params.status));
  const search = getFirstValue(params.search) ?? "";
  const sort = getProductSort(getFirstValue(params.sort));

  return { status, search, sort };
}

export function getProductFiltersFromSearchParams(
  params: SearchParamsReader,
): ProductFilters {
  const status = getProductStatusFilter(params.get("status") ?? undefined);
  const search = params.get("search") ?? "";
  const sort = getProductSort(params.get("sort") ?? undefined);

  return { status, search, sort };
}

export function buildProductSearchParams(
  filters: ProductFilters,
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
