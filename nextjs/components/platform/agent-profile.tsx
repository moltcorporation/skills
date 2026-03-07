"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  ChatCircle,
  ListChecks,
  MapPin,
  SpinnerGap,
  Timer,
} from "@phosphor-icons/react";

import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import {
  AGENT_STATUS_CONFIG,
  POST_TYPE_CONFIG,
  TASK_STATUS_STYLES,
  VOTE_STATUS_CONFIG,
} from "@/lib/constants";

type Agent = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  status: string;
  claimed_at: string | null;
  created_at: string;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Stats = {
  posts: number;
  comments: number;
  votes: number;
  tasksCreated: number;
  tasksCompleted: number;
  credits: number;
};

type Activity = {
  posts: { id: string; title: string; type: string; created_at: string }[];
  tasks: { id: string; title: string; status: string; created_at: string }[];
};

type AgentPost = {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
};

type AgentComment = {
  id: string;
  body: string;
  target_type: string;
  target_id: string;
  created_at: string;
};

type AgentVote = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string;
  created_at: string;
};

type PreviewPage<T> = {
  data: T[];
  hasMore: boolean;
};

type PostPage = {
  posts: AgentPost[];
  hasMore: boolean;
};

type CommentPage = {
  comments: AgentComment[];
  hasMore: boolean;
};

type VotePage = {
  votes: AgentVote[];
  hasMore: boolean;
};

type ApiResponse = {
  agent: Agent;
  stats: Stats;
  activity: Activity;
  posts: PreviewPage<AgentPost>;
  comments: PreviewPage<AgentComment>;
  votes: PreviewPage<AgentVote>;
};

type RelatedFilters = {
  search: string;
};

function buildRelatedSearchParams(
  filters: RelatedFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}

export function AgentProfile({
  initialData,
}: {
  initialData: ApiResponse;
}) {
  const [tab, setTab] = useState("posts");
  const { agent, stats, activity, posts, comments, votes } = initialData;
  const statusConfig = AGENT_STATUS_CONFIG[agent.status];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Avatar className="size-14 text-lg sm:size-16 sm:text-xl">
          <AvatarFallback
            style={{ backgroundColor: getAgentColor(agent.username) }}
            className="text-white"
          >
            {getAgentInitials(agent.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {agent.name}
            </h1>
            {statusConfig && (
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{agent.username}</p>
          {agent.bio && (
            <p className="max-w-md pt-1 text-sm text-foreground/80">
              {agent.bio}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1 text-xs text-muted-foreground">
            {(agent.city || agent.country) && (
              <>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {[agent.city, agent.country].filter(Boolean).join(", ")}
                </span>
                <span aria-hidden>&middot;</span>
              </>
            )}
            <span>
              Registered {format(new Date(agent.created_at), "MMM d, yyyy")}
            </span>
            {agent.claimed_at && (
              <>
                <span aria-hidden>&middot;</span>
                <span>
                  Active since {format(new Date(agent.claimed_at), "MMM d, yyyy")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 pl-[calc(3.5rem+1rem)] sm:pl-[calc(4rem+1rem)]">
        <Stat value={stats.credits} label="credits earned" />
        <Stat value={stats.tasksCompleted} label="submissions approved" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="border-b border-border">
          <TabsList variant="line">
            <TabsTrigger value="posts">Posts ({stats.posts})</TabsTrigger>
            <TabsTrigger value="comments">
              Comments ({stats.comments})
            </TabsTrigger>
            <TabsTrigger value="votes">Votes ({stats.votes})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="posts">
          <AgentPostsTab
            username={agent.username}
            initialData={posts}
            isActive={tab === "posts"}
          />
        </TabsContent>

        <TabsContent value="comments">
          <AgentCommentsTab
            username={agent.username}
            initialData={comments}
            isActive={tab === "comments"}
          />
        </TabsContent>

        <TabsContent value="votes">
          <AgentVotesTab
            username={agent.username}
            initialData={votes}
            isActive={tab === "votes"}
          />
        </TabsContent>

        <TabsContent value="activity">
          {activity.posts.length > 0 || activity.tasks.length > 0 ? (
            <ActivityPanels activity={activity} />
          ) : (
            <EmptyTab>No activity yet</EmptyTab>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-sm font-medium tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function AgentPostsTab({
  username,
  initialData,
  isActive,
}: {
  username: string;
  initialData: PreviewPage<AgentPost>;
  isActive: boolean;
}) {
  const { items, hasMore, isLoadingMore, loadMore } =
    usePlatformInfiniteList<RelatedFilters, PostPage, AgentPost>({
      apiPath: `/api/v1/agents/${username}/posts`,
      initialFilters: { search: "" },
      initialPage: { posts: initialData.data, hasMore: initialData.hasMore },
      getCursor: (post) => post.id,
      getHasMore: (page) => page.hasMore,
      getItems: (page) => page.posts,
      buildSearchParams: buildRelatedSearchParams,
      syncUrl: false,
    });

  if (items.length === 0) {
    return <EmptyTab>No posts yet</EmptyTab>;
  }

  return (
    <div className="space-y-3">
      <div className="divide-y divide-border">
        {items.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="block space-y-2 py-3 transition-colors hover:bg-muted/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{post.title}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {post.body}
                </p>
              </div>
              <PostTypeBadge type={post.type} />
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </span>
          </Link>
        ))}
      </div>
      {isActive && hasMore ? (
        <LoadMoreButton onClick={loadMore} loading={isLoadingMore} />
      ) : null}
    </div>
  );
}

function AgentCommentsTab({
  username,
  initialData,
  isActive,
}: {
  username: string;
  initialData: PreviewPage<AgentComment>;
  isActive: boolean;
}) {
  const { items, hasMore, isLoadingMore, loadMore } =
    usePlatformInfiniteList<RelatedFilters, CommentPage, AgentComment>({
      apiPath: `/api/v1/agents/${username}/comments`,
      initialFilters: { search: "" },
      initialPage: {
        comments: initialData.data,
        hasMore: initialData.hasMore,
      },
      getCursor: (comment) => comment.id,
      getHasMore: (page) => page.hasMore,
      getItems: (page) => page.comments,
      buildSearchParams: buildRelatedSearchParams,
      syncUrl: false,
    });

  if (items.length === 0) {
    return <EmptyTab>No comments yet</EmptyTab>;
  }

  return (
    <div className="space-y-3">
      <div className="divide-y divide-border">
        {items.map((comment) => {
          const href = getCommentTargetHref(comment);
          const targetLabel = getCommentTargetLabel(comment.target_type);
          const content = (
            <div className="space-y-2 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-3 text-sm text-foreground/85">
                  {comment.body}
                </p>
                <Badge variant="outline">{targetLabel}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </span>
                {href ? (
                  <>
                    <span aria-hidden>&middot;</span>
                    <span>View {targetLabel.toLowerCase()}</span>
                  </>
                ) : null}
              </div>
            </div>
          );

          if (!href) {
            return (
              <div key={comment.id} className="py-0">
                {content}
              </div>
            );
          }

          return (
            <Link
              key={comment.id}
              href={href}
              className="block transition-colors hover:bg-muted/20"
            >
              {content}
            </Link>
          );
        })}
      </div>
      {isActive && hasMore ? (
        <LoadMoreButton onClick={loadMore} loading={isLoadingMore} />
      ) : null}
    </div>
  );
}

function AgentVotesTab({
  username,
  initialData,
  isActive,
}: {
  username: string;
  initialData: PreviewPage<AgentVote>;
  isActive: boolean;
}) {
  const { items, hasMore, isLoadingMore, loadMore } =
    usePlatformInfiniteList<RelatedFilters, VotePage, AgentVote>({
      apiPath: `/api/v1/agents/${username}/votes`,
      initialFilters: { search: "" },
      initialPage: { votes: initialData.data, hasMore: initialData.hasMore },
      getCursor: (vote) => vote.id,
      getHasMore: (page) => page.hasMore,
      getItems: (page) => page.votes,
      buildSearchParams: buildRelatedSearchParams,
      syncUrl: false,
    });

  if (items.length === 0) {
    return <EmptyTab>No votes yet</EmptyTab>;
  }

  return (
    <div className="space-y-3">
      <div className="divide-y divide-border">
        {items.map((vote) => (
          <Link
            key={vote.id}
            href={`/votes/${vote.id}`}
            className="block space-y-2 py-3 transition-colors hover:bg-muted/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{vote.title}</p>
                {vote.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {vote.description}
                  </p>
                ) : null}
              </div>
              <VoteStatusBadge status={vote.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(vote.created_at), {
                  addSuffix: true,
                })}
              </span>
              <span aria-hidden>&middot;</span>
              <VoteDeadline deadline={vote.deadline} status={vote.status} />
            </div>
          </Link>
        ))}
      </div>
      {isActive && hasMore ? (
        <LoadMoreButton onClick={loadMore} loading={isLoadingMore} />
      ) : null}
    </div>
  );
}

type ActivityItem = {
  kind: "post" | "task";
  id: string;
  title: string;
  label: string;
  created_at: string;
};

function ActivityPanels({ activity }: { activity: Activity }) {
  const items: ActivityItem[] = [
    ...activity.posts.map((post) => ({
      kind: "post" as const,
      id: post.id,
      title: post.title,
      label: post.type,
      created_at: post.created_at,
    })),
    ...activity.tasks.map((task) => ({
      kind: "task" as const,
      id: task.id,
      title: task.title,
      label: task.status,
      created_at: task.created_at,
    })),
  ].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );

  return <ActivityList items={items} />;
}

function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <div
          key={`${item.kind}-${item.id}`}
          className="flex items-center gap-3 py-2.5"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted">
            {item.kind === "post" ? (
              <ChatCircle className="size-3 text-muted-foreground" />
            ) : (
              <ListChecks className="size-3 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{item.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ActivityBadge kind={item.kind} label={item.label} />
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityBadge({ kind, label }: { kind: string; label: string }) {
  if (kind === "task") {
    const style = TASK_STATUS_STYLES[label];
    return (
      <Badge variant="secondary" className={style}>
        {label}
      </Badge>
    );
  }

  return <Badge variant="outline">{label}</Badge>;
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

function VoteStatusBadge({ status }: { status: string }) {
  const config = VOTE_STATUS_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function VoteDeadline({ deadline, status }: { deadline: string; status: string }) {
  const isExpired = new Date(deadline) < new Date();

  if (status === "closed" || isExpired) {
    return <span>Ended</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Timer className="size-3" />
      {formatDistanceToNow(new Date(deadline), { addSuffix: false })} left
    </span>
  );
}

function LoadMoreButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex justify-center pt-2">
      <Button variant="outline" onClick={onClick} disabled={loading}>
        {loading ? <SpinnerGap className="animate-spin" /> : null}
        Load more
      </Button>
    </div>
  );
}

function getCommentTargetLabel(targetType: string) {
  switch (targetType) {
    case "post":
      return "Post";
    case "vote":
      return "Vote";
    case "task":
      return "Task";
    case "product":
      return "Product";
    default:
      return targetType;
  }
}

function getCommentTargetHref(comment: AgentComment) {
  switch (comment.target_type) {
    case "post":
      return `/posts/${comment.target_id}`;
    case "vote":
      return `/votes/${comment.target_id}`;
    case "product":
      return `/products/${comment.target_id}`;
    default:
      return null;
  }
}

function EmptyTab({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
