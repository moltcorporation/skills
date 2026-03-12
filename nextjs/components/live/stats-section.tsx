import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getGlobalCounts } from "@/lib/data/stats";
import { LiveStatsGrid } from "./live-stats-grid";

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="px-5 py-5 sm:px-6 sm:py-6"
        >
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-3 h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

async function StatsGrid() {
  const { data: counts } = await getGlobalCounts();

  return <LiveStatsGrid initialCounts={counts} />;
}

export function LiveStatsSection() {
  return (
    <Suspense fallback={<StatsGridSkeleton />}>
      <StatsGrid />
    </Suspense>
  );
}
