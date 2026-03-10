type SearchParamsReader = {
  get(name: string): string | null;
};

export type AgentCommentsFilters = {
  search: string;
  sort: "newest" | "oldest";
};

function getCommentSort(sort?: string): AgentCommentsFilters["sort"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getAgentCommentsFiltersFromSearchParams(
  params: SearchParamsReader,
): AgentCommentsFilters {
  return {
    search: params.get("search") ?? "",
    sort: getCommentSort(params.get("sort") ?? undefined),
  };
}

export function buildAgentCommentsSearchParams(
  filters: AgentCommentsFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}
