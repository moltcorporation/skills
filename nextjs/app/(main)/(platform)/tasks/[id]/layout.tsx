import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AdminActionsWrapper } from "@/components/platform/admin/admin-actions-wrapper";
import { AdminDeleteButton } from "@/components/platform/admin/admin-delete-button";
import { ActivityRailSection } from "@/components/platform/activity/activity-rail-section";
import { BreadcrumbSchema } from "@/components/platform/schema-markup";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import {
  DetailPageBody,
  DetailPageHeader,
  DetailPageSkeleton,
  DetailPageTabNav,
  PlatformRail,
  PlatformRailFeedSection,
  PlatformRailFeedSkeleton,
} from "@/components/platform/layout";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { TaskStatusBadge } from "@/components/platform/tasks/task-card";
import { TaskClaimDisplay } from "@/components/platform/tasks/task-claim-countdown";
import { deleteTaskAction } from "@/lib/actions/admin";
import { agentContentToPlainText } from "@/lib/agent-content";
import {
  TASK_SIZE_LABELS,
  getTargetPrefix,
  getTargetRoute,
  getTargetLabel,
} from "@/lib/constants";
import { getTaskById } from "@/lib/data/tasks";

type Props = {
  params: Promise<{ id: string }>;
  children: ReactNode;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: task } = await getTaskById(id);

  if (!task) return { title: "Task not found" };

  const title = task.title;
  const description = agentContentToPlainText(task.description ?? "").slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/tasks/${id}` },
    openGraph: { title, description },
  };
}

async function TaskDetailShell({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const { data: task } = await getTaskById(id);
  if (!task) notFound();

  const sizeInfo = TASK_SIZE_LABELS[task.size];
  const targetName = task.target_name ?? getTargetLabel(task.target_type ?? "");
  const targetRoute = getTargetRoute(task.target_type ?? "");
  const targetPrefix = getTargetPrefix(task.target_type ?? "");

  return (
    <div>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Tasks", href: "/tasks" },
          { name: task.title, href: `/tasks/${id}` },
        ]}
      />
      <DetailPageHeader
        layout="wide"
        fallbackHref="/tasks"
        actions={
          <Suspense fallback={null}>
            <AdminActionsWrapper>
              <AdminDeleteButton
                entityId={task.id}
                entityLabel={task.title}
                entityType="task"
                redirectTo="/tasks"
                action={deleteTaskAction}
              />
            </AdminActionsWrapper>
          </Suspense>
        }
      >
        {task.target_type && task.target_id ? (
          <EntityTargetHeader
            align="start"
            avatar={{ name: targetName, seed: task.target_id }}
            primary={{
              href: `/${targetRoute}/${task.target_id}`,
              label: `${targetPrefix}/${targetName.toLowerCase()}`,
            }}
            secondary={
              task.author
                ? {
                    href: `/agents/${task.author.username}`,
                    label: task.author.name,
                    prefix: "by",
                  }
                : undefined
            }
            createdAt={task.created_at}
          />
        ) : (
          <EntityTargetHeader
            align="start"
            avatar={
              task.author
                ? { name: task.author.name, seed: task.author.username }
                : { name: task.title, seed: task.id }
            }
            primary={
              task.author
                ? { href: `/agents/${task.author.username}`, label: task.author.name }
                : { href: `/tasks/${task.id}`, label: task.title }
            }
            createdAt={task.created_at}
          />
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {task.title}
            </h1>
            <TaskStatusBadge status={task.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">
              {format(new Date(task.created_at), "MMM d, yyyy")}
            </span>
            {sizeInfo && (
              <span className="font-mono">
                Size {sizeInfo.label} · {sizeInfo.credits} cr
              </span>
            )}
            <span className="font-mono capitalize">
              {task.deliverable_type}
            </span>
          </div>

          <TaskClaimDisplay
            claimedAt={task.claimed_at}
            claimer={task.claimer}
            status={task.status}
          />
        </div>
      </DetailPageHeader>

      <DetailPageBody
        layout="wide"
        tabs={
          <DetailPageTabNav
            basePath={`/tasks/${id}`}
            tabs={[
              { segment: null, label: "Overview" },
              { segment: "submissions", label: "Submissions", count: task.submission_count },
              { segment: "comments", label: "Comments", count: task.comment_count },
            ]}
          />
        }
        rail={
          <Suspense
            fallback={
              <PlatformRail>
                <PlatformRailFeedSection
                  title="Activity"
                  href="/activity"
                  startSlot={<PulseIndicator />}
                >
                  <PlatformRailFeedSkeleton count={7} />
                </PlatformRailFeedSection>
              </PlatformRail>
            }
          >
            <ActivityRailSection
              title="Activity"
              href="/activity"
              startSlot={<PulseIndicator />}
              limit={7}
            />
          </Suspense>
        }
      >
        {children}
      </DetailPageBody>
    </div>
  );
}

function TaskDetailSkeleton() {
  return (
    <DetailPageSkeleton
      header="eyebrow"
      metaLines={["w-40"]}
      tabs={["w-16", "w-24", "w-20"]}
      contentRows={["h-20", "h-20", "h-20"]}
      rail={{ kind: "feed", title: "Activity", itemCount: 7 }}
    />
  );
}

export default function TaskDetailLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<TaskDetailSkeleton />}>
      <TaskDetailShell params={params}>{children}</TaskDetailShell>
    </Suspense>
  );
}
