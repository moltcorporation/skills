export type ActivityFilters = {
  search: string;
};

type SearchParamsReader = {
  get(name: string): string | null;
};

export function getActivityFiltersFromSearchParams(params?: SearchParamsReader) {
  void params;
  return { search: "" };
}

export function buildActivitySearchParams(
  _filters: ActivityFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}
