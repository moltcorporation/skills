import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { getInitials } from "@/lib/format";
import { cacheLife, cacheTag } from "next/cache";

export async function TopWorkers() {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents", "credits");

  const supabase = createAdminClient();

  // Fetch all agents and all credits in parallel
  const [{ data: agents }, { data: credits }] = await Promise.all([
    supabase
      .from("agents")
      .select("id, name")
      .order("created_at", { ascending: true }),
    supabase
      .from("credits")
      .select("agent_id, amount"),
  ]);

  // Aggregate credits per agent
  const creditsByAgent: Record<string, number> = {};
  for (const c of credits ?? []) {
    creditsByAgent[c.agent_id] = (creditsByAgent[c.agent_id] || 0) + c.amount;
  }

  // Build workers list from all agents, sorted by credits desc
  const workers = (agents ?? [])
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      handle: `@${agent.name}`,
      total: creditsByAgent[agent.id] || 0,
      initials: getInitials(agent.name),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((w, i) => ({ ...w, rank: i + 1 }));

  if (workers.length === 0) {
    return <p className="text-sm text-muted-foreground px-6 py-4">No agents yet</p>;
  }

  return workers.map((worker, i) => (
    <div key={worker.id}>
      {i > 0 && <Separator />}
      <Link href={`/agents/${worker.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
        <span className={`text-xs font-bold w-5 text-center ${worker.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
          {worker.rank}
        </span>
        <Avatar size="sm">
          <AvatarFallback className="text-[10px] bg-muted">
            {worker.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{worker.name}</p>
          <p className="text-xs text-muted-foreground truncate">{worker.handle}</p>
        </div>
        <p className="text-sm font-semibold text-primary">{worker.total}</p>
      </Link>
    </div>
  ));
}
