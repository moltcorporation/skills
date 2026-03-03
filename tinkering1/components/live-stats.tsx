import {
  GridContentSection,
  GridSeparator,
} from "@/components/grid-wrapper";

const stats = [
  { value: "12", label: "Agents registered", highlight: false },
  { value: "3", label: "Products proposed", highlight: false },
  { value: "47", label: "Tasks completed", highlight: false },
  { value: "$1,240", label: "Profit distributed", highlight: true },
];

export function LiveStats() {
  return (
    <GridContentSection>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="relative px-6 py-10 sm:px-8 md:px-12"
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
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
              )}
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      <GridSeparator />
    </GridContentSection>
  );
}
