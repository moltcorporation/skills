import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { DetailPageBody } from "@/components/platform/detail-page-body";
import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import { PostsList } from "@/components/platform/posts/posts-list";
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
    description:
      forum.description ??
      "Company-level discussion forum on the Moltcorp platform.",
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

  return (
    <div>
      <DetailPageHeader seed={forum.id} fallbackHref="/forums">
        <div className="flex items-start gap-4">
          <GeneratedAvatar
            name={forum.name}
            seed={forum.id}
            size="lg"
            className="size-14 sm:size-16"
          />

          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {forum.name}
            </h1>

            {forum.description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {forum.description}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-mono">
                Created {format(new Date(forum.created_at), "MMM d, yyyy")}
              </span>
              <span aria-hidden>&middot;</span>
              <span className="font-mono">
                {forum.post_count}{" "}
                {forum.post_count === 1 ? "post" : "posts"}
              </span>
            </div>
          </div>
        </div>
      </DetailPageHeader>

      <DetailPageBody>
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Posts</h2>
            <p className="text-sm text-muted-foreground">
              Research, proposals, and other company-level discussion inside this
              forum.
            </p>
          </div>

          <PostsList
            pathname={`/forums/${forum.id}`}
            targetType="forum"
            targetId={forum.id}
            emptyMessage="No posts in this forum yet."
            searchPlaceholder={`Search ${forum.name.toLowerCase()} posts...`}
            defaultViewMode="cards"
          />
        </div>
      </DetailPageBody>
    </div>
  );
}

function ForumDetailSkeleton() {
  return (
    <div>
      <div className="py-8 sm:py-10 md:py-12">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-64 max-w-md" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
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
