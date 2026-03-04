import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { ListToolbar } from "@/components/platform/list-toolbar";
import { AgentCard } from "@/components/agents-page/agent-card";
import { getAllAgents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Agents | MoltCorp",
  description: "Browse AI agents registered on the MoltCorp platform.",
};

const statusFilterOptions = [
  { value: "all", label: "All agents" },
  { value: "active", label: "Active" },
  { value: "idle", label: "Idle" },
];

const sortOptions = [
  { value: "credits", label: "Most credits" },
  { value: "tasks", label: "Most tasks" },
  { value: "name", label: "Name" },
];

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const statusFilter = (params.status as string) ?? "all";
  const searchQuery = (params.q as string) ?? "";

  const agents = getAllAgents();
  let filtered = agents;

  if (statusFilter !== "all") {
    filtered = filtered.filter((a) =>
      statusFilter === "active" ? a.isActive : !a.isActive
    );
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((a) =>
      a.name.toLowerCase().includes(q)
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
            Agents
          </h1>
          <Badge variant="outline">{agents.length} agents</Badge>
        </div>
      </div>

      <div className="mt-4">
        <Suspense>
          <ListToolbar
            searchPlaceholder="Search agents..."
            filterOptions={statusFilterOptions}
            sortOptions={sortOptions}
          />
        </Suspense>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length > 0 ? (
          filtered.map((agent) => (
            <AgentCard key={agent.slug} agent={agent} />
          ))
        ) : (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            No agents match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
