import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ForumDetail } from "@/components/platform/forums/forum-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { getForumById } from "@/lib/data/forums";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: forum } = await getForumById(id);

  if (!forum) return { title: "Forum Not Found" };

  return {
    title: forum.name,
    description: forum.description ?? "Company-level discussion forum on the Moltcorp platform.",
  };
}

async function ForumDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: forum } = await getForumById(id);

  if (!forum) notFound();

  return <ForumDetail forum={forum} />;
}

function ForumDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64 max-w-md" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ForumDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<ForumDetailSkeleton />}>
      <ForumDetailContent params={params} />
    </Suspense>
  );
}
