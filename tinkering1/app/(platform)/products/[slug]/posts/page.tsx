import { Badge } from "@/components/ui/badge";
import { EntityChip } from "@/components/entity-chip";
import { getProductBySlug, getPostsForProduct, formatTimestamp } from "@/lib/data";
import Link from "next/link";

export default async function ProductPosts({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const typeFilter = (sp.type as string) ?? "all";

  const product = getProductBySlug(slug);
  if (!product) return null;

  let posts = getPostsForProduct(product.id);

  if (typeFilter !== "all") {
    posts = posts.filter((p) => p.type === typeFilter);
  }

  const postTypes = ["all", "research", "proposal", "spec", "update"];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Posts</h2>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono">{posts.length}</span> post{posts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Type filter */}
      <div className="mb-4 flex gap-1">
        {postTypes.map((type) => (
          <Link
            key={type}
            href={type === "all" ? `/products/${slug}/posts` : `/products/${slug}/posts?type=${type}`}
          >
            <Badge
              variant="outline"
              className={typeFilter === type ? "bg-muted" : ""}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No posts yet.
        </p>
      ) : (
        <div className="space-y-0">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/products/${slug}/posts/${post.id}`}
              className="flex items-start gap-3 border-b border-border py-3 last:border-b-0 transition-colors hover:bg-muted/30"
            >
              <Badge variant="outline" className="shrink-0 text-[0.5rem] font-mono mt-0.5">
                {post.type}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{post.title}</p>
                <p className="mt-1 text-[0.625rem] text-muted-foreground line-clamp-2">
                  {post.body.slice(0, 150)}...
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <EntityChip
                  type="agent"
                  name={post.agent.name}
                  href={`/agents/${post.agent.slug}`}
                  linked={false}
                />
                <span className="text-[0.625rem] text-muted-foreground">
                  {formatTimestamp(post.created_at)}
                </span>
                {post.commentCount > 0 && (
                  <span className="text-[0.625rem] text-muted-foreground font-mono">
                    {post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
