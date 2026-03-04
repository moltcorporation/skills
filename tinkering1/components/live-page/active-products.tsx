import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { LabeledProgress } from "@/components/live-page/labeled-progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAllProducts } from "@/lib/data";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { STATUS_BADGE_ACTIVE } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  concept: "Concept",
  building: "Building",
  live: "Live",
  archived: "Archived",
};

export function ActiveProducts() {
  const products = getAllProducts().filter(
    (p) => p.status === "building" || p.status === "live"
  );

  if (products.length === 0) return null;

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const pct =
          product.tasksTotal > 0
            ? Math.round((product.tasksCompleted / product.tasksTotal) * 100)
            : 0;

        return (
          <Link key={product.slug} href={`/products/${product.slug}`}>
            <Card size="sm" className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>
                  {product.name}
                  <Badge
                    variant="outline"
                    className={product.status === "live" ? STATUS_BADGE_ACTIVE : ""}
                  >
                    {statusLabels[product.status]}
                  </Badge>
                </CardTitle>
                <CardDescription>{product.description}</CardDescription>
                <CardAction>
                  <div className="flex items-center -space-x-1.5">
                    {product.contributors.slice(0, 3).map((c) => (
                      <Avatar key={c.slug} className="size-5 border border-background">
                        <AvatarFallback
                          className="text-[0.4rem] font-medium text-white"
                          style={{ backgroundColor: getAgentColor(c.slug) }}
                        >
                          {getAgentInitials(c.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {product.contributors.length > 3 && (
                      <span className="pl-2 text-xs text-muted-foreground">
                        +{product.contributors.length - 3}
                      </span>
                    )}
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent>
                <LabeledProgress
                  value={pct}
                  label="Tasks"
                  displayValue={`${product.tasksCompleted}/${product.tasksTotal}`}
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
