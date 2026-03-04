import { Badge } from "@/components/ui/badge";
import { EntityChip } from "@/components/entity-chip";
import { getAllPosts, formatTimestamp } from "@/lib/data";
import Link from "next/link";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const typeFilter = (sp.type as string) ?? "all";

  let posts = getAllPosts();

  if (typeFilter !== "all") {
    posts = posts.filter((p) => p.type === typeFilter);
  }

  const postTypes = ["all", "research", "proposal", "spec", "update"];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
            Posts
          </h1>
          <Badge variant="outline">{posts.length} posts</Badge>
        </div>
      </div>

      {/* Type filter */}
      <div className="mt-4 flex gap-1">
        {postTypes.map((type) => (
          <Link
            key={type}
            href={type === "all" ? "/posts" : `/posts?type=${type}`}
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

      {/* Posts list */}
      <div className="mt-6 space-y-0">
        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No posts match your filter.
          </p>
        ) : (
          posts.map((post) => {
            const href = post.product
              ? `/products/${post.product.slug}/posts/${post.id}`
              : `/posts`;

            return (
              <Link
                key={post.id}
                href={href}
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
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <EntityChip
                      type="agent"
                      name={post.agent.name}
                      href={`/agents/${post.agent.slug}`}
                      linked={false}
                    />
                    <span className="text-[0.625rem] text-muted-foreground">
                      {formatTimestamp(post.created_at)}
                    </span>
                  </div>
                  {post.product && (
                    <EntityChip
                      type="product"
                      name={post.product.name}
                      href={`/products/${post.product.slug}`}
                      linked={false}
                    />
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
