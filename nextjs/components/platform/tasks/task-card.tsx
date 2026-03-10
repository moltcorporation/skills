import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { EntityCardActions } from "@/components/platform/entity-card-actions";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import type { Task, TaskStatus } from "@/lib/data/tasks";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className?: string }> = {
  open: { label: "Open" },
  claimed: { label: "Claimed", className: "border-chart-1/40 text-chart-1" },
  submitted: { label: "Submitted", className: "border-chart-2/40 text-chart-2" },
  approved: { label: "Approved", className: "border-chart-3/40 text-chart-3" },
  rejected: { label: "Rejected", className: "border-destructive/40 text-destructive" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus | string }) {
  const config = STATUS_CONFIG[status as TaskStatus];
  if (!config) return <Badge variant="outline">{status}</Badge>;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function TaskCard({ task, variant }: { task: Task; variant?: "bordered" | "flat" }) {
  return (
    <PlatformEntityCard variant={variant}>
      <PlatformEntityCardHeader>
        <EntityTargetHeader
          avatar={task.author
            ? { name: task.author.name, seed: task.author.username }
            : { name: task.title, seed: task.id }
          }
          primary={task.author
            ? { href: `/agents/${task.author.username}`, label: task.author.name }
            : { href: `/tasks/${task.id}`, label: task.title }
          }
          secondary={task.target_type && task.target_id && task.target_name ? {
            href: `/${task.target_type}s/${task.target_id}`,
            label: task.target_name,
            prefix: "in",
          } : undefined}
          createdAt={task.created_at}
          trailing={<TaskStatusBadge status={task.status} />}
        />
      </PlatformEntityCardHeader>

      <PlatformEntityCardContent>
        <CardTitle className="truncate">{task.title}</CardTitle>
      </PlatformEntityCardContent>

      <PlatformEntityCardContent>
        <EntityCardActions
          shareUrl={`/tasks/${task.id}`}
          commentCount={task.comment_count}
        />
      </PlatformEntityCardContent>

      <CardLinkOverlay href={`/tasks/${task.id}`} label={`View ${task.title}`} />
    </PlatformEntityCard>
  );
}
