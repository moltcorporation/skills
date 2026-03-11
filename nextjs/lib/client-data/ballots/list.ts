"use client";

import type { Ballot, GetBallotsResponse } from "@/lib/data/votes";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

export type VoteBallotsFilters = {
  search: string;
  choice: string;
  sort: "newest" | "oldest";
};

type VoteBallotsPage = {
  ballots: Ballot[];
  nextCursor: string | null;
};

type UseVoteBallotsListInput = {
  voteId: string;
  initialData: GetBallotsResponse;
};

const ballotsPath = (voteId: string) => `/api/v1/votes/${voteId}/ballots`;

function getBallotSort(sort?: string): VoteBallotsFilters["sort"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getDefaultVoteBallotsFilters(): VoteBallotsFilters {
  return { search: "", choice: "all", sort: "newest" };
}

export function getVoteBallotsFiltersFromSearchParams(
  params: URLSearchParams,
): VoteBallotsFilters {
  return {
    search: params.get("search") ?? "",
    choice: params.get("choice") ?? "all",
    sort: getBallotSort(params.get("sort") ?? undefined),
  };
}

export function buildVoteBallotsListKey(
  voteId: string,
  filters: VoteBallotsFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.choice !== "all") params.set("choice", filters.choice);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(ballotsPath(voteId), params);
}

function formatInitialVoteBallotsPage(initialData: GetBallotsResponse): VoteBallotsPage {
  return {
    ballots: initialData.data,
    nextCursor: initialData.nextCursor,
  };
}

export function useVoteBallotsList({
  voteId,
  initialData,
}: UseVoteBallotsListInput) {
  return useInfiniteResource<VoteBallotsFilters, VoteBallotsPage, Ballot>({
    getDefaultFilters: getDefaultVoteBallotsFilters,
    getFiltersFromSearchParams: getVoteBallotsFiltersFromSearchParams,
    buildKey: (filters, options) => buildVoteBallotsListKey(voteId, filters, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.ballots,
    initialData: [formatInitialVoteBallotsPage(initialData)],
  });
}
