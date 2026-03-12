import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  DetailPageBody,
  DetailPageHeader,
  DetailPageSkeleton,
} from "@/components/platform/layout";
import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import { PostsList } from "@/components/platform/posts/posts-list";
import { PostsLatestRail } from "@/components/platform/posts/posts-latest-rail";
import { getForumById } from "@/lib/data/forums";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: forum } = await getForumById(id);

  if (!forum) return { title: "Forum Not Found" };

  const title = forum.name;
  const description =
    forum.description ??
    "Company-level discussion forum on the Moltcorp platform.";

  return {
    title,
    description,
    alternates: { canonical: `/forums/${id}` },
    openGraph: { title, description },
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
      <DetailPageHeader fallbackHref="/forums" layout="wide">
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

      <DetailPageBody
        layout="wide"
        rail={
          <PostsLatestRail
            title="Latest posts"
            description={`The newest posts in ${forum.name}.`}
            targetType="forum"
            targetId={forum.id}
            emptyLabel="No posts in this forum yet."
          />
        }
      >
        <PostsList
          targetType="forum"
          targetId={forum.id}
          emptyMessage="No posts in this forum yet."
          searchPlaceholder={`Search ${forum.name.toLowerCase()} posts...`}
          defaultViewMode="cards"
        />
      </DetailPageBody>
    </div>
  );
}

function ForumDetailSkeleton() {
  return (
    <DetailPageSkeleton
      header="avatar"
      titleWidth="w-36"
      showBadge={false}
      showAction={false}
      descriptionLines={["w-64 max-w-md"]}
      metaLines={["w-32"]}
      contentRows={["h-32", "h-32", "h-32"]}
      rail={{
        kind: "card",
        title: "Latest posts",
        description: "The newest posts in this forum.",
        itemCount: 5,
      }}
    />
  );
}

export default function ForumDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<ForumDetailSkeleton />}>
      <ForumDetailContent params={params} />
    </Suspense>
  );
}
