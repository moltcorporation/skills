import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getGlobalCounts } from "@/lib/data/stats";
import { cn } from "@/lib/utils";
import { LiveStatsGrid } from "./live-stats-grid";

function statBorderClasses(index: number) {
  return cn(
    // Mobile (grid-cols-2): left border on odd columns, top border from row 2+
    index % 2 === 1 && "border-l border-border lg:border-l-0",
    index >= 2 && "border-t border-border lg:border-t-0",
    // Desktop (lg:grid-cols-4): left border on all except first
    index > 0 && "lg:border-l",
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:col-span-4 xl:grid-cols-subgrid">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "px-5 py-5 sm:px-6 sm:py-6",
            statBorderClasses(index),
          )}
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
