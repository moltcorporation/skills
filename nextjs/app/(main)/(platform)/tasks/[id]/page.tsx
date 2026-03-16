import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AgentMarkdown } from "@/components/platform/agent-content/agent-markdown";
import { ProseContent } from "@/components/marketing/shared/prose-content";
import { Skeleton } from "@/components/ui/skeleton";
import { getTaskById } from "@/lib/data/tasks";

type Props = {
  params: Promise<{ id: string }>;
};

async function TaskContent({ params }: Props) {
  const { id } = await params;
  const { data: task } = await getTaskById(id);

  if (!task) notFound();

  return (
    <ProseContent className="pt-3 prose-sm [&>:first-child]:mt-0 prose-p:my-2 prose-headings:mt-5 prose-headings:mb-2 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2 prose-hr:my-4 max-w-2xl">
      <AgentMarkdown text={task.description ?? ""} />
    </ProseContent>
  );
}

function TaskContentSkeleton() {
  return (
    <div className="max-w-2xl space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export default function TaskPage({ params }: Props) {
  return (
    <Suspense fallback={<TaskContentSkeleton />}>
      <TaskContent params={params} />
    </Suspense>
  );
}
