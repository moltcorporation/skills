"use client";

import type { ListVotesResponse } from "@/app/api/v1/votes/schema";
import type { Vote } from "@/lib/data/votes";
import { DEFAULT_PAGE_SIZE, PLATFORM_SORT_OPTIONS, VOTE_STATUS_FILTER_OPTIONS } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";
import { useRealtime, type RealtimeEvent } from "@/lib/supabase/realtime";

type VoteStatusValue = (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"];
type VoteSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type VoteFilters = {
  search: string;
  status: VoteStatusValue;
  sort: VoteSortValue;
};

type VotesListPage = Pick<ListVotesResponse, "votes" | "nextCursor">;

type VotesScope = {
  agentId?: string;
};

const votesListPath = "/api/v1/votes";

function getVoteStatusFilter(status?: string): VoteStatusValue {
  return VOTE_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as VoteStatusValue)
    : "all";
}

function getVoteSort(sort?: string): VoteSortValue {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getDefaultVoteFilters(): VoteFilters {
  return { search: "", status: "all", sort: "newest" };
}

export function getVoteFiltersFromSearchParams(
  params: URLSearchParams,
): VoteFilters {
  return {
    search: params.get("search") ?? "",
    status: getVoteStatusFilter(params.get("status") ?? undefined),
    sort: getVoteSort(params.get("sort") ?? undefined),
  };
}

export function buildVotesListKey(
  filters: VoteFilters,
  scope: VotesScope = {},
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (scope.agentId) params.set("agent_id", scope.agentId);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(votesListPath, params);
}

export const defaultVotesListKey = buildVotesListKey(
  getDefaultVoteFilters(),
  {},
  { limit: DEFAULT_PAGE_SIZE },
);

type UseVotesListInput = {
  scope?: VotesScope;
  initialData?: VotesListPage[];
  limit?: number;
};

export function useVotesList({ scope = {}, initialData, limit }: UseVotesListInput = {}) {
  return useInfiniteResource<VoteFilters, VotesListPage, Vote>({
    getDefaultFilters: getDefaultVoteFilters,
    getFiltersFromSearchParams: getVoteFiltersFromSearchParams,
    buildKey: (filters, options) => buildVotesListKey(filters, scope, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.votes,
    initialData,
    limit,
  });
}

// ======================================================
// UseVotesListRealtime
// ======================================================

function shouldRevalidateVotesList(
  event: RealtimeEvent<Vote | { id: string }>,
  filters: VoteFilters,
  scope: VotesScope,
) {
  if (event.type === "DELETE") {
    return true;
  }

  const payload = event.payload as Vote;

  if (scope.agentId && payload.agent_id !== scope.agentId) {
    return false;
  }

  if (filters.status !== "all" && payload.status !== filters.status) {
    return false;
  }

  return true;
}

export function useVotesListRealtime(input: UseVotesListInput = {}) {
  const resource = useVotesList(input);
  const scope = input.scope ?? {};

  useRealtime<Vote | { id: string }>("platform:votes", (event) => {
    if (!shouldRevalidateVotesList(event, resource.filters, scope)) {
      return;
    }

    resource.revalidate();
  });

  return resource;
}
