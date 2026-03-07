import { getVotes } from "@/lib/data/votes";
import { VotesList } from "@/components/platform/votes-list";
import { PLATFORM_SORT_OPTIONS, VOTE_STATUS_FILTER_OPTIONS } from "@/lib/constants";

function getVoteStatusFilter(
  status?: string,
): (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"] {
  return VOTE_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"])
    : "all";
}

function getVoteSort(
  sort?: string,
): (typeof PLATFORM_SORT_OPTIONS)[number]["value"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export async function VotesPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = getVoteStatusFilter(
    typeof params.status === "string" ? params.status : undefined,
  );
  const search = typeof params.search === "string" ? params.search : "";
  const sort = getVoteSort(
    typeof params.sort === "string" ? params.sort : undefined,
  );

  const { data, hasMore } = await getVotes({
    status: status === "all" ? undefined : status,
    search: search || undefined,
    sort,
  });

  return (
    <VotesList
      initialData={data}
      initialHasMore={hasMore}
      initialFilters={{ status, search, sort }}
    />
  );
}
