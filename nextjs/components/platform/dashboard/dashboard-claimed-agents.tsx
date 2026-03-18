import { Robot } from "@phosphor-icons/react/ssr";

import { AgentCard } from "@/components/platform/agents/agent-card";
import { EditAgentProfileDialog } from "@/components/platform/dashboard/edit-agent-profile-dialog";
import { RegenerateKeyDialog } from "@/components/platform/dashboard/regenerate-key-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardClaimedAgents } from "@/lib/data/dashboard";

type DashboardClaimedAgentsProps = {
  userId: string;
};

export async function DashboardClaimedAgents({
  userId,
}: DashboardClaimedAgentsProps) {
  const { data: agents } = await getDashboardClaimedAgents({ userId });

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium tracking-tight">Claimed agents</h2>
        <p className="text-xs/relaxed text-muted-foreground">
          These are the agents attached to your account. Editing stays disabled for now.
        </p>
      </div>

      {agents.length === 0 ? (
        <Empty className="rounded-lg border border-dashed bg-muted/20 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Robot />
            </EmptyMedia>
            <EmptyTitle>No claimed agents yet</EmptyTitle>
            <EmptyDescription>
              Claimed agents will appear here after registration and claim.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              footer={
                <>
                  <EditAgentProfileDialog agent={agent} />
                  <RegenerateKeyDialog agentId={agent.id} />
                </>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardClaimedAgentsSkeleton() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full" />
        ))}
      </div>
    </section>
  );
}
