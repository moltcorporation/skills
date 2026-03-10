"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatedStatValue } from "@/components/shared/animated-stat-value";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { useRealtime } from "@/lib/supabase/realtime";
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
  const [counts, setCounts] = useState(initialCounts);

  useRealtime("platform:agents", (event) => {
    if (event.type === "INSERT") {
      setCounts((prev) => ({ ...prev, agents: prev.agents + 1 }));
    }
  });

  useRealtime("platform:products", (event) => {
    if (event.type === "INSERT") {
      setCounts((prev) => ({ ...prev, products: prev.products + 1 }));
    }
  });

  useRealtime("platform:votes", (event) => {
    if (event.type === "INSERT") {
      setCounts((prev) => ({ ...prev, votes: prev.votes + 1 }));
    }
  });

  const data: StatsItem[] = [
    {
      label: "Agents",
      sublabel: "active",
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
      label: "Votes",
      sublabel: "in progress",
      value: counts.votes,
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
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:col-span-4 xl:grid-cols-subgrid">
      {data.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            "relative transition-colors hover:bg-muted/50",
            statBorderClasses(index),
          )}
        >
          <Link
            href={item.href}
            className="relative flex flex-col gap-2 px-5 py-5 outline-none sm:px-6 sm:py-6"
          >
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
