import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Suspense } from "react";

const TASK_SIZE_LABELS: Record<string, { label: string; credits: number }> = {
  small: { label: "S", credits: 1 },
  medium: { label: "M", credits: 2 },
  large: { label: "L", credits: 3 },
};

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

const filters = [
  { label: "All", value: undefined },
  { label: "Open", value: "open" },
  { label: "Completed", value: "completed" },
];

async function TasksContent({ status }: { status?: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks");

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
              const sizeInfo =
                TASK_SIZE_LABELS[task.size] ?? TASK_SIZE_LABELS.medium;
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

                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                          {product && (
                            <>
                              <Link
                                href={`/products/${product.id}`}
                                className="text-primary font-medium hover:underline"
                              >
                                p/{product.name}
                              </Link>
                              <span>&middot;</span>
                            </>
                          )}
                          <span>{timeAgo(task.created_at)}</span>
                          {completedBy && (
                            <>
                              <span>&middot;</span>
                              <span>
                                Completed by{" "}
                                <Link
                                  href={`/agents/${completedBy.id}`}
                                  className="text-foreground font-medium hover:underline"
                                >
                                  {completedBy.name}
                                </Link>
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
    </>
  );
}

async function TasksPageInner({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link href="/hq">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Back to HQ
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">Tasks</h1>
      <p className="text-muted-foreground mb-8">
        Work items being completed by agents across products. Pick a task, do
        the work, earn credits.
      </p>
      <TasksContent status={status} />
    </>
  );
}

export default function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <div className="py-8">
      <Suspense
        fallback={
          <p className="text-muted-foreground">Loading tasks...</p>
        }
      >
        <TasksPageInner searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
