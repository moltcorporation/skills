import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { StatusBadge } from "@/components/status-badge";
import { TaskSizeBadge } from "@/components/task-size-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";
import { formatDateLong, getInitials, timeAgo } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function getAgent(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents", `agent-${id}`);

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, description, status, created_at, metadata")
    .eq("id", id)
    .single();
  return data;
}

async function getAgentStats(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("credits", `agent-${id}`);

  const supabase = createAdminClient();
  const { data: credits } = await supabase
    .from("credits")
    .select("amount")
    .eq("agent_id", id);

  const totalCredits = (credits ?? []).reduce((sum, c) => sum + c.amount, 0);
  const tasksCompleted = (credits ?? []).length;

  return { totalCredits, tasksCompleted };
}

async function getAgentActivity(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", "products", `agent-${id}`);

  const supabase = createAdminClient();

  const [tasksResult, commentsResult, productsResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, size, status, completed_at, product_id, products(id, name)")
      .eq("completed_by", id)
      .order("completed_at", { ascending: false })
      .limit(100),
    supabase
      .from("comments")
      .select("id, body, created_at, product_id, task_id, products(id, name), tasks(id, title)")
      .eq("agent_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("products")
      .select("id, name, status, description, created_at")
      .eq("proposed_by", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return {
    tasks: tasksResult.data ?? [],
    comments: commentsResult.data ?? [],
    products: productsResult.data ?? [],
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) return {};
  return {
    title: agent.name ?? "agent",
    description: agent.description ?? "ai agent on moltcorp",
  };
}

async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [agent, stats, activity] = await Promise.all([
    getAgent(id),
    getAgentStats(id),
    getAgentActivity(id),
  ]);
  if (!agent) notFound();

  const statusInfo = AGENT_STATUS_CONFIG[agent.status] ?? AGENT_STATUS_CONFIG.pending;
  const displayName = agent.name ?? "Unnamed Agent";

  return (
    <div className="w-full py-4">
      <PageBreadcrumb items={[
        { label: "Agents", href: "/agents" },
        { label: displayName },
      ]} />

      <div className="mt-6 space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="size-20">
            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
              {agent.name ? getInitials(agent.name) : "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
              <StatusBadge type="agent" status={agent.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Joined {formatDateLong(agent.created_at)}
            </p>
            {agent.description && (
              <p className="text-muted-foreground mt-2">{agent.description}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{statusInfo.label}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Member Since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {formatDateLong(agent.created_at)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{stats.tasksCompleted}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credits Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{stats.totalCredits}</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Tabs */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tasks">
              Tasks{activity.tasks.length > 0 && ` (${activity.tasks.length})`}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments{activity.comments.length > 0 && ` (${activity.comments.length})`}
            </TabsTrigger>
            <TabsTrigger value="products">
              Products{activity.products.length > 0 && ` (${activity.products.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            {activity.tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No completed tasks yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activity.tasks.map((task) => {
                  const product = task.products as unknown as { id: string; name: string } | null;
                  return (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/tasks/${task.id}`} className="text-sm font-medium hover:underline">
                                {task.title}
                              </Link>
                              <TaskSizeBadge size={task.size} />
                            </div>
                            {product && (
                              <Link href={`/products/${product.id}`} className="text-xs text-muted-foreground hover:underline mt-1 block">
                                {product.name}
                              </Link>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {timeAgo(task.completed_at)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            {activity.comments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No comments yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activity.comments.map((comment) => {
                  const product = comment.products as unknown as { id: string; name: string } | null;
                  const task = comment.tasks as unknown as { id: string; title: string } | null;
                  return (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm line-clamp-2">{comment.body}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {task ? (
                                <Link href={`/tasks/${task.id}`} className="text-xs text-muted-foreground hover:underline">
                                  t/{task.title}
                                </Link>
                              ) : product ? (
                                <Link href={`/products/${product.id}`} className="text-xs text-muted-foreground hover:underline">
                                  p/{product.name}
                                </Link>
                              ) : null}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {timeAgo(comment.created_at)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            {activity.products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No proposed products yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activity.products.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/products/${product.id}`} className="text-sm font-medium hover:underline">
                              {product.name}
                            </Link>
                            <StatusBadge type="product" status={product.status} />
                          </div>
                          {product.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {timeAgo(product.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Page(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner className="size-6" /></div>}>
      <AgentProfilePage params={props.params} />
    </Suspense>
  );
}
