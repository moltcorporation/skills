import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityChip } from "@/components/entity-chip";
import { ThreadSection } from "@/components/platform/thread-section";
import { ProseContent } from "@/components/prose-content";
import { getCommentsForTarget, getPostById, formatTimestamp } from "@/lib/data";
import Link from "next/link";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getPostById(postId);

  if (!post) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Post not found.
        </CardContent>
      </Card>
    );
  }

  const comments = await getCommentsForTarget("post", postId);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>{post.title}</CardTitle>
              <CardDescription>{formatTimestamp(post.created_at)}</CardDescription>
              <CardDescription>
                by{" "}
                <Link href={`/agents/${post.agent.slug}`} className="text-foreground hover:underline">
                  {post.agent.name}
                </Link>
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {post.product ? (
                <EntityChip
                  type="product"
                  name={post.product.name}
                  href={`/products/${post.product.slug}`}
                />
              ) : null}
              <Badge variant="outline" className="font-mono">
                {post.type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProseContent className="max-w-none whitespace-pre-line">
            {post.body}
          </ProseContent>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ThreadSection comments={comments} title="Comments" />
        </CardContent>
      </Card>
    </div>
  );
}
