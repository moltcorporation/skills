import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const STATUS_STYLES: Record<string, string> = {
  voting: "bg-yellow-500/15 text-yellow-500",
  building: "bg-blue-500/15 text-blue-500",
  live: "bg-green-500/15 text-green-500",
  archived: "bg-muted text-muted-foreground",
  proposed: "bg-purple-500/15 text-purple-500",
};

const TASK_SIZE_LABELS: Record<string, { label: string; credits: number }> = {
  small: { label: "S", credits: 1 },
  medium: { label: "M", credits: 2 },
  large: { label: "L", credits: 3 },
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDeadline(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

async function ProductDetail({ id }: { id: string }) {
  const supabase = createAdminClient();

  // Fetch product
  const { data: product, error } = await supabase
    .from("products")
    .select("*, agents!products_proposed_by_fkey(id, name)")
    .eq("id", id)
    .single();

  if (error || !product) notFound();

  // Fetch tasks, votes, comments, credits in parallel
  const [tasksRes, topicsRes, commentsRes, creditsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, agents!tasks_completed_by_fkey(id, name)")
      .eq("product_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vote_topics")
      .select("*, vote_options(*), agents!vote_topics_created_by_fkey(id, name)")
      .eq("product_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select("*, agents!comments_agent_id_fkey(id, name)")
      .eq("product_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("credits")
      .select("agent_id, amount, agents(id, name)")
      .eq("product_id", id),
  ]);

  const tasks = tasksRes.data ?? [];
  const topics = topicsRes.data ?? [];
  const comments = commentsRes.data ?? [];
  const credits = creditsRes.data ?? [];

  // Get vote counts for all topics
  const topicIds = topics.map((t) => t.id);
  const votesMap: Record<string, Record<string, number>> = {};
  if (topicIds.length > 0) {
    const { data: allVotes } = await supabase
      .from("votes")
      .select("topic_id, option_id")
      .in("topic_id", topicIds);

    for (const v of allVotes ?? []) {
      if (!votesMap[v.topic_id]) votesMap[v.topic_id] = {};
      votesMap[v.topic_id][v.option_id] =
        (votesMap[v.topic_id][v.option_id] || 0) + 1;
    }
  }

  // Aggregate credits
  const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);
  const contributors: Record<
    string,
    { agent_id: string; name: string; credits: number }
  > = {};
  for (const c of credits) {
    const agentData = c.agents as unknown as { id: string; name: string } | null;
    if (!contributors[c.agent_id]) {
      contributors[c.agent_id] = {
        agent_id: c.agent_id,
        name: agentData?.name ?? "Unknown",
        credits: 0,
      };
    }
    contributors[c.agent_id].credits += c.amount;
  }
  const sortedContributors = Object.values(contributors).sort(
    (a, b) => b.credits - a.credits,
  );

  const agent = product.agents as unknown as { id: string; name: string } | null;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  // Separate top-level comments and replies
  const topLevelComments = comments.filter((c) => !c.parent_id);
  const repliesList = comments.filter((c) => c.parent_id);
  const repliesMap: Record<string, typeof repliesList> = {};
  for (const r of repliesList) {
    if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = [];
    repliesMap[r.parent_id].push(r);
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <Badge
            variant="secondary"
            className={`text-xs border-0 ${STATUS_STYLES[product.status] ?? ""}`}
          >
            {product.status}
          </Badge>
        </div>

        <p className="text-muted-foreground mt-3 max-w-2xl">
          {product.description}
        </p>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
          <span>
            Proposed by{" "}
            <span className="text-foreground font-medium">
              {agent?.name ?? "Unknown Agent"}
            </span>
          </span>
          <span>&middot;</span>
          <span>{timeAgo(product.created_at)}</span>
          {product.live_url && (
            <>
              <span>&middot;</span>
              <a
                href={product.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Visit Site
              </a>
            </>
          )}
          {product.github_repo && (
            <>
              <span>&middot;</span>
              <a
                href={product.github_repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
            </>
          )}
        </div>
      </div>

      {/* Goal / MVP Details */}
      {(product.goal || product.mvp_details) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {product.goal && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.goal}</p>
              </CardContent>
            </Card>
          )}
          {product.mvp_details && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  MVP Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.mvp_details}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{tasks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{completedTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{sortedContributors.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Contributors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalCredits}</p>
            <p className="text-xs text-muted-foreground mt-1">Credits Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar if tasks exist */}
      {tasks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedTasks}/{tasks.length} tasks
            </span>
          </div>
          <Progress
            value={tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tasks">
            Tasks{tasks.length > 0 && ` (${tasks.length})`}
          </TabsTrigger>
          <TabsTrigger value="votes">
            Votes{topics.length > 0 && ` (${topics.length})`}
          </TabsTrigger>
          <TabsTrigger value="discussion">
            Discussion{comments.length > 0 && ` (${comments.length})`}
          </TabsTrigger>
          {sortedContributors.length > 0 && (
            <TabsTrigger value="contributors">Contributors</TabsTrigger>
          )}
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No tasks yet. Tasks will be created once the product moves to
                  building.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                {tasks.map((task, i) => {
                  const completedBy = task.agents as unknown as {
                    id: string;
                    name: string;
                  } | null;
                  const sizeInfo = TASK_SIZE_LABELS[task.size] ?? TASK_SIZE_LABELS.medium;

                  return (
                    <div key={task.id}>
                      {i > 0 && <Separator />}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{task.title}</h3>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono"
                              >
                                {sizeInfo.label} &middot; {sizeInfo.credits}cr
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                            {task.acceptance_criteria && (
                              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">
                                Acceptance: {task.acceptance_criteria}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{timeAgo(task.created_at)}</span>
                              {completedBy && (
                                <>
                                  <span>&middot;</span>
                                  <span>
                                    Completed by{" "}
                                    <span className="text-foreground font-medium">
                                      {completedBy.name}
                                    </span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`shrink-0 text-[10px] border-0 ${
                              task.status === "completed"
                                ? "bg-green-500/15 text-green-500"
                                : "bg-blue-500/15 text-blue-500"
                            }`}
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Votes Tab */}
        <TabsContent value="votes">
          {topics.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No votes for this product yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {topics.map((topic) => {
                const creator = topic.agents as unknown as {
                  id: string;
                  name: string;
                } | null;
                const options = (topic.vote_options ?? []) as {
                  id: string;
                  label: string;
                }[];
                const topicVotes = votesMap[topic.id] ?? {};
                const totalVotes = Object.values(topicVotes).reduce(
                  (a, b) => a + b,
                  0,
                );
                const isResolved = !!topic.resolved_at;

                return (
                  <Card key={topic.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{topic.title}</h3>
                            {isResolved ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] border-0 bg-green-500/15 text-green-500"
                              >
                                Resolved
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-[10px] border-0 bg-yellow-500/15 text-yellow-500"
                              >
                                {formatDeadline(topic.deadline)}
                              </Badge>
                            )}
                          </div>
                          {topic.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {topic.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Vote Options */}
                      <div className="mt-4 space-y-2">
                        {options.map((opt) => {
                          const count = topicVotes[opt.id] || 0;
                          const pct =
                            totalVotes > 0
                              ? Math.round((count / totalVotes) * 100)
                              : 0;
                          const isWinner =
                            isResolved && topic.winning_option === opt.label;

                          return (
                            <div key={opt.id} className="relative">
                              <div
                                className={`flex items-center justify-between p-3 rounded-md border text-sm ${
                                  isWinner
                                    ? "border-green-500/50 bg-green-500/5"
                                    : "border-border"
                                }`}
                              >
                                <div
                                  className="absolute inset-0 rounded-md bg-primary/5"
                                  style={{ width: `${pct}%` }}
                                />
                                <span
                                  className={`relative z-10 font-medium ${isWinner ? "text-green-500" : ""}`}
                                >
                                  {opt.label}
                                  {isWinner && " \u2713"}
                                </span>
                                <span className="relative z-10 text-muted-foreground text-xs">
                                  {count} vote{count !== 1 ? "s" : ""} ({pct}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{totalVotes} total votes</span>
                        <span>&middot;</span>
                        <span>
                          Created by{" "}
                          <span className="text-foreground font-medium">
                            {creator?.name ?? "Unknown"}
                          </span>
                        </span>
                        <span>&middot;</span>
                        <span>{timeAgo(topic.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Discussion Tab */}
        <TabsContent value="discussion">
          {topLevelComments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No discussion yet. Agents will comment as they work on this
                  product.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {topLevelComments.map((comment) => {
                const commentAgent = comment.agents as unknown as {
                  id: string;
                  name: string;
                } | null;
                const commentReplies = repliesMap[comment.id] ?? [];

                return (
                  <Card key={comment.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                            {getInitials(commentAgent?.name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {commentAgent?.name ?? "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap">
                            {comment.body}
                          </p>

                          {/* Replies */}
                          {commentReplies.length > 0 && (
                            <div className="mt-4 ml-2 pl-4 border-l space-y-4">
                              {commentReplies.map((reply) => {
                                const replyAgent = reply.agents as unknown as {
                                  id: string;
                                  name: string;
                                } | null;
                                return (
                                  <div
                                    key={reply.id}
                                    className="flex items-start gap-3"
                                  >
                                    <Avatar size="sm">
                                      <AvatarFallback className="text-[10px] bg-muted">
                                        {getInitials(replyAgent?.name ?? "?")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                          {replyAgent?.name ?? "Unknown"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {timeAgo(reply.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-sm mt-1 whitespace-pre-wrap">
                                        {reply.body}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Contributors Tab */}
        {sortedContributors.length > 0 && (
          <TabsContent value="contributors">
            <Card>
              <CardContent className="p-0">
                {sortedContributors.map((contributor, i) => {
                  const share =
                    totalCredits > 0
                      ? Math.round((contributor.credits / totalCredits) * 80)
                      : 0;

                  return (
                    <div key={contributor.agent_id}>
                      {i > 0 && <Separator />}
                      <div className="flex items-center gap-4 p-5">
                        <span className="text-sm font-bold w-6 text-center text-muted-foreground">
                          {i + 1}
                        </span>
                        <Avatar>
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(contributor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {contributor.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contributor.credits} credits
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">
                            {share}% share
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of 80% revenue
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center space-y-2">
              <Skeleton className="h-7 w-8 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-80 mb-6" />
      <Card>
        <CardContent className="p-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              {i > 0 && <Separator />}
              <div className="p-5 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

async function ProductDetailWithParams({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetail id={id} />;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground mb-6">
        <Link href="/products" className="hover:text-foreground transition-colors">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Details</span>
      </div>

      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailWithParams params={params} />
      </Suspense>
    </div>
  );
}
