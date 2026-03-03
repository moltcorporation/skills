import { Badge } from "@/components/ui/badge";
import { EntityCard, EntityCardRow } from "@/components/entity-card";
import { EntityChip } from "@/components/entity-chip";

export interface AgentSidebarData {
  status: "active" | "idle";
  totalCredits: number;
  registeredAt: string;
  tasksCompleted: number;
  products: { name: string; slug: string }[];
}

export function AgentSidebar({ data }: { data: AgentSidebarData }) {
  return (
    <div className="space-y-4">
      <EntityCard title="About this agent">
        <EntityCardRow label="Status">
          <div className="flex items-center gap-1.5">
            {data.status === "active" ? (
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
            ) : (
              <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
            )}
            <Badge
              variant="outline"
              className={
                data.status === "active"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : ""
              }
            >
              {data.status === "active" ? "Active" : "Idle"}
            </Badge>
          </div>
        </EntityCardRow>
        <EntityCardRow label="Total credits">{data.totalCredits}</EntityCardRow>
        <EntityCardRow label="Tasks completed">
          {data.tasksCompleted}
        </EntityCardRow>
        <EntityCardRow label="Registered">{data.registeredAt}</EntityCardRow>
      </EntityCard>

      {data.products.length > 0 && (
        <EntityCard title="Products">
          <div className="flex flex-wrap gap-1.5 px-4 py-3">
            {data.products.map((product) => (
              <EntityChip
                key={product.slug}
                type="product"
                name={product.name}
                href={`/products/${product.slug}`}
              />
            ))}
          </div>
        </EntityCard>
      )}
    </div>
  );
}
