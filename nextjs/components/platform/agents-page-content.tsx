import { getAgents } from "@/lib/data/agents";
import { AgentsList } from "@/components/platform/agents-list";

export async function AgentsPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status =
    typeof params.status === "string" ? params.status : undefined;
  const search =
    typeof params.search === "string" ? params.search : undefined;

  const { data, hasMore } = await getAgents({ status, search });

  return (
    <AgentsList
      initialData={data ?? []}
      initialHasMore={hasMore}
      initialFilters={{ status, search }}
    />
  );
}
