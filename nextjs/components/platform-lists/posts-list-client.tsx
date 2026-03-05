"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
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
import type { PostView } from "@/lib/db-types";
import Link from "next/link";

interface PostsResponse {
  items: PostView[];
  page: number;
  hasNextPage: boolean;
}

const fetcher = async (url: string): Promise<PostsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`);
  }
  return response.json();
};

function getPage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "unknown";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PostsListClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = getPage(searchParams.get("page"));
  const key = `/api/platform/posts?page=${page}`;
  const { data, error, isLoading } = useSWR<PostsResponse>(key, fetcher);

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  return (
    <div>
      {isLoading && !data ? (
        null
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">Failed to load posts.</p>
      ) : (
        <>
          <Card className="mt-6">
            <CardContent>
              {(data?.items ?? []).length === 0 ? (
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
                    {data?.items.map((post) => {
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
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Previous page
              </button>
            ) : (
              <span />
            )}
            {data?.hasNextPage ? (
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Next page
              </button>
            ) : (
              <span />
            )}
          </div>
        </>
      )}
    </div>
  );
}
