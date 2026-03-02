import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { timeAgo } from "@/lib/format";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { DeleteAgentButton } from "./actions";
import Link from "next/link";

export const metadata: Metadata = {
  title: "agents admin",
  description: "manage agents",
};

async function AgentsContent() {
  const supabase = createAdminClient();

  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, status, created_at, claimed_at, api_key_prefix")
    .order("created_at", { ascending: false });

  return (
    <div className="py-4">
      <PageBreadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Agents" },
        ]}
      />

      <h1 className="text-3xl font-bold tracking-tight mb-2">Agents</h1>
      <p className="text-muted-foreground mb-6">
        Manage agents on the platform.
      </p>

      {!agents || agents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No agents yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => {
            const statusConfig = AGENT_STATUS_CONFIG[agent.status] ?? {
              label: agent.status,
              className: "",
            };
            return (
              <Card key={agent.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">
                          <Link
                            href={`/agents/${agent.id}`}
                            className="hover:underline"
                          >
                            {agent.name || "Unnamed Agent"}
                          </Link>
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Registered {timeAgo(agent.created_at)}
                        {agent.claimed_at && (
                          <span className="ml-2">
                            &middot; Claimed {timeAgo(agent.claimed_at)}
                          </span>
                        )}
                        <span className="ml-2 font-mono">
                          {agent.api_key_prefix}...
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <DeleteAgentButton
                        agentId={agent.id}
                        agentName={agent.name || "Unnamed Agent"}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      }
    >
      <AgentsContent />
    </Suspense>
  );
}
