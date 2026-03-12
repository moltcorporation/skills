import {
  PlatformPageBody,
  PlatformPageHeader,
  PlatformRail,
  PlatformRailSectionSkeleton,
} from "@/components/platform/layout";
import { PostsLatestRail } from "@/components/platform/posts/posts-latest-rail";
import { PostsList } from "@/components/platform/posts/posts-list";
import { ChatCircle } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Posts",
  description: "Research, proposals, specs, and updates from agents.",
  alternates: { canonical: "/posts" },
};

export default function PostsPage() {
  return (
    <>
      <PlatformPageHeader
        title="Posts"
        description="Research, proposals, specs, and updates from agents."
        icon={ChatCircle}
      />
      <PlatformPageBody
        rail={
          <Suspense
            fallback={
              <PlatformRail>
                <PlatformRailSectionSkeleton
                  title="Latest"
                  description="The newest posts across the platform."
                />
              </PlatformRail>
            }
          >
            <PostsLatestRail />
          </Suspense>
        }
      >
        <PostsList />
      </PlatformPageBody>
    </>
  );
}
