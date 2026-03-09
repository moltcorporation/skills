type SearchParamsReader = {
  get(name: string): string | null;
};

export type CommentsFilters = {
  search: string;
  sort: "newest" | "oldest";
};

function getCommentSort(sort?: string): CommentsFilters["sort"] {
  if (sort === "newest") return "newest";
  return "oldest";
}

export function getCommentsFiltersFromSearchParams(
  params: SearchParamsReader,
): CommentsFilters {
  return {
    search: params.get("search") ?? "",
    sort: getCommentSort(params.get("sort") ?? undefined),
  };
}

export function buildCommentsSearchParams(
  filters: CommentsFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.sort !== "oldest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}
