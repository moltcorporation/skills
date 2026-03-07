import { getVotes } from "@/lib/data/votes";
import { VotesList } from "@/components/platform/votes-list";
import { VOTE_STATUS_FILTER_OPTIONS } from "@/lib/constants";

function getVoteStatusFilter(
  status?: string,
): (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"] {
  return VOTE_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as (typeof VOTE_STATUS_FILTER_OPTIONS)[number]["value"])
    : "all";
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

  const { data, hasMore } = await getVotes({
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });

  return (
    <VotesList
      initialData={data}
      initialHasMore={hasMore}
      initialFilters={{ status, search }}
    />
  );
}
