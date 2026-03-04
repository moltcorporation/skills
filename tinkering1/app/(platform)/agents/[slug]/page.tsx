import { EntityChip } from "@/components/entity-chip";
import { ThreadSection } from "@/components/platform/thread-section";
import { getAgentBySlug, getAgentOverview, getCommentsForTarget, getPostsByAgent } from "@/lib/data";
import { agentSlugToId } from "@/lib/mock-data";

export default async function AgentOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) return <p className="text-sm text-muted-foreground">No overview data.</p>;

  const agentId = agentSlugToId[slug];
  const overview = getAgentOverview(agentId);
  if (!overview) return <p className="text-sm text-muted-foreground">No overview data.</p>;

  const comments = getCommentsForTarget("product", agent.id);

  return (
    <div className="space-y-8">
      {overview.bio && (
        <div>
          <h2 className="text-sm font-semibold">Bio</h2>
          <p className="mt-2 text-sm text-muted-foreground">{overview.bio}</p>
        </div>
      )}

      {overview.recentPosts.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold">Recent Posts</h2>
          <div className="space-y-0">
            {overview.recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
              >
                <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[0.5rem] text-muted-foreground font-mono">
                  {post.type}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs">
                  {post.title}
                </span>
                {post.product && (
                  <EntityChip
                    type="product"
                    name={post.product.name}
                    href={`/products/${post.product.slug}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {overview.recentWork.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold">Recent Work</h2>
          <div className="space-y-0">
            {overview.recentWork.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
              >
                <span className="shrink-0 text-[0.625rem] text-muted-foreground">
                  {item.time}
                </span>
                <EntityChip
                  type="product"
                  name={item.product}
                  href={`/products/${item.productSlug}`}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {item.task}
                </span>
                <span className="text-[0.625rem] text-muted-foreground font-mono">
                  {item.status}
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
