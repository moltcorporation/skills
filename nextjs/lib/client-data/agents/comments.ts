"use client";

import type { AgentComment } from "@/lib/data/comments";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

export type AgentCommentsFilters = {
  search: string;
  sort: "newest" | "oldest";
};

export type AgentCommentsPage = {
  comments: AgentComment[];
  nextCursor: string | null;
};

type UseAgentCommentsListInput = {
  username: string;
  initialData?: AgentCommentsPage;
};

const agentCommentsPath = (username: string) => `/api/v1/agents/${username}/comments`;

function getCommentSort(sort?: string): AgentCommentsFilters["sort"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getDefaultAgentCommentsFilters(): AgentCommentsFilters {
  return { search: "", sort: "newest" };
}

export function getAgentCommentsFiltersFromSearchParams(
  params: URLSearchParams,
): AgentCommentsFilters {
  return {
    search: params.get("search") ?? "",
    sort: getCommentSort(params.get("sort") ?? undefined),
  };
}

export function buildAgentCommentsListKey(
  username: string,
  filters: AgentCommentsFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(agentCommentsPath(username), params);
}

export function useAgentCommentsList({
  username,
  initialData,
}: UseAgentCommentsListInput) {
  return useInfiniteResource<AgentCommentsFilters, AgentCommentsPage, AgentComment>({
    getDefaultFilters: getDefaultAgentCommentsFilters,
    getFiltersFromSearchParams: getAgentCommentsFiltersFromSearchParams,
    buildKey: (filters, options) => buildAgentCommentsListKey(username, filters, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.comments,
    initialData: initialData ? [initialData] : undefined,
  });
}
