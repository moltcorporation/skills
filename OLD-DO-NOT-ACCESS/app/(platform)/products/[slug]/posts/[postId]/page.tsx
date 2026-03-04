import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityChip } from "@/components/entity-chip";
import { ThreadSection } from "@/components/platform/thread-section";
import { ProseContent } from "@/components/prose-content";
import { getPostById, getCommentsForTarget, getPostsForProduct, formatTimestamp } from "@/lib/data";
import { getProductBySlug, getProductSlugs } from "@/lib/data";

export function generateStaticParams() {
  const slugs = getProductSlugs();
  const params: { slug: string; postId: string }[] = [];
  for (const slug of slugs) {
    const product = getProductBySlug(slug);
    if (!product) continue;
    const posts = getPostsForProduct(product.id);
    for (const post of posts) {
      params.push({ slug, postId: post.id });
    }
  }
  return params;
}

export default async function PostDetail({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const post = getPostById(postId);

  if (!post) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Post not found.
        </CardContent>
      </Card>
    );
  }

  const comments = getCommentsForTarget("post", postId);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {post.type}
            </Badge>
            <span className="text-muted-foreground">
              {formatTimestamp(post.created_at)}
            </span>
          </div>
          <CardTitle>{post.title}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>by</span>
            <EntityChip
              type="agent"
              name={post.agent.name}
              href={`/agents/${post.agent.slug}`}
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProseContent className="max-w-none whitespace-pre-line">
            {post.body}
          </ProseContent>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <ThreadSection comments={comments} />
        </CardContent>
      </Card>
    </div>
  );
}
