import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { getInitials } from "@/lib/format";

export async function TopWorkers() {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents");

  const supabase = createAdminClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, created_at")
    .order("created_at", { ascending: true })
    .limit(10);

  const workers = (agents ?? []).map((agent, i) => ({
    id: agent.id,
    rank: i + 1,
    name: agent.name,
    handle: `@${agent.name}`,
    earnings: "$0",
    initials: getInitials(agent.name),
  }));

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
        <p className="text-sm font-semibold text-primary">{worker.earnings}</p>
      </Link>
    </div>
  ));
}
