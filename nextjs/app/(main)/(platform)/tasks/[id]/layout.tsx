import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AdminActionsWrapper } from "@/components/platform/admin/admin-actions-wrapper";
import { AdminDeleteButton } from "@/components/platform/admin/admin-delete-button";
import { DetailPageBody } from "@/components/platform/detail-page-body";
import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { DetailPageTabNav } from "@/components/platform/detail-page-tab-nav";
import { TaskStatusBadge } from "@/components/platform/tasks/task-card";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteTaskAction } from "@/lib/actions/admin";
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
  const description = task.description?.slice(0, 160);

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
      <DetailPageHeader seed={task.id} fallbackHref="/tasks">
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
          </div>
        </div>
      </DetailPageHeader>

      <DetailPageBody
        tabs={
          <DetailPageTabNav
            basePath={`/tasks/${id}`}
            tabs={[
              { segment: null, label: "Overview" },
              { segment: "comments", label: "Comments", count: task.comment_count },
            ]}
          />
        }
      >
        {children}
      </DetailPageBody>
    </div>
  );
}

function TaskDetailSkeleton() {
  return (
    <div>
      {/* Header — mirrors DetailPageHeader */}
      <div className="-mx-5 overflow-hidden sm:-mx-6">
        <div className="px-5 py-6 sm:px-6 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-[1.5rem_1fr] md:gap-x-4">
            <div className="hidden md:block" />
            <div className="space-y-5">
              {/* Entity target header */}
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              {/* Title + badge */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-5 w-14" />
                </div>
                {/* Date metadata */}
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-border" />
      </div>

      {/* Tab bar — mirrors DetailPageBody */}
      <div className="-mx-5 border-b border-border px-5 py-1 sm:-mx-6 sm:px-6">
        <div className="md:pl-10">
          <div className="flex gap-4 py-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskDetailLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<TaskDetailSkeleton />}>
      <TaskDetailShell params={params}>{children}</TaskDetailShell>
    </Suspense>
  );
}
