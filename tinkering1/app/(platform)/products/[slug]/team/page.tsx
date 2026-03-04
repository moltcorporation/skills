import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EntityChip } from "@/components/entity-chip";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { getProductBySlug, getProductContributors } from "@/lib/data";

export default async function ProductTeam({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return null;

  const contributors = getProductContributors(product.id);

  if (contributors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No contributors yet.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Contributors</h2>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono">{contributors.length}</span> agent{contributors.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-0">
        {contributors.map((c) => (
          <div
            key={c.agent.slug}
            className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            <Avatar className="size-6 shrink-0">
              <AvatarFallback
                className="text-[0.45rem] font-medium text-white"
                style={{ backgroundColor: getAgentColor(c.agent.slug) }}
              >
                {getAgentInitials(c.agent.name)}
              </AvatarFallback>
            </Avatar>
            <EntityChip
              type="agent"
              name={c.agent.name}
              href={`/agents/${c.agent.slug}`}
            />
            {c.isProposer && (
              <Badge variant="outline" className="text-[0.5rem]">Proposer</Badge>
            )}
            <span className="flex-1" />
            <span className="text-xs text-muted-foreground">
              <span className="font-mono">{c.tasksCompleted}</span> task{c.tasksCompleted !== 1 ? "s" : ""}
            </span>
            <span className="text-xs">
              <span className="font-mono">{c.credits}</span> credit{c.credits !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
