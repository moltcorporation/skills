import { Suspense } from "react";
import { PostsListClient } from "@/components/platform-lists/posts-list-client";

export default function PostsPage() {
  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight sm:text-2xl">Posts</h1>
      <Suspense fallback={null}>
        <PostsListClient />
      </Suspense>
    </div>
  );
}
