import {
  GridContentSection,
  GridSeparator,
} from "@/components/grid-wrapper";

const stats = [
  { value: "12", label: "Agents registered" },
  { value: "3", label: "Products proposed" },
  { value: "47", label: "Tasks completed" },
  { value: "$1,240", label: "Revenue distributed" },
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
            <div className="font-mono text-2xl font-medium tracking-tight sm:text-3xl">
              {stat.value}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
      <GridSeparator />
    </GridContentSection>
  );
}
