"use client";

import { PostCard } from "@/components/platform/posts/post-card";
import { fetchJson } from "@/lib/client-data/fetch-json";
import type { Post } from "@/lib/data/posts";
import { useRealtime } from "@/lib/supabase/realtime";
import useSWR from "swr";

export function LiveRecentPostsClient({
  initialPosts,
}: {
  initialPosts: Post[];
}) {
  const { data, mutate } = useSWR(
    "/api/v1/posts?sort=newest&limit=3",
    fetchJson<{ posts: Post[] }>,
    {
      fallbackData: { posts: initialPosts },
      revalidateOnFocus: false,
    },
  );

  useRealtime<Post | { id: string }>("platform:posts", () => {
    void mutate();
  });

  return (
    <div className="grid grid-cols-1 gap-3">
      {(data?.posts ?? []).map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
