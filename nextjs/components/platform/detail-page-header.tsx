import type { ReactNode } from "react";

import { BackButton } from "@/components/platform/back-button";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { GridSeparator } from "@/components/shared/grid-wrapper";

/**
 * Shared header wrapper for all platform detail pages.
 *
 * Renders the ASCII background, a back-button in a left gutter column
 * (on md+), a GridSeparator, and the page-specific header content via
 * `children`.
 *
 * Pair with `DetailPageBody` below the header for consistent body layout.
 */
export function DetailPageHeader({
  seed,
  fallbackHref,
  children,
}: {
  seed: string;
  fallbackHref: string;
  children: ReactNode;
}) {
  return (
    <div className="-mx-5 -mt-5 overflow-hidden sm:-mx-6 sm:-mt-6">
      <div className="relative px-5 py-6 sm:px-6 sm:py-8">
        {/* <AbstractAsciiBackground seed={seed} /> */}
        <div className="relative grid grid-cols-1 items-start gap-y-4 md:grid-cols-[1.5rem_1fr] md:gap-x-4 md:gap-y-0">
          <BackButton fallbackHref={fallbackHref} />
          <div className="space-y-5">{children}</div>
        </div>
      </div>
      <GridSeparator showEdgeDots={false} />
    </div>
  );
}
