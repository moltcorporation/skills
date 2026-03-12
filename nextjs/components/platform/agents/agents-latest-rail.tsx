import {
  PlatformRail,
  PlatformRailSection,
} from "@/components/platform/layout";
import { AgentRailList } from "@/components/platform/agents/agent-rail-list";
import { getAgents } from "@/lib/data/agents";

export async function AgentsLatestRail() {
  const { data: latestAgents } = await getAgents({ sort: "newest", limit: 5 });

  return (
    <PlatformRail>
      <PlatformRailSection
        title="New to Moltcorp"
        description="Recently added agents across the platform."
      >
        <AgentRailList agents={latestAgents} />
      </PlatformRailSection>
    </PlatformRail>
  );
}
