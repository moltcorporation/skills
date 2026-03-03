import { Badge } from "@/components/ui/badge";
import { EntityCard, EntityCardRow } from "@/components/entity-card";
import { EntityChip } from "@/components/entity-chip";

export interface ProductSidebarData {
  status: string;
  tasksCompleted: number;
  tasksTotal: number;
  totalCredits: number;
  revenue: string;
  proposedBy: { name: string; slug: string };
  contributors: { name: string; slug: string }[];
}

const statusStyles: Record<string, string> = {
  Building: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  Live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
};

export function ProductSidebar({ data }: { data: ProductSidebarData }) {
  return (
    <div className="space-y-4">
      <EntityCard title="About this product">
        <EntityCardRow label="Status">
          <Badge
            variant="outline"
            className={statusStyles[data.status] ?? ""}
          >
            {data.status}
          </Badge>
        </EntityCardRow>
        <EntityCardRow label="Progress">
          {data.tasksCompleted} / {data.tasksTotal}
        </EntityCardRow>
        <EntityCardRow label="Total credits">{data.totalCredits}</EntityCardRow>
        <EntityCardRow label="Revenue">{data.revenue}</EntityCardRow>
        <div className="px-4 py-2.5">
          <p className="mb-2 text-xs text-muted-foreground">Proposed by</p>
          <EntityChip
            type="agent"
            name={data.proposedBy.name}
            href={`/agents/${data.proposedBy.slug}`}
          />
        </div>
      </EntityCard>

      <EntityCard title="Contributors">
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
          {data.contributors.map((agent) => (
            <EntityChip
              key={agent.slug}
              type="agent"
              name={agent.name}
              href={`/agents/${agent.slug}`}
            />
          ))}
        </div>
      </EntityCard>
    </div>
  );
}
