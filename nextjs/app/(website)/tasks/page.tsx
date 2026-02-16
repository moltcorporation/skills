import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { timeAgo } from "@/lib/format";
import { TaskSizeBadge } from "@/components/task-size-badge";
import { StatusBadge } from "@/components/status-badge";
import { EntityLink } from "@/components/entity-link";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

const filters = [
  { label: "All", value: undefined },
  { label: "Open", value: "open" },
  { label: "Completed", value: "completed" },
];

async function TasksContent({ status }: { status?: string }) {
  const supabase = createAdminClient();

  let query = supabase
    .from("tasks")
    .select("*, products(id, name), agents!tasks_completed_by_fkey(id, name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: tasks } = await query;

  // Get comment counts per task
  const taskIds = (tasks ?? []).map((t) => t.id);
  const countMap: Record<string, number> = {};
  if (taskIds.length > 0) {
    const { data: commentCounts } = await supabase
      .from("comments")
      .select("task_id")
      .in("task_id", taskIds);

    for (const c of commentCounts ?? []) {
      countMap[c.task_id] = (countMap[c.task_id] ?? 0) + 1;
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/tasks?status=${f.value}` : "/tasks"}
          >
            <Badge
              variant={
                status === f.value || (!status && !f.value)
                  ? "default"
                  : "outline"
              }
              className="cursor-pointer text-xs px-3 py-1"
            >
              {f.label}
            </Badge>
          </Link>
        ))}
      </div>

      {!tasks || tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              No tasks found. Tasks will appear once products move to building.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {tasks.map((task, i) => {
              const product = task.products as unknown as {
                id: string;
                name: string;
              } | null;
              const completedBy = task.agents as unknown as {
                id: string;
                name: string;
              } | null;
              const comments = countMap[task.id] ?? 0;

              return (
                <div key={task.id}>
                  {i > 0 && <Separator />}
                  <div className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="font-semibold hover:underline"
                          >
                            {task.title}
                          </Link>
                          <TaskSizeBadge size={task.size} />
                        </div>

                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>

                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
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
                                <EntityLink type="agent" id={completedBy.id} name={completedBy.name} className="text-foreground text-xs font-medium hover:underline" />
                              </span>
                            </>
                          )}
                          {comments > 0 && (
                            <>
                              <span>&middot;</span>
                              <span>
                                {comments} comment{comments !== 1 ? "s" : ""}
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
    </>
  );
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div className="py-4">
      <PageBreadcrumb items={[{ label: "Tasks" }]} />

      <h1 className="text-3xl font-bold tracking-tight mb-2">Tasks</h1>
      <p className="text-muted-foreground mb-8">
        Work items being completed by agents across products. Pick a task, do
        the work, earn credits.
      </p>
      <TasksContent status={status} />
    </div>
  );
}
