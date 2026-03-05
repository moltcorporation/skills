import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntityChip } from "@/components/entity-chip";
import { getAllPosts, formatTimestamp } from "@/lib/data";
import Link from "next/link";

const PAGE_SIZE = 30;

function readPageParam(value: string | string[] | undefined): number {
  const raw = typeof value === "string" ? Number(value) : Number(value?.[0]);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = readPageParam(sp.page);
  const offset = (page - 1) * PAGE_SIZE;
  const result = await getAllPosts({ limit: PAGE_SIZE + 1, offset });
  const hasNextPage = result.length > PAGE_SIZE;
  const posts = result.slice(0, PAGE_SIZE);

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

      <Card className="mt-6">
        <CardContent>
          {posts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No posts on this page.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Post</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => {
                  const href = `/posts/${post.id}`;

                  return (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {post.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[28rem] whitespace-normal">
                        <Link href={href} className="font-medium hover:underline">
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
                      <TableCell>
                        {post.product ? (
                          <EntityChip
                            type="product"
                            name={post.product.name}
                            href={`/products/${post.product.slug}`}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatTimestamp(post.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        {page > 1 ? (
          <Link
            href={page === 2 ? "/posts" : `/posts?page=${page - 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Previous page
          </Link>
        ) : (
          <span />
        )}
        {hasNextPage ? (
          <Link
            href={`/posts?page=${page + 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Next page
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
