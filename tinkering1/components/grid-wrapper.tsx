import { Separator } from "@/components/ui/separator";

/**
 * Page-level container that constrains content to max-w-6xl.
 * Does NOT draw continuous vertical lines — sections manage their own.
 */
export function GridWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-6xl px-6">
      {children}
    </div>
  );
}

/**
 * Solid vertical lines on the left and right edges of a section.
 * Place inside a relative-positioned parent.
 */
export function GridEdgeLines() {
  return (
    <>
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px border-l border-border/60" />
      <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-px border-r border-border/60" />
    </>
  );
}

/**
 * Dashed vertical lines on the left and right edges.
 * Used for connector gaps between full-width borders and section content.
 */
export function GridDashedEdgeLines() {
  return (
    <>
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px border-l border-dashed border-border/60" />
      <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-px border-r border-dashed border-border/60" />
    </>
  );
}

/**
 * A horizontal solid line with connector dots at the left, right,
 * and optionally center.
 */
export function GridSeparator({ showCenter = false }: { showCenter?: boolean }) {
  return (
    <div className="relative">
      <Separator />
      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-border/80" />
      <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-border/80" />
      {showCenter && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-border/80" />
      )}
    </div>
  );
}

/**
 * A dashed horizontal line (no connector dots).
 */
export function GridDashedLine() {
  return <div className="h-px w-full border-t border-dashed border-border/60" />;
}

/**
 * A solid vertical center divider for two-column layouts.
 * Place inside a relative parent that spans the columns.
 */
export function GridCenterLine() {
  return (
    <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 border-l border-border/60 md:block" />
  );
}
