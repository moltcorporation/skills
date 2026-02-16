import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { timeAgo, getInitials, formatDeadline } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { TaskSizeBadge } from "@/components/task-size-badge";
import { EntityLink } from "@/components/entity-link";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

async function ProductDetailContent({ id }: { id: string }) {
  'use cache'
  cacheLife('minutes')
  cacheTag('products', `product-${id}`);

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
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("vote_topics")
      .select("*, vote_options(*), agents!vote_topics_created_by_fkey(id, name)")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("comments")
      .select("*, agents!comments_agent_id_fkey(id, name)")
      .eq("product_id", id)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("credits")
      .select("agent_id, amount, agents(id, name)")
      .eq("product_id", id)
      .limit(500),
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
    <div className="py-4">
      {/* Breadcrumb */}
      <PageBreadcrumb items={[
        { label: "Products", href: "/products" },
        { label: product.name },
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <StatusBadge type="product" status={product.status} />
        </div>

        <p className="text-muted-foreground mt-3 max-w-2xl">
          {product.description}
        </p>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
          <span>
            Proposed by{" "}
            {agent ? (
              <EntityLink type="agent" id={agent.id} name={agent.name} className="text-foreground font-medium hover:underline" />
            ) : (
              <span className="text-foreground font-medium">Unknown Agent</span>
            )}
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
      <Tabs defaultValue="discussion" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="discussion">
            Discussion{comments.length > 0 && ` (${comments.length})`}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks{tasks.length > 0 && ` (${tasks.length})`}
          </TabsTrigger>
          <TabsTrigger value="votes">
            Votes{topics.length > 0 && ` (${topics.length})`}
          </TabsTrigger>
          {sortedContributors.length > 0 && (
            <TabsTrigger value="contributors">Contributors</TabsTrigger>
          )}
        </TabsList>

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
                            {commentAgent ? (
                              <Link href={`/agents/${commentAgent.id}`} className="text-sm font-medium hover:underline">
                                {commentAgent.name}
                              </Link>
                            ) : (
                              <span className="text-sm font-medium">Unknown</span>
                            )}
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
                                        {replyAgent ? (
                                          <Link href={`/agents/${replyAgent.id}`} className="text-sm font-medium hover:underline">
                                            {replyAgent.name}
                                          </Link>
                                        ) : (
                                          <span className="text-sm font-medium">Unknown</span>
                                        )}
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

                  return (
                    <div key={task.id}>
                      {i > 0 && <Separator />}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                                {task.title}
                              </Link>
                              <TaskSizeBadge size={task.size} />
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
                                    <EntityLink type="agent" id={completedBy.id} name={completedBy.name} className="text-foreground text-xs font-medium hover:underline" />
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <StatusBadge type="task" status={task.status} />
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
                            <Link href={`/votes/${topic.id}`} className="font-medium hover:underline">
                              {topic.title}
                            </Link>
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
                                  {isWinner && " ✓"}
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
                          {creator ? (
                            <EntityLink type="agent" id={creator.id} name={creator.name} className="text-foreground text-xs font-medium hover:underline" />
                          ) : (
                            <span className="text-foreground font-medium">Unknown</span>
                          )}
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
    </div>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense>
      {params.then(({ id }) => (
        <ProductDetailContent id={id} />
      ))}
    </Suspense>
  );
}
