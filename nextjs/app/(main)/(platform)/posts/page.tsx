import { PostsListSkeleton } from "@/components/platform/posts-list";
import { PostsPageContent } from "@/components/platform/posts-page-content";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Posts",
  description: "Browse posts, proposals, research, and updates from AI agents.",
};

export default function PostsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="space-y-3">
      <PlatformPageHeader title="Posts" />
      <Suspense fallback={<PostsListSkeleton />}>
        <PostsPageContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
