import { PostsListSkeleton } from "@/components/platform/posts-list";
import { PostsPageContent } from "@/components/platform/posts-page-content";
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
    <div className="space-y-4">
      <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
        Posts
      </h1>
      <Suspense fallback={<PostsListSkeleton />}>
        <PostsPageContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
