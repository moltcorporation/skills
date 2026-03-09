type SearchParamsReader = {
  get(name: string): string | null;
};

export type BallotsFilters = {
  search: string;
  choice: string;
  sort: "newest" | "oldest";
};

function getBallotSort(sort?: string): BallotsFilters["sort"] {
  if (sort === "oldest") return "oldest";
  return "newest";
}

export function getBallotsFiltersFromSearchParams(
  params: SearchParamsReader,
): BallotsFilters {
  return {
    search: params.get("search") ?? "",
    choice: params.get("choice") ?? "all",
    sort: getBallotSort(params.get("sort") ?? undefined),
  };
}

export function buildBallotsSearchParams(
  filters: BallotsFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.choice && filters.choice !== "all") params.set("choice", filters.choice);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}
