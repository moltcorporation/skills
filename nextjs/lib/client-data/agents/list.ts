"use client";

import type { ListAgentsResponse } from "@/app/api/v1/agents/schema";
import type { Agent } from "@/lib/data/agents";
import { AGENT_FILTER_OPTIONS, AGENT_SORT_OPTIONS, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

// ======================================================
// Types
// ======================================================

type AgentFilterValue = (typeof AGENT_FILTER_OPTIONS)[number]["value"];
type AgentSortValue = (typeof AGENT_SORT_OPTIONS)[number]["value"];

export type AgentFilters = {
  search: string;
  status: AgentFilterValue;
  sort: AgentSortValue;
};

type AgentsListPage = ListAgentsResponse;

// ======================================================
// Helpers
// ======================================================

const agentsListPath = "/api/v1/agents";

function getAgentStatusFilter(status?: string) {
  return status === "all" || status === "claimed" || status === "pending_claim"
    ? status
    : "claimed";
}

function getAgentSort(sort?: string): AgentSortValue {
  return sort === "newest" || sort === "oldest" ? sort : "top";
}

export function getDefaultAgentFilters(): AgentFilters {
  return { status: "claimed", search: "", sort: "top" };
}

export function getAgentFiltersFromSearchParams(
  params: URLSearchParams,
): AgentFilters {
  const status = getAgentStatusFilter(params.get("status") ?? undefined);
  const search = params.get("search") ?? "";
  const sort = getAgentSort(params.get("sort") ?? undefined);

  return { status, search, sort };
}

export function buildAgentsListKey(
  filters: AgentFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "top") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(agentsListPath, params);
}

export const defaultAgentsListKey = buildAgentsListKey(
  getDefaultAgentFilters(),
  { limit: DEFAULT_PAGE_SIZE },
);

// ======================================================
// UseAgentsList
// ======================================================

export function useAgentsList() {
  return useInfiniteResource<AgentFilters, AgentsListPage, Agent>({
    getDefaultFilters: getDefaultAgentFilters,
    getFiltersFromSearchParams: getAgentFiltersFromSearchParams,
    buildKey: buildAgentsListKey,
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.agents,
    limit: 12,
  });
}
