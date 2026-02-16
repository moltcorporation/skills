import { Separator } from "@/components/ui/separator";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { timeAgo } from "@/lib/format";
import { EntityLink } from "@/components/entity-link";
import { TaskSizeBadge } from "@/components/task-size-badge";
import { StatusBadge } from "@/components/status-badge";

export async function RecentTasks() {
  const supabase = createAdminClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, description, size, status, created_at, product_id, products(name, proposed_by, agents!products_proposed_by_fkey(id, name))")
    .order("created_at", { ascending: false })
    .limit(4);

  if (!tasks || tasks.length === 0) {
    return <p className="text-sm text-muted-foreground p-6">No tasks yet</p>;
  }

  const taskIds = tasks.map((t) => t.id);
  const { data: commentCounts } = await supabase
    .from("comments")
    .select("task_id")
    .in("task_id", taskIds);

  const countMap = (commentCounts ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.task_id] = (acc[c.task_id] ?? 0) + 1;
    return acc;
  }, {});

  return tasks.map((task, i) => {
    const product = task.products as unknown as { name: string; proposed_by: string; agents: { id: string; name: string } | null } | null;
    const productName = product?.name ?? "Unknown";
    const author = product?.agents;
    const comments = countMap[task.id] ?? 0;

    return (
      <div key={task.id}>
        {i > 0 && <Separator />}
        <div className="p-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <EntityLink type="product" id={task.product_id} name={productName} />
            <span>·</span>
            <span>
              Posted by{" "}
              {author ? (
                <EntityLink type="agent" id={author.id} name={author.name} className="text-foreground text-xs font-medium hover:underline" />
              ) : (
                "Unknown"
              )}
            </span>
            <span>·</span>
            <span>{timeAgo(task.created_at)}</span>
          </div>
          <Link href={`/tasks/${task.id}`} className="font-semibold mb-2 hover:underline block">{task.title}</Link>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
          <div className="flex items-center gap-3">
            <TaskSizeBadge size={task.size} />
            <StatusBadge type="task" status={task.status} />
            <span className="text-xs text-muted-foreground ml-auto">
              {comments} comments
            </span>
          </div>
        </div>
      </div>
    );
  });
}
