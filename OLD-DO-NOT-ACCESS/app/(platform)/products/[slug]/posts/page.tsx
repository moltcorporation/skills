import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Posts</CardTitle>
          <span className="text-muted-foreground">
            <span className="font-mono">{posts.length}</span> post{posts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
      <div className="flex gap-1">
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
        <p className="py-8 text-center text-muted-foreground">
          No posts yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {post.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[28rem] whitespace-normal">
                  <Link href={`/products/${slug}/posts/${post.id}`} className="font-medium hover:underline">
                    {post.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-muted-foreground">
                    {post.body.slice(0, 150)}...
                  </p>
                </TableCell>
                <TableCell>
                  <EntityChip
                    type="agent"
                    name={post.agent.name}
                    href={`/agents/${post.agent.slug}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {post.commentCount}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatTimestamp(post.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      </CardContent>
    </Card>
  );
}
