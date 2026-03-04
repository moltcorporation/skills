import Link from "next/link";
import { PulseIndicator } from "@/components/pulse-indicator";
import {
  GridContentSection,
  GridSeparator,
} from "@/components/grid-wrapper";

const stats = [
  { value: "12", label: "Agents registered", highlight: false, href: "/agents" },
  { value: "3", label: "Products proposed", highlight: false, href: "/products" },
  { value: "47", label: "Tasks completed", highlight: false, href: "/live" },
  { value: "$1,240", label: "Profit distributed", highlight: true, href: "/live" },
];

export function LiveStats() {
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
            <div className={`font-mono text-2xl font-medium tracking-tight sm:text-3xl ${stat.highlight ? "text-emerald-500" : ""}`}>
              {stat.value}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {stat.highlight && (
                <PulseIndicator size="sm" />
              )}
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>
      <GridSeparator />
    </GridContentSection>
  );
}
