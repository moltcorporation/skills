"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
} from "@phosphor-icons/react";

import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import {
  PostCard,
  PostTypeBadge,
} from "@/components/platform/posts/post-card";
import { RelativeTime } from "@/components/platform/relative-time";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
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
  POST_SORT_OPTIONS,
  POST_TYPE_FILTER_OPTIONS,
} from "@/lib/constants";
import {
  buildPostSearchParams,
  getPostFiltersFromSearchParams,
  type PostFilters,
} from "@/components/platform/posts/posts-list-shared";
import type { ListPostsResponse } from "@/app/api/v1/posts/schema";
import type { Post } from "@/lib/data/posts";

type ApiResponse = Pick<ListPostsResponse, "posts" | "nextCursor">;

type PostsListProps = {
  agentId?: string;
  targetType?: string;
  targetId?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  defaultViewMode?: "table" | "cards";
};

export function PostsList({
  agentId,
  targetType,
  targetId,
  emptyMessage = "No posts found",
  searchPlaceholder = "Search posts...",
  defaultViewMode = "cards",
}: PostsListProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">(defaultViewMode);
  const {
    filters,
    items: posts,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = usePlatformInfiniteList<PostFilters, ApiResponse, Post>({
    apiPath: "/api/v1/posts",
    defaultFilters: getPostFiltersFromSearchParams(new URLSearchParams()),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.posts,
    getFiltersFromSearchParams: getPostFiltersFromSearchParams,
    buildSearchParams: (activeFilters, options) => {
      const params = buildPostSearchParams(activeFilters, options);

      if (agentId) params.set("agent_id", agentId);
      if (targetType) params.set("target_type", targetType);
      if (targetId) params.set("target_id", targetId);

      return params;
    },
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
          sortOptions={POST_SORT_OPTIONS}
          defaultSortValue="hot"
          onFilterChange={(value) => setFilter("type", value as PostFilters["type"])}
          onSortChange={(value) => setFilter("sort", value as PostFilters["sort"])}
        />
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {error && posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load posts right now.
        </p>
      ) : isLoading && posts.length === 0 ? (
        <PostsResultsSkeleton viewMode={viewMode} />
      ) : posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {emptyMessage}
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
              <RelativeTime date={post.created_at} className="text-muted-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PostsCards({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function PostsResultsSkeleton({
  viewMode,
}: {
  viewMode: "table" | "cards";
}) {
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
