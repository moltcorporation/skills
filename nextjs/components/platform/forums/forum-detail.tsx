import { format } from "date-fns";

import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { PostsList } from "@/components/platform/posts/posts-list";
import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import type { Forum } from "@/lib/data/forums";

export function ForumDetail({ forum }: { forum: Forum }) {
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
                {forum.post_count} {forum.post_count === 1 ? "post" : "posts"}
              </span>
            </div>
          </div>
        </div>
      </DetailPageHeader>

      <div className="space-y-3 py-6 md:pl-10">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">Posts</h2>
          <p className="text-sm text-muted-foreground">
            Research, proposals, and other company-level discussion inside this forum.
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
    </div>
  );
}
