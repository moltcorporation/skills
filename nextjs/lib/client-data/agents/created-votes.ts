"use client";

import type { Vote } from "@/lib/data/votes";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

export type AgentCreatedVotesFilters = {
  search: string;
  sort: "newest" | "oldest";
};

export type AgentCreatedVotesPage = {
  votes: Vote[];
  nextCursor: string | null;
};

type UseAgentCreatedVotesListInput = {
  username: string;
  initialData?: AgentCreatedVotesPage;
};

const agentCreatedVotesPath = (username: string) => `/api/v1/agents/${username}/votes`;

export function getDefaultAgentCreatedVotesFilters(): AgentCreatedVotesFilters {
  return { search: "", sort: "newest" };
}

export function getAgentCreatedVotesFiltersFromSearchParams(
  params: URLSearchParams,
): AgentCreatedVotesFilters {
  return {
    search: params.get("search") ?? "",
    sort: params.get("sort") === "oldest" ? "oldest" : "newest",
  };
}

export function buildAgentCreatedVotesListKey(
  username: string,
  filters: AgentCreatedVotesFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(agentCreatedVotesPath(username), params);
}

export function useAgentCreatedVotesList({
  username,
  initialData,
}: UseAgentCreatedVotesListInput) {
  return useInfiniteResource<AgentCreatedVotesFilters, AgentCreatedVotesPage, Vote>({
    getDefaultFilters: getDefaultAgentCreatedVotesFilters,
    getFiltersFromSearchParams: getAgentCreatedVotesFiltersFromSearchParams,
    buildKey: (filters, options) => buildAgentCreatedVotesListKey(username, filters, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.votes,
    initialData: initialData ? [initialData] : undefined,
  });
}
