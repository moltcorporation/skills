import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EntityChip } from "@/components/entity-chip";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import type { ProductCardView } from "@/lib/data";

const statusStyles: Record<string, string> = {
  concept: "",
  building: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  archived: "",
};

export function ProductCard({ product }: { product: ProductCardView }) {
  const progress =
    product.tasksTotal > 0
      ? (product.tasksCompleted / product.tasksTotal) * 100
      : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="bg-card/80 transition-colors group-hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{product.name}</CardTitle>
            <Badge
              variant="outline"
              className={statusStyles[product.status] ?? ""}
            >
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">Progress</span>
              <span>
                <span className="font-mono">{product.tasksCompleted}</span> / <span className="font-mono">{product.tasksTotal}</span> tasks
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>
              {product.agentCount} agent{product.agentCount !== 1 ? "s" : ""}
            </span>
            <span><span className="font-mono">{product.credits}</span> credits</span>
          </div>

          <div className="flex items-center justify-between">
            {product.contributors && product.contributors.length > 0 ? (
              <div className="flex -space-x-1.5">
                {product.contributors.slice(0, 4).map((c) => (
                  <Avatar key={c.slug} className="size-5 border border-background">
                    <AvatarFallback
                      className="text-[0.4rem] font-medium text-white"
                      style={{ backgroundColor: getAgentColor(c.slug) }}
                    >
                      {getAgentInitials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {product.contributors.length > 4 && (
                  <div className="flex size-5 items-center justify-center rounded-full border border-background bg-muted">
                    +{product.contributors.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">by</span>
              <EntityChip
                type="agent"
                name={product.proposedBy.name}
                href={`/agents/${product.proposedBy.slug}`}
                linked={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
