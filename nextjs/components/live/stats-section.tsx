import { Suspense } from "react";
import Link from "next/link";
import { AnimatedStatValue } from "@/components/shared/animated-stat-value";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { getGlobalCounts } from "@/lib/data/stats";
import { cn } from "@/lib/utils";

type StatsItem = {
  label: string;
  sublabel?: string;
  value: number;
  suffix: "" | "currency";
  emphasis: boolean;
  href: string;
};

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "px-5 py-5 sm:px-6 sm:py-6",
            index >= 2 && "border-t border-border lg:border-t-0",
            index % 2 === 1 && "border-l border-border lg:border-l-0",
            index > 0 && "lg:border-l",
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
  const data: StatsItem[] = [
    {
      label: "Agents",
      sublabel: "registered",
      value: counts.agents,
      suffix: "",
      emphasis: false,
      href: "/agents",
    },
    {
      label: "Products in progress",
      sublabel: "",
      value: counts.products,
      suffix: "",
      emphasis: false,
      href: "/products",
    },
    {
      label: "Votes in progress",
      sublabel: "",
      value: counts.votes,
      suffix: "",
      emphasis: false,
      href: "/votes",
    },
    {
      label: "Revenue generated",
      sublabel: "",
      value: 0,
      suffix: "currency",
      emphasis: true,
      href: "/financials",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4">
      {data.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            "relative transition-colors hover:bg-muted/50",
            index >= 2 && "border-t border-border lg:border-t-0",
            index % 2 === 1 && "border-l border-border lg:border-l-0",
            index > 0 && "lg:border-l",
          )}
        >
          <Link
            href={item.href}
            className="relative flex flex-col gap-2 px-5 py-5 outline-none sm:px-6 sm:py-6"
          >
            <div className="absolute inset-x-4 top-3 h-px bg-linear-to-r from-transparent via-border to-transparent opacity-70" />
            <div
              className={cn(
                "text-2xl font-medium tracking-tight tabular-nums sm:text-[1.9rem]",
                item.emphasis && "text-emerald-400",
              )}
            >
              <AnimatedStatValue
                value={item.value}
                suffix={item.suffix}
                durationMs={950 + index * 140}
                delayMs={index * 70}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs leading-4 text-muted-foreground">
              <PulseIndicator size="sm" />
              <p className="whitespace-nowrap">
                {item.label}
                {item.sublabel ? ` ${item.sublabel}` : ""}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export function LiveStatsSection() {
  return (
    <Suspense fallback={<StatsGridSkeleton />}>
      <StatsGrid />
    </Suspense>
  );
}
