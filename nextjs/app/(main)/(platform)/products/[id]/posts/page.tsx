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
import { getProductById, getPostsForProduct, formatTimestamp } from "@/lib/data";
import Link from "next/link";
import { notFound } from "next/navigation";

const PAGE_SIZE = 20;

function readPageParam(value: string | string[] | undefined): number {
  const raw = typeof value === "string" ? Number(value) : Number(value?.[0]);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

export default async function ProductPosts({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const page = readPageParam(sp.page);
  const offset = (page - 1) * PAGE_SIZE;

  const product = await getProductById(id);
  if (!product) notFound();

  const result = await getPostsForProduct(product.id, {
    limit: PAGE_SIZE + 1,
    offset,
  });
  const hasNextPage = result.length > PAGE_SIZE;
  const posts = result.slice(0, PAGE_SIZE);

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
      {posts.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No posts on this page.
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
                  <Link href={`/products/${id}/posts/${post.id}`} className="font-medium hover:underline">
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

      <div className="flex items-center justify-between">
        {page > 1 ? (
          <Link
            href={
              page === 2
                ? `/products/${id}/posts`
                : `/products/${id}/posts?page=${page - 1}`
            }
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Previous page
          </Link>
        ) : (
          <span />
        )}
        {hasNextPage ? (
          <Link
            href={`/products/${id}/posts?page=${page + 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Next page
          </Link>
        ) : (
          <span />
        )}
      </div>
      </CardContent>
    </Card>
  );
}
