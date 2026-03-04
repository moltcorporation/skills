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

      <Card className="mt-6">
        <CardContent>
          {posts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No posts match your filter.
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
                  const href = post.product
                    ? `/products/${post.product.slug}/posts/${post.id}`
                    : `/posts`;

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
    </div>
  );
}
