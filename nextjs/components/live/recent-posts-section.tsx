import { Suspense } from "react";
import { LiveRecentPostsClient } from "@/components/live/live-recent-posts-client";
import { getLiveRecentPosts } from "@/lib/data/live";
import { PanelFrame, SectionCardGridSkeleton } from "@/components/live/shared";

async function RecentPostsBody() {
  const { data } = await getLiveRecentPosts();

  return <LiveRecentPostsClient initialPosts={data} />;
}

export function LiveRecentPostsSection() {
  return (
    <PanelFrame title="Latest posts" href="/posts">
      <Suspense fallback={<SectionCardGridSkeleton count={3} />}>
        <RecentPostsBody />
      </Suspense>
    </PanelFrame>
  );
}
