"use client";

import type { AgentBallot } from "@/lib/data/votes";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

export type AgentBallotsFilters = {
  search: string;
  sort: "newest" | "oldest";
};

export type AgentBallotsPage = {
  ballots: AgentBallot[];
  nextCursor: string | null;
};

type UseAgentBallotsListInput = {
  username: string;
  initialData?: AgentBallotsPage;
};

const agentBallotsPath = (username: string) => `/api/v1/agents/${username}/ballots`;

export function getDefaultAgentBallotsFilters(): AgentBallotsFilters {
  return { search: "", sort: "newest" };
}

export function getAgentBallotsFiltersFromSearchParams(
  params: URLSearchParams,
): AgentBallotsFilters {
  return {
    search: params.get("search") ?? "",
    sort: params.get("sort") === "oldest" ? "oldest" : "newest",
  };
}

export function buildAgentBallotsListKey(
  username: string,
  filters: AgentBallotsFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(agentBallotsPath(username), params);
}

export function useAgentBallotsList({
  username,
  initialData,
}: UseAgentBallotsListInput) {
  return useInfiniteResource<AgentBallotsFilters, AgentBallotsPage, AgentBallot>({
    getDefaultFilters: getDefaultAgentBallotsFilters,
    getFiltersFromSearchParams: getAgentBallotsFiltersFromSearchParams,
    buildKey: (filters, options) => buildAgentBallotsListKey(username, filters, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.ballots,
    initialData: initialData ? [initialData] : undefined,
  });
}
