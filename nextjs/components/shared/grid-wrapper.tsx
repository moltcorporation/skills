import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Page-level container that constrains content to max-w-6xl.
 * Does NOT draw continuous vertical lines — sections manage their own.
 */
export function GridWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
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
 * Page-level vertical rails that can be configured responsively.
 * Use this when a page needs continuous left/right edge lines that align with
 * an outer shell such as the platform sidebar or a mobile full-width layout.
 */
export function GridPageRails({
  children,
  className,
  leftRailClassName,
  rightRailClassName,
}: {
  children: React.ReactNode;
  className?: string;
  leftRailClassName?: string;
  rightRailClassName?: string;
}) {
  return (
    <div className={cn("relative h-full w-full", className)}>
      <div
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 left-0 w-px border-l border-border",
          leftRailClassName,
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute top-0 right-0 bottom-0 w-px border-r border-border",
          rightRailClassName,
        )}
      />
      {children}
    </div>
  );
}

/**
 * Full page frame with optional dashed connector gaps above and below.
 * Useful for pages that live inside an outer shell but still need the Moltcorp
 * grid to connect cleanly into the header and footer.
 */
export function GridPageFrame({
  children,
  className,
  contentClassName,
  leftRailClassName,
  rightRailClassName,
  showTopConnector = true,
  showTopSeparator,
  showBottomConnector = true,
  topGapClassName,
  bottomGapClassName,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  leftRailClassName?: string;
  rightRailClassName?: string;
  showTopConnector?: boolean;
  /** Show the top separator line independently of the dashed connector gap. Defaults to showTopConnector. */
  showTopSeparator?: boolean;
  showBottomConnector?: boolean;
  topGapClassName?: string;
  bottomGapClassName?: string;
}) {
  const renderTopSeparator = showTopSeparator ?? showTopConnector;

  return (
    <GridPageRails
      className={cn("flex h-full min-h-full flex-1 flex-col", className)}
      leftRailClassName={leftRailClassName}
      rightRailClassName={rightRailClassName}
    >
      {showTopConnector ? <GridDashedGap className={topGapClassName} /> : null}
      {renderTopSeparator ? <GridSeparator /> : null}
      <div className={cn("relative flex-1", contentClassName)}>{children}</div>
      {showBottomConnector ? <GridSeparator showEdgeDots={false} /> : null}
      {showBottomConnector ? <div className={cn("h-8", bottomGapClassName)} /> : null}
    </GridPageRails>
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
 * Default h-8 height with dashed edge lines. Pass className to override height.
 */
export function GridDashedGap({ className }: { className?: string } = {}) {
  return (
    <div className={cn("relative h-8", className)}>
      <GridDashedEdgeLines />
    </div>
  );
}

/**
 * A horizontal solid line with optional connector dots at the left, right,
 * and center.
 */
export function GridSeparator({
  showCenter = false,
  showEdgeDots = true,
}: {
  showCenter?: boolean;
  showEdgeDots?: boolean;
}) {
  return (
    <div className="relative overflow-visible">
      <Separator />
      {showEdgeDots && (
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-border" />
      )}
      {showEdgeDots && (
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-border" />
      )}
      {showCenter && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-border" />
      )}
    </div>
  );
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
 * Defaults are tuned for standard content pages (h-12 gaps, moderate padding).
 * Override with `gapTopClassName` / `gapBottomClassName` / `className` for
 * editorial or landing-page layouts that need more breathing room.
 *
 * - `noBottomGap` — skip the bottom separator + dashed gap entirely
 *   (useful when the next section provides its own separator)
 */
export function GridCardSection({
  children,
  className,
  gapTopClassName,
  gapBottomClassName,
  noBottomGap = false,
  showTopSeparator = true,
}: {
  children: React.ReactNode;
  className?: string;
  gapTopClassName?: string;
  gapBottomClassName?: string;
  noBottomGap?: boolean;
  showTopSeparator?: boolean;
}) {
  return (
    <section className="relative w-full">
      <GridDashedGap className={gapTopClassName} />
      {showTopSeparator ? <GridSeparator /> : null}
      <div className={cn("relative border-x border-border px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20", className)}>
        {children}
      </div>
      {!noBottomGap && (
        <>
          <GridSeparator />
          <GridDashedGap className={gapBottomClassName} />
        </>
      )}
    </section>
  );
}

/**
 * A content section with solid edge lines and a top separator.
 * Used for features, text blocks, and any non-card grid section.
 */
export function GridContentSection({
  children,
  className,
  id,
  showTopSeparator = true,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  showTopSeparator?: boolean;
}) {
  return (
    <section id={id} className={cn("relative w-full", className)}>
      <GridEdgeLines />
      {showTopSeparator && <GridSeparator />}
      {children}
    </section>
  );
}
