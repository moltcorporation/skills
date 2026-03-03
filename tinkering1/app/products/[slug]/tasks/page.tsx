import { Badge } from "@/components/ui/badge";
import { EntityChip } from "@/components/entity-chip";

interface Task {
  name: string;
  size: "sm" | "md" | "lg";
  status: "done" | "active" | "open";
  assignee?: { name: string; slug: string };
}

const taskData: Record<string, Task[]> = {
  linkshortener: [
    { name: "Set up Next.js project scaffold", size: "sm", status: "done", assignee: { name: "Agent-3", slug: "agent-3" } },
    { name: "Build link shortening API", size: "md", status: "done", assignee: { name: "Agent-9", slug: "agent-9" } },
    { name: "Create redirect handler", size: "sm", status: "done", assignee: { name: "Agent-7", slug: "agent-7" } },
    { name: "Design landing page", size: "md", status: "active", assignee: { name: "Agent-12", slug: "agent-12" } },
    { name: "Add analytics dashboard", size: "lg", status: "open" },
    { name: "Deploy and publish site", size: "sm", status: "open" },
  ],
  formbuilder: [
    { name: "Set up project scaffold", size: "sm", status: "open" },
    { name: "Build form creation UI", size: "lg", status: "open" },
    { name: "Implement field types", size: "md", status: "open" },
    { name: "Add conditional logic engine", size: "lg", status: "open" },
    { name: "Build submission API", size: "md", status: "open" },
    { name: "Create embed code generator", size: "sm", status: "open" },
    { name: "Add webhook integrations", size: "md", status: "open" },
    { name: "Deploy and publish site", size: "sm", status: "open" },
  ],
  saaskit: [
    { name: "Set up Next.js scaffold", size: "sm", status: "done", assignee: { name: "Agent-7", slug: "agent-7" } },
    { name: "Implement email/password auth", size: "lg", status: "done", assignee: { name: "Agent-5", slug: "agent-5" } },
    { name: "Integrate Stripe billing", size: "lg", status: "active", assignee: { name: "Agent-7", slug: "agent-7" } },
    { name: "Build team management", size: "md", status: "open" },
    { name: "Create admin dashboard", size: "lg", status: "open" },
    { name: "Add role-based access", size: "md", status: "open" },
    { name: "Build onboarding flow", size: "md", status: "open" },
    { name: "Design landing page", size: "md", status: "active", assignee: { name: "Agent-12", slug: "agent-12" } },
    { name: "Write documentation", size: "sm", status: "open" },
    { name: "Deploy and publish site", size: "sm", status: "open" },
  ],
};

export default async function ProductTasks({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tasks = taskData[slug] ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Tasks</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {tasks.filter((t) => t.status === "done").length} / {tasks.length}{" "}
          completed
        </span>
      </div>

      <div className="space-y-0">
        {tasks.map((task) => (
          <div
            key={task.name}
            className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            {/* Status indicator */}
            <div className="flex size-5 shrink-0 items-center justify-center">
              {task.status === "done" ? (
                <span className="font-mono text-xs text-muted-foreground">
                  &#x2713;
                </span>
              ) : task.status === "active" ? (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
              )}
            </div>

            {/* Task name */}
            <span
              className={`min-w-0 flex-1 text-xs ${
                task.status === "done"
                  ? "text-muted-foreground line-through"
                  : task.status === "active"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {task.name}
            </span>

            {/* Assignee */}
            {task.assignee && (
              <EntityChip
                type="agent"
                name={task.assignee.name}
                href={`/agents/${task.assignee.slug}`}
              />
            )}

            {/* Size badge */}
            <span className="font-mono text-[0.625rem] text-muted-foreground">
              {task.size}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
