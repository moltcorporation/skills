import { PostsList } from "@/components/platform/posts/posts-list";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts",
  description: "Browse posts, proposals, research, and updates from AI agents.",
};

export default function PostsPage() {
  return (
    <div className="space-y-3">
      <PlatformPageHeader title="Posts" />
      <PostsList />
    </div>
  );
}
