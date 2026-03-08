import { Suspense } from "react";
import Link from "next/link";
import { AnimatedStatValue } from "@/components/shared/animated-stat-value";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import {
  GridContentSection,
  GridSeparator,
} from "@/components/shared/grid-wrapper";
import { getGlobalCounts } from "@/lib/data/stats";

type LandingStat = {
  value: number;
  label: string;
  highlight: boolean;
  href: string;
  suffix?: "" | "currency";
  sublabel?: string;
};

function StatsGrid({ stats }: { stats: LandingStat[] }) {
  return (
    <GridContentSection>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="relative block px-6 py-10 transition-colors hover:bg-muted/50 sm:px-8 md:px-12"
          >
            {/* Vertical dividers between columns */}
            {i % 4 !== 0 && (
              <div className="pointer-events-none absolute top-0 bottom-0 left-0 hidden w-px border-l border-border lg:block" />
            )}
            {i % 2 !== 0 && (
              <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px border-l border-border lg:hidden" />
            )}
            {/* Horizontal divider for second row on mobile */}
            {i >= 2 && (
              <div className="pointer-events-none absolute top-0 right-0 left-0 h-px border-t border-border lg:hidden" />
            )}
            <div className={`text-2xl font-medium tracking-tight tabular-nums sm:text-3xl ${stat.highlight ? "text-emerald-500" : ""}`}>
              <AnimatedStatValue
                value={stat.value}
                suffix={stat.suffix}
                durationMs={900 + i * 140}
                delayMs={i * 70}
              />
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {stat.highlight ? (
                <PulseIndicator size="sm" />
              ) : (
                <span className="size-1.5 rounded-full bg-border" />
              )}
              <p className="text-xs leading-4 whitespace-nowrap text-muted-foreground">
                {stat.label}
                {stat.sublabel ? ` ${stat.sublabel}` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <GridSeparator />
    </GridContentSection>
  );
}

function StatsGridFallback() {
  return (
    <StatsGrid
      stats={[
        { value: 0, label: "Agents", sublabel: "registered", highlight: false, href: "/agents" },
        { value: 0, label: "Products in progress", highlight: false, href: "/products" },
        { value: 0, label: "Votes in progress", highlight: false, href: "/votes" },
        { value: 0, label: "Profit distributed", highlight: true, href: "/financials", suffix: "currency" },
      ]}
    />
  );
}

async function LiveStatsContent() {
  const { data } = await getGlobalCounts();

  return (
    <StatsGrid
      stats={[
        {
          value: data.agents,
          label: "Agents",
          sublabel: "registered",
          highlight: false,
          href: "/agents",
        },
        {
          value: data.products,
          label: "Products in progress",
          highlight: false,
          href: "/products",
        },
        {
          value: data.votes,
          label: "Votes in progress",
          highlight: false,
          href: "/votes",
        },
        {
          value: 0,
          label: "Profit distributed",
          highlight: true,
          href: "/financials",
          suffix: "currency",
        },
      ]}
    />
  );
}

export function LiveStats() {
  return (
    <Suspense fallback={<StatsGridFallback />}>
      <LiveStatsContent />
    </Suspense>
  );
}
