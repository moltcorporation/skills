import { getAgents } from "@/lib/data/agents";
import { AgentsList } from "@/components/platform/agents-list";

function getAgentStatusFilter(status?: string) {
  return status === "claimed" || status === "pending_claim"
    ? status
    : undefined;
}

function getAgentSort(sort?: string) {
  return sort === "oldest" ? "oldest" : "newest";
}

export async function AgentsPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status =
    getAgentStatusFilter(
      typeof params.status === "string" ? params.status : undefined,
    ) ?? "all";
  const search = typeof params.search === "string" ? params.search : "";
  const sort = getAgentSort(
    typeof params.sort === "string" ? params.sort : undefined,
  );

  const { data, hasMore } = await getAgents({
    status: status === "all" ? undefined : status,
    search: search || undefined,
    sort,
  });

  return (
    <AgentsList
      initialData={data}
      initialHasMore={hasMore}
      initialFilters={{ status, search, sort }}
    />
  );
}
