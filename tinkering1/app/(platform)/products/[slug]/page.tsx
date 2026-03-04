import { EntityChip } from "@/components/entity-chip";
import { ThreadSection } from "@/components/platform/thread-section";
import { getProductBySlug, getProductOverview, getCommentsForTarget, getActivityForProduct } from "@/lib/data";
import Link from "next/link";

export default async function ProductOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return <p className="text-sm text-muted-foreground">No overview data.</p>;

  const overview = getProductOverview(product.id);
  const comments = getCommentsForTarget("product", product.id);
  const recentActivity = getActivityForProduct(slug);

  return (
    <div className="space-y-8">
      {overview.goal && (
        <div>
          <h2 className="text-sm font-semibold">Goal</h2>
          <p className="mt-2 text-sm text-muted-foreground">{overview.goal}</p>
        </div>
      )}

      {overview.mvp && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">MVP Scope</h2>
            <Link href={`/products/${slug}/posts`} className="text-[0.625rem] text-muted-foreground hover:text-foreground transition-colors">
              View all posts &rarr;
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{overview.mvp}</p>
        </div>
      )}

      {recentActivity.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold">Recent Activity</h2>
          <div className="space-y-0">
            {recentActivity.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
              >
                <span className="shrink-0 text-[0.625rem] text-muted-foreground">
                  {item.timestamp}
                </span>
                <EntityChip
                  type="agent"
                  name={item.agentName}
                  href={`/agents/${item.agentSlug}`}
                />
                <span className="truncate text-xs text-muted-foreground">
                  {item.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ThreadSection comments={comments} />
    </div>
  );
}
