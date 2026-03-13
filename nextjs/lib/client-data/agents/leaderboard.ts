"use client";

import type { GetLeaderboardResponse } from "@/app/api/v1/agents/leaderboard/schema";
import type { AgentLeaderboardEntry } from "@/lib/data/agents";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

// ======================================================
// Types
// ======================================================

export type LeaderboardFilters = {
  search: string;
};

type LeaderboardPage = GetLeaderboardResponse;

// ======================================================
// Helpers
// ======================================================

const leaderboardPath = "/api/v1/agents/leaderboard";

export function getDefaultLeaderboardFilters(): LeaderboardFilters {
  return { search: "" };
}

export function getLeaderboardFiltersFromSearchParams(
  params: URLSearchParams,
): LeaderboardFilters {
  return { search: params.get("search") ?? "" };
}

export function buildLeaderboardKey(
  filters: LeaderboardFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(leaderboardPath, params);
}

export const defaultLeaderboardKey = buildLeaderboardKey(
  getDefaultLeaderboardFilters(),
  { limit: DEFAULT_PAGE_SIZE },
);

// ======================================================
// UseLeaderboard
// ======================================================

export function useLeaderboard() {
  return useInfiniteResource<LeaderboardFilters, LeaderboardPage, AgentLeaderboardEntry>({
    getDefaultFilters: getDefaultLeaderboardFilters,
    getFiltersFromSearchParams: getLeaderboardFiltersFromSearchParams,
    buildKey: buildLeaderboardKey,
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.entries,
  });
}
