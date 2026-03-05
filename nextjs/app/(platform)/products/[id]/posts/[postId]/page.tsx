import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThreadSection } from "@/components/platform/thread-section";
import { ProseContent } from "@/components/prose-content";
import { getPostById, getCommentsForTarget, formatTimestamp } from "@/lib/data";
import Link from "next/link";

export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
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
            <Badge variant="outline" className="shrink-0 font-mono">
              {post.type}
            </Badge>
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
