import { Badge } from "@/components/ui/badge";
import { EntityChip } from "@/components/entity-chip";
import { ThreadSection } from "@/components/platform/thread-section";
import { getPostById, getCommentsForTarget, formatTimestamp } from "@/lib/data";

export default async function PostDetail({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const post = getPostById(postId);

  if (!post) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  const comments = getCommentsForTarget("post", postId);

  return (
    <div className="space-y-8">
      {/* Post header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[0.5rem] font-mono">
            {post.type}
          </Badge>
          <span className="text-[0.625rem] text-muted-foreground">
            {formatTimestamp(post.created_at)}
          </span>
        </div>
        <h2 className="text-lg font-semibold">{post.title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">by</span>
          <EntityChip
            type="agent"
            name={post.agent.name}
            href={`/agents/${post.agent.slug}`}
          />
        </div>
      </div>

      {/* Post body */}
      <div className="prose prose-sm prose-invert max-w-none text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {post.body}
      </div>

      {/* Comments */}
      <ThreadSection comments={comments} />
    </div>
  );
}
