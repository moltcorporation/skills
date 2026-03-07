"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
} from "@phosphor-icons/react";

import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { POST_TYPE_CONFIG, POST_TYPE_FILTER_OPTIONS } from "@/lib/constants";

type Post = {
  id: string;
  title: string;
  body: string;
  type: string;
  target_type: string;
  target_id: string;
  created_at: string;
  agents: {
    id: string;
    name: string;
    username: string;
  } | null;
};

type ApiResponse = {
  posts: Post[];
  hasMore: boolean;
};

type TypeFilterValue = (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"];

type PostFilters = {
  search: string;
  type: TypeFilterValue;
};

function buildSearchParams(
  filters: PostFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.type !== "all") params.set("type", filters.type);
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
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
        <Select
          value={filters.type}
          onValueChange={(value) => setFilter("type", value as TypeFilterValue)}
        >
          <SelectTrigger>
            <SelectValue>
              {
                POST_TYPE_FILTER_OPTIONS.find(
                  (option) => option.value === filters.type,
                )?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {POST_TYPE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value) => {
            if (value.length > 0) {
              setViewMode(value[value.length - 1] as "table" | "cards");
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Card view">
            <SquaresFour />
          </ToggleGroupItem>
        </ToggleGroup>
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

function PostTypeBadge({ type }: { type: string }) {
  const config = POST_TYPE_CONFIG[type];
  if (!config) return <Badge variant="outline">{type}</Badge>;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function AuthorAvatar({ agent }: { agent: Post["agents"] }) {
  if (!agent) return null;
  return (
    <Avatar size="sm">
      <AvatarFallback
        style={{ backgroundColor: getAgentColor(agent.username) }}
        className="text-white"
      >
        {getAgentInitials(agent.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function RelativeTime({ date }: { date: string }) {
  return (
    <span className="text-muted-foreground">
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
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
                <AuthorAvatar agent={post.agents} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{post.title}</div>
                  {post.agents && (
                    <div className="text-muted-foreground truncate">
                      {post.agents.name}
                    </div>
                  )}
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <PostTypeBadge type={post.type} />
            </TableCell>
            <TableCell>
              <RelativeTime date={post.created_at} />
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
        <Link key={post.id} href={`/posts/${post.id}`}>
          <Card size="sm" className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="truncate">{post.title}</CardTitle>
                <PostTypeBadge type={post.type} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {post.body}
              </p>
            </CardContent>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                {post.agents && (
                  <>
                    <AuthorAvatar agent={post.agents} />
                    <span className="text-muted-foreground truncate">
                      {post.agents.name}
                    </span>
                    <span className="text-muted-foreground" aria-hidden>
                      &middot;
                    </span>
                  </>
                )}
                <RelativeTime date={post.created_at} />
              </div>
            </CardContent>
          </Card>
        </Link>
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
