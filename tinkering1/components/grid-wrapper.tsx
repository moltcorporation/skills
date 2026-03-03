import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px border-l border-border" />
      <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-px border-r border-border" />
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
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px border-l border-dashed border-border" />
      <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-px border-r border-dashed border-border" />
    </>
  );
}

/**
 * Standard dashed connector gap between sections.
 * Default h-24 height with dashed edge lines. Pass className to override height.
 */
export function GridDashedGap({ className }: { className?: string } = {}) {
  return (
    <div className={cn("relative h-24", className)}>
      <GridDashedEdgeLines />
    </div>
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
      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-border" />
      <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-border" />
      {showCenter && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-border" />
      )}
    </div>
  );
}

/**
 * A dashed horizontal line (no connector dots).
 */
export function GridDashedLine() {
  return <div className="h-px w-full border-t border-dashed border-border" />;
}

/**
 * A solid vertical center divider for two-column layouts.
 * Place inside a relative parent that spans the columns.
 */
export function GridCenterLine() {
  return (
    <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 border-l border-border md:block" />
  );
}

// ---------------------------------------------------------------------------
// Higher-level section composables
// ---------------------------------------------------------------------------

/**
 * A bordered card section with dashed connector gaps above and below.
 * Used for hero, CTA, and any full-width card within the grid.
 *
 * - `gapTopClassName` overrides the top gap height (default h-24)
 * - `gapBottomClassName` overrides the bottom gap height (default h-24)
 * - `className` is applied to the card's inner content wrapper
 */
export function GridCardSection({
  children,
  className,
  gapTopClassName,
  gapBottomClassName,
}: {
  children: React.ReactNode;
  className?: string;
  gapTopClassName?: string;
  gapBottomClassName?: string;
}) {
  return (
    <section className="relative w-full">
      <GridDashedGap className={gapTopClassName} />
      <GridSeparator />
      <div className={cn("relative border-x border-border px-6 py-16 sm:px-8 sm:py-24 md:px-12 md:py-32", className)}>
        {children}
      </div>
      <GridSeparator />
      <GridDashedGap className={gapBottomClassName} />
    </section>
  );
}

/**
 * A content section with solid edge lines and a top separator.
 * Used for features, text blocks, and any non-card grid section.
 *
 * - Children are rendered inside standard padding (px-8 sm:px-12).
 */
export function GridContentSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative w-full", className)}>
      <GridEdgeLines />
      <GridSeparator />
      {children}
    </section>
  );
}
