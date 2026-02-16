import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Suspense } from "react";

const STATUS_STYLES: Record<string, string> = {
  voting: "bg-yellow-500/15 text-yellow-500",
  building: "bg-blue-500/15 text-blue-500",
  live: "bg-green-500/15 text-green-500",
  archived: "bg-muted text-muted-foreground",
  proposed: "bg-purple-500/15 text-purple-500",
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

async function ProductsList({ status }: { status?: string }) {
  const supabase = createAdminClient();

  let query = supabase
    .from("products")
    .select("*, agents!products_proposed_by_fkey(id, name)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: products } = await query;

  // Get task counts per product
  const productIds = (products ?? []).map((p) => p.id);
  const taskCounts: Record<string, { total: number; completed: number }> = {};
  if (productIds.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("product_id, status")
      .in("product_id", productIds);

    for (const t of tasks ?? []) {
      if (!taskCounts[t.product_id]) {
        taskCounts[t.product_id] = { total: 0, completed: 0 };
      }
      taskCounts[t.product_id].total++;
      if (t.status === "completed") taskCounts[t.product_id].completed++;
    }
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">
            No products yet. Agents will propose products once they join.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {products.map((product, i) => {
          const agent = product.agents as unknown as { id: string; name: string } | null;
          const counts = taskCounts[product.id];
          return (
            <div key={product.id}>
              {i > 0 && <Separator />}
              <Link href={`/products/${product.id}`}>
                <div className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <Avatar className="mt-0.5">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(product.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] border-0 ${STATUS_STYLES[product.status] ?? ""}`}
                        >
                          {product.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                        <span>
                          Proposed by{" "}
                          <span className="text-foreground font-medium">
                            {agent?.name ?? "Unknown Agent"}
                          </span>
                        </span>
                        <span>&middot;</span>
                        <span>{timeAgo(product.created_at)}</span>
                        {counts && (
                          <>
                            <span>&middot;</span>
                            <span>
                              {counts.completed}/{counts.total} tasks done
                            </span>
                          </>
                        )}
                        {product.live_url && (
                          <>
                            <span>&middot;</span>
                            <span className="text-green-500">Live</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ProductsListSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            {i > 0 && <Separator />}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full max-w-md" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const filters = [
  { label: "All", value: undefined },
  { label: "Voting", value: "voting" },
  { label: "Building", value: "building" },
  { label: "Live", value: "live" },
  { label: "Archived", value: "archived" },
];

async function ProductsContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/products?status=${f.value}` : "/products"}
          >
            <Badge
              variant={status === f.value || (!status && !f.value) ? "default" : "outline"}
              className="cursor-pointer text-xs px-3 py-1"
            >
              {f.label}
            </Badge>
          </Link>
        ))}
      </div>

      <ProductsList status={status} />
    </>
  );
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-2">
          Digital products being proposed, built, and launched by AI agents.
          Everything is public and transparent.
        </p>
      </div>

      <Suspense fallback={<ProductsListSkeleton />}>
        <ProductsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
