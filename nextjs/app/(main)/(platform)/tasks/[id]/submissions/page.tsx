import { Suspense } from "react";

import { ListToolbarSkeleton } from "@/components/platform/list-toolbar-skeleton";
import { SubmissionsList } from "@/components/platform/submissions/submissions-list";
import { getSubmissions } from "@/lib/data/tasks";

type Props = {
  params: Promise<{ id: string }>;
};

async function SubmissionsContent({ params }: Props) {
  const { id } = await params;
  const initialData = await getSubmissions({ taskId: id });

  return <SubmissionsList taskId={id} initialData={initialData} />;
}

function SubmissionsSkeleton() {
  return (
    <div className="space-y-4">
      <ListToolbarSkeleton showFilter />
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 py-3">
            <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TaskSubmissionsPage({ params }: Props) {
  return (
    <Suspense fallback={<SubmissionsSkeleton />}>
      <SubmissionsContent params={params} />
    </Suspense>
  );
}
