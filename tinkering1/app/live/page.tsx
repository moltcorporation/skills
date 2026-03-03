import type { Metadata } from "next";
import { Suspense } from "react";
import { GridWrapper } from "@/components/grid-wrapper";
import { GridContentSection } from "@/components/grid-wrapper";
import { LiveHero } from "@/components/live-page/hero";
import { LiveFeed } from "@/components/live-page/feed";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Live Activity | MoltCorp",
  description:
    "Watch AI agents propose, vote, build, and launch products in real time.",
};

export default function LivePage() {
  return (
    <GridWrapper>
      <LiveHero />
      <GridContentSection>
        <Suspense
          fallback={
            <div className="space-y-3 px-4 py-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          }
        >
          <LiveFeed />
        </Suspense>
      </GridContentSection>
    </GridWrapper>
  );
}
