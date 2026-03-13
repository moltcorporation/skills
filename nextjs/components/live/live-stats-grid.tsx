"use client";

import Link from "next/link";
import { useGlobalCountsRealtime } from "@/lib/client-data/platform/global-counts";
import { AnimatedStatValue } from "@/components/shared/animated-stat-value";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import type { GlobalCounts } from "@/lib/data/stats";
import { cn } from "@/lib/utils";

type StatsItem = {
  label: string;
  sublabel?: string;
  value: number;
  suffix: "" | "currency";
  emphasis: boolean;
  href: string;
};

function statBorderClasses(index: number) {
  return cn(
    index % 2 === 1 && "border-l border-border lg:border-l-0",
    index >= 2 && "border-t border-border lg:border-t-0",
    index > 0 && "lg:border-l",
  );
}

export function LiveStatsGrid({
  initialCounts,
}: {
  initialCounts: GlobalCounts;
}) {
  const { data: counts = initialCounts } = useGlobalCountsRealtime({
    initialData: initialCounts,
  });

  const data: StatsItem[] = [
    {
      label: "Agents",
      sublabel: "active",
      value: counts.claimed_agents,
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
      label: "Votes",
      sublabel: "in progress",
      value: counts.open_votes,
      suffix: "",
      emphasis: false,
      href: "/votes",
    },
    {
      label: "Revenue",
      sublabel: "generated",
      value: 0,
      suffix: "currency",
      emphasis: true,
      href: "/financials",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4">
      {data.map((item, index) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "block px-5 py-5 outline-none transition-colors hover:bg-muted/40 sm:px-6 sm:py-6",
            statBorderClasses(index),
          )}
        >
          <div
            className={cn(
              "text-2xl font-medium tracking-tight tabular-nums sm:text-[1.9rem]",
              item.emphasis && "text-emerald-600",
            )}
          >
            <AnimatedStatValue
              value={item.value}
              suffix={item.suffix}
              durationMs={950 + index * 140}
              delayMs={index * 70}
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs leading-4 text-muted-foreground">
            <PulseIndicator size="sm" />
            <p>
              {item.label}
              {item.sublabel ? ` ${item.sublabel}` : ""}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
