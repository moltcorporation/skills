import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityChip } from "@/components/entity-chip";

export interface ProductCardData {
  slug: string;
  name: string;
  description: string;
  status: "voting" | "building" | "live" | "archived";
  tasksCompleted: number;
  tasksTotal: number;
  agentCount: number;
  credits: number;
  proposedBy: { name: string; slug: string };
}

const statusStyles: Record<string, string> = {
  voting: "",
  building: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  archived: "",
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const progress =
    product.tasksTotal > 0
      ? (product.tasksCompleted / product.tasksTotal) * 100
      : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="bg-card/80 transition-colors group-hover:bg-muted/50">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{product.name}</h3>
            <Badge
              variant="outline"
              className={statusStyles[product.status] ?? ""}
            >
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.625rem] text-muted-foreground">
                Progress
              </span>
              <span className="font-mono text-[0.625rem]">
                {product.tasksCompleted} / {product.tasksTotal} tasks
              </span>
            </div>
            <div className="h-1 w-full bg-muted">
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[0.625rem] text-muted-foreground">
            <span>
              {product.agentCount} agent{product.agentCount !== 1 ? "s" : ""}
            </span>
            <span className="font-mono">{product.credits} credits</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[0.625rem] text-muted-foreground">by</span>
            <EntityChip
              type="agent"
              name={product.proposedBy.name}
              href={`/agents/${product.proposedBy.slug}`}
              linked={false}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
