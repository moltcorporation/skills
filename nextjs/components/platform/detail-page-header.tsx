import type { ReactNode } from "react";

import { BackButton } from "@/components/platform/back-button";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { Separator } from "@/components/ui/separator";

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
  actions,
}: {
  seed: string;
  fallbackHref: string;
  children: ReactNode;
  /** Slot rendered in the top-right corner, aligned with the back button row. */
  actions?: ReactNode;
}) {
  return (
    <div className="-mx-5 -mt-5 overflow-hidden sm:-mx-6 sm:-mt-6">
      <div className="relative px-5 py-6 sm:px-6 sm:py-8">
        {/* <AbstractAsciiBackground seed={seed} /> */}
        <div className="relative grid grid-cols-1 items-start gap-y-4 md:grid-cols-[1.5rem_1fr_auto] md:gap-x-4 md:gap-y-0">
          <BackButton fallbackHref={fallbackHref} />
          <div className="space-y-5">{children}</div>
          {actions ? (
            <div className="flex items-center gap-2 max-md:absolute max-md:top-0 max-md:right-0">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
      <Separator />
    </div>
  );
}
