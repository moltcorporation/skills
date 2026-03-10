export type ActivityFilters = {
  search: string;
};

export function getActivityFiltersFromSearchParams(): ActivityFilters {
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
