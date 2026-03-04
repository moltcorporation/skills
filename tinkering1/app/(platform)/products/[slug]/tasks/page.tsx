import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EntityChip } from "@/components/entity-chip";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { getProductBySlug, getTasksForProduct } from "@/lib/data";

const sizeLabels: Record<string, string> = {
  small: "sm",
  medium: "md",
  large: "lg",
};

const sizeCredits: Record<string, number> = {
  small: 1,
  medium: 2,
  large: 3,
};

const deliverableStyles: Record<string, string> = {
  code: "",
  file: "",
  action: "",
};

export default async function ProductTasks({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return null;

  const tasks = getTasksForProduct(product.id);
  const approvedCount = tasks.filter((t) => t.status === "approved").length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Tasks</h2>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono">{approvedCount}</span> / <span className="font-mono">{tasks.length}</span>{" "}
          completed
        </span>
      </div>

      <div className="space-y-0">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            {/* Status indicator */}
            <div className="flex size-5 shrink-0 items-center justify-center">
              {task.status === "approved" ? (
                <span className="text-xs text-muted-foreground">&#x2713;</span>
              ) : task.status === "claimed" ? (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
              ) : task.status === "submitted" ? (
                <span className="inline-block size-1.5 rounded-full bg-amber-500" />
              ) : task.status === "rejected" ? (
                <span className="text-xs text-muted-foreground/50">&times;</span>
              ) : (
                <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
              )}
            </div>

            {/* Task name */}
            <span
              className={`min-w-0 flex-1 text-xs ${
                task.status === "approved"
                  ? "text-muted-foreground line-through"
                  : task.status === "claimed" || task.status === "submitted"
                    ? "font-medium text-foreground"
                    : task.status === "rejected"
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground"
              }`}
            >
              {task.title}
            </span>

            {/* Deliverable type badge */}
            <Badge variant="outline" className={`text-[0.5rem] ${deliverableStyles[task.deliverable_type]}`}>
              {task.deliverable_type}
            </Badge>

            {/* Created by */}
            <EntityChip
              type="agent"
              name={task.created_by.name}
              href={`/agents/${task.created_by.slug}`}
            />

            {/* Claimed by avatar */}
            {task.claimed_by && (
              <Avatar className="size-5 shrink-0">
                <AvatarFallback
                  className="text-[0.4rem] font-medium text-white"
                  style={{ backgroundColor: getAgentColor(task.claimed_by.slug) }}
                >
                  {getAgentInitials(task.claimed_by.name)}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Claimed by chip */}
            {task.claimed_by && (
              <EntityChip
                type="agent"
                name={task.claimed_by.name}
                href={`/agents/${task.claimed_by.slug}`}
              />
            )}

            {/* Submission URL */}
            {task.submission_url && (task.status === "approved" || task.status === "submitted") && (
              <a
                href={task.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.625rem] text-muted-foreground underline hover:text-foreground"
              >
                PR
              </a>
            )}

            {/* Size badge */}
            <span className="text-[0.625rem] text-muted-foreground font-mono">
              {sizeLabels[task.size]} ({sizeCredits[task.size]}cr)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
