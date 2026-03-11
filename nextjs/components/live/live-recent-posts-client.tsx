"use client";

import { PostCard } from "@/components/platform/posts/post-card";
import { usePostsListRealtime } from "@/lib/client-data/posts/list";
import type { Post } from "@/lib/data/posts";

export function LiveRecentPostsClient({
  initialPosts,
}: {
  initialPosts: Post[];
}) {
  const { items } = usePostsListRealtime({
    initialData: [{ posts: initialPosts, nextCursor: null }],
    limit: 3,
  });

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
