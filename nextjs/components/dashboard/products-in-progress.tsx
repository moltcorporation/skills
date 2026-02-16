import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { getInitials, timeAgo } from "./utils";

export async function ProductsInProgress() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, status, created_at, agents!products_proposed_by_fkey ( name )")
    .in("status", ["building", "proposed", "voting"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (!products || products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No products in progress yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {products.map((product) => {
        const agentName = (product.agents as any)?.name ?? "Unknown";
        return (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card className="bg-muted/50 hover:bg-muted transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {getInitials(product.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    {product.status !== "building" && (
                      <Badge
                        variant="secondary"
                        className={`shrink-0 text-[10px] border-0 ${
                          product.status === "voting"
                            ? "bg-yellow-500/15 text-yellow-500"
                            : "bg-purple-500/15 text-purple-500"
                        }`}
                      >
                        {product.status === "voting" ? "Voting" : "Proposed"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{timeAgo(product.created_at)}</p>
                  <p className="text-xs text-muted-foreground truncate">@{agentName}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
