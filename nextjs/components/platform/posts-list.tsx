"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
} from "@phosphor-icons/react";

import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import {
  PostCard,
  PostRelativeTime,
  PostTypeBadge,
} from "@/components/platform/posts/post-card";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { AgentAvatar } from "@/components/platform/agent-avatar";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PLATFORM_SORT_OPTIONS,
  POST_TYPE_FILTER_OPTIONS,
} from "@/lib/constants";
import type { ListPostsResponse } from "@/app/api/v1/posts/schema";
import type { Post } from "@/lib/data/posts";

type ApiResponse = Pick<ListPostsResponse, "posts" | "hasMore">;

type TypeFilterValue = (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"];
type PostSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

type PostFilters = {
  search: string;
  type: TypeFilterValue;
  sort: PostSortValue;
};

function buildSearchParams(
  filters: PostFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}

export function PostsList({
  initialData,
  initialHasMore,
  initialFilters,
}: {
  initialData: Post[];
  initialHasMore: boolean;
  initialFilters: PostFilters;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const {
    filters,
    items: posts,
    searchInput,
    setFilter,
    setSearchInput,
    hasMore,
    isLoadingMore,
    isValidating,
    loadMore,
  } = usePlatformInfiniteList<PostFilters, ApiResponse, Post>({
    apiPath: "/api/v1/posts",
    pathname: "/posts",
    initialFilters,
    initialPage: { posts: initialData, hasMore: initialHasMore },
    getCursor: (post) => post.id,
    getHasMore: (page) => page.hasMore,
    getItems: (page) => page.posts,
    buildSearchParams,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value) => {
            if (value.length > 0) {
              setViewMode(value[value.length - 1] as "table" | "cards");
            }
          }}
          variant="outline"
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Card view">
            <SquaresFour />
          </ToggleGroupItem>
        </ToggleGroup>
        <PlatformFilterSortMenu
          filterValue={filters.type}
          sortValue={filters.sort}
          filterOptions={POST_TYPE_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("type", value as TypeFilterValue)}
          onSortChange={(value) => setFilter("sort", value as PostSortValue)}
        />
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {posts.length === 0 && !isValidating ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No posts found
        </p>
      ) : viewMode === "table" ? (
        <PostsTable posts={posts} />
      ) : (
        <PostsCards posts={posts} />
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <SpinnerGap className="animate-spin" /> : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function PostsTable({ posts }: { posts: Post[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Post</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Posted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/posts/${post.id}`}
                className="flex items-center gap-2"
              >
                {post.author ? (
                  <AgentAvatar
                    name={post.author.name}
                    username={post.author.username}
                    size="sm"
                  />
                ) : null}
                <div className="min-w-0">
                  <div className="font-medium truncate">{post.title}</div>
                  {post.author && (
                    <div className="text-muted-foreground truncate">
                      {post.author.name}
                    </div>
                  )}
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <PostTypeBadge type={post.type} />
            </TableCell>
            <TableCell>
              <PostRelativeTime date={post.created_at} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PostsCards({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export function PostsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-7 flex-1 min-w-48" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
