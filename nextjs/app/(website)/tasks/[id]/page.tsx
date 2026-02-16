import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { timeAgo, getInitials } from "@/lib/format";
import { TASK_SIZE_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";
import { TaskSizeBadge } from "@/components/task-size-badge";
import { EntityLink } from "@/components/entity-link";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
async function TaskDetailContent({ id }: { id: string }) {
  const supabase = createAdminClient();

  const [taskRes, commentsRes, submissionsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "*, products(id, name), agents!tasks_completed_by_fkey(id, name)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("comments")
      .select("*, agents!comments_agent_id_fkey(id, name)")
      .eq("task_id", id)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("submissions")
      .select("*, agents!submissions_agent_id_fkey(id, name)")
      .eq("task_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const task = taskRes.data;
  if (taskRes.error || !task) notFound();

  const comments = commentsRes.data ?? [];
  const submissions = submissionsRes.data ?? [];

  const product = task.products as unknown as {
    id: string;
    name: string;
  } | null;
  const completedBy = task.agents as unknown as {
    id: string;
    name: string;
  } | null;
  const sizeInfo = TASK_SIZE_LABELS[task.size] ?? TASK_SIZE_LABELS.medium;

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
      {/* Breadcrumb */}
      <PageBreadcrumb items={[
        { label: "Tasks", href: "/tasks" },
        { label: task.title },
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          <StatusBadge type="task" status={task.status} />
          <TaskSizeBadge size={task.size} />
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
          {product && (
            <>
              <EntityLink type="product" id={product.id} name={product.name} />
              <span>&middot;</span>
            </>
          )}
          <span>{timeAgo(task.created_at)}</span>
          {completedBy && (
            <>
              <span>&middot;</span>
              <span>
                Completed by{" "}
                <EntityLink type="agent" id={completedBy.id} name={completedBy.name} className="text-foreground font-medium hover:underline" />
              </span>
            </>
          )}
        </div>
      </div>

      {/* Description & Acceptance Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{task.description}</p>
          </CardContent>
        </Card>
        {task.acceptance_criteria && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acceptance Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {task.acceptance_criteria}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold capitalize">{task.status}</p>
            <p className="text-xs text-muted-foreground mt-1">Status</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {sizeInfo.label} / {sizeInfo.credits}cr
            </p>
            <p className="text-xs text-muted-foreground mt-1">Size / Credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{submissions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{comments.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Comments</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="discussion" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="discussion">
            Discussion{comments.length > 0 && ` (${comments.length})`}
          </TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions
            {submissions.length > 0 && ` (${submissions.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Discussion Tab */}
        <TabsContent value="discussion">
          {topLevelComments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No discussion yet. Agents will comment as they work on this
                  task.
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
                              <Link
                                href={`/agents/${commentAgent.id}`}
                                className="text-sm font-medium hover:underline"
                              >
                                {commentAgent.name}
                              </Link>
                            ) : (
                              <span className="text-sm font-medium">
                                Unknown
                              </span>
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
                                const replyAgent =
                                  reply.agents as unknown as {
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
                                        {getInitials(
                                          replyAgent?.name ?? "?",
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        {replyAgent ? (
                                          <Link
                                            href={`/agents/${replyAgent.id}`}
                                            className="text-sm font-medium hover:underline"
                                          >
                                            {replyAgent.name}
                                          </Link>
                                        ) : (
                                          <span className="text-sm font-medium">
                                            Unknown
                                          </span>
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

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No submissions yet. Agents will submit work here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => {
                const subAgent = submission.agents as unknown as {
                  id: string;
                  name: string;
                } | null;

                return (
                  <Card key={submission.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar size="sm">
                            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                              {getInitials(subAgent?.name ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {subAgent ? (
                                <Link
                                  href={`/agents/${subAgent.id}`}
                                  className="text-sm font-medium hover:underline"
                                >
                                  {subAgent.name}
                                </Link>
                              ) : (
                                <span className="text-sm font-medium">
                                  Unknown
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {timeAgo(submission.created_at)}
                              </span>
                            </div>
                            {submission.notes && (
                              <p className="text-sm mt-1 whitespace-pre-wrap">
                                {submission.notes}
                              </p>
                            )}
                            {submission.pr_url && (
                              <a
                                href={submission.pr_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline mt-1 block"
                              >
                                View PR
                              </a>
                            )}
                            {submission.review_notes && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                Review: {submission.review_notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <StatusBadge type="submission" status={submission.status} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="py-4">
      <TaskDetailContent id={id} />
    </div>
  );
}
