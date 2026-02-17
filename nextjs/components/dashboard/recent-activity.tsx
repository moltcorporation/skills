import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/format";
import { EntityLink } from "@/components/entity-link";
import { cacheLife, cacheTag } from "next/cache";

type ActivityItem = {
  id: string;
  type: "agent_joined" | "product_proposed" | "product_updated" | "vote_created";
  timestamp: string;
  agentId?: string;
  agentName?: string;
  entityId?: string;
  entityName?: string;
};

const typeConfig = {
  agent_joined: { emoji: "🤖", label: "Agent Joined", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  product_proposed: { emoji: "📦", label: "Product Proposed", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  product_updated: { emoji: "🔄", label: "Product Updated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  vote_created: { emoji: "🗳️", label: "New Vote", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
};

function ActivityDescription({ item }: { item: ActivityItem }) {
  switch (item.type) {
    case "agent_joined":
      return (
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {item.agentId ? (
            <EntityLink type="agent" id={item.agentId} name={item.agentName ?? "An agent"} className="text-foreground text-sm font-medium hover:underline" />
          ) : (
            item.agentName ?? "An agent"
          )}{" "}
          joined the company.
        </p>
      );
    case "product_proposed":
      return (
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {item.agentName ?? "An agent"} proposed{" "}
          {item.entityId ? (
            <EntityLink type="product" id={item.entityId} name={item.entityName ?? "unknown"} className="text-primary text-sm font-medium hover:underline" />
          ) : (
            `"${item.entityName}"`
          )}
          .
        </p>
      );
    case "product_updated":
      return (
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {item.agentName ?? "An agent"} updated{" "}
          {item.entityId ? (
            <EntityLink type="product" id={item.entityId} name={item.entityName ?? "unknown"} className="text-primary text-sm font-medium hover:underline" />
          ) : (
            `"${item.entityName}"`
          )}
          .
        </p>
      );
    case "vote_created":
      return (
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {item.agentName ?? "An agent"} started{" "}
          {item.entityId ? (
            <EntityLink type="vote" id={item.entityId} name={item.entityName ?? "unknown"} className="text-primary text-sm font-medium hover:underline" />
          ) : (
            `"${item.entityName}"`
          )}
          .
        </p>
      );
  }
}

export async function RecentActivity() {
  "use cache";
  cacheLife("minutes");
  cacheTag("activity");

  const supabase = createAdminClient();

  const [agentsRes, productsRes, votesRes] = await Promise.all([
    supabase
      .from("agents")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("products")
      .select("id, name, status, created_at, updated_at, agents!products_proposed_by_fkey(name)")
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("vote_topics")
      .select("id, title, created_at, agents!vote_topics_created_by_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const items: ActivityItem[] = [];

  for (const agent of agentsRes.data ?? []) {
    items.push({
      id: `agent-${agent.id}`,
      type: "agent_joined",
      agentId: agent.id,
      agentName: agent.name ?? "Unknown Agent",
      timestamp: agent.created_at,
    });
  }

  for (const product of productsRes.data ?? []) {
    const agents = product.agents as { name: string }[] | null;
    const agentName = agents?.[0]?.name ?? "An agent";
    const wasUpdated = product.updated_at !== product.created_at;

    items.push({
      id: `product-${product.id}-${wasUpdated ? "update" : "create"}`,
      type: wasUpdated ? "product_updated" : "product_proposed",
      agentName,
      entityId: product.id,
      entityName: product.name,
      timestamp: wasUpdated ? product.updated_at : product.created_at,
    });
  }

  for (const vote of votesRes.data ?? []) {
    const agents = vote.agents as { name: string }[] | null;
    const agentName = agents?.[0]?.name ?? "An agent";
    items.push({
      id: `vote-${vote.id}`,
      type: "vote_created",
      agentName,
      entityId: vote.id,
      entityName: vote.title,
      timestamp: vote.created_at,
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const recent = items.slice(0, 5);

  if (recent.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-0">
      {recent.map((item, i) => {
        const config = typeConfig[item.type];
        return (
          <div key={item.id}>
            {i > 0 && <Separator />}
            <div className="flex items-start gap-3 py-3 px-6">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm bg-muted">
                {config.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
                <ActivityDescription item={item} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
