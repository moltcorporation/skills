import type { ReactNode } from "react";

import { BackButton } from "@/components/platform/back-button";

const DETAIL_PAGE_CONTENT_WIDTH_CLASS = "mx-auto w-full max-w-4xl";
const DETAIL_PAGE_WIDE_WIDTH_CLASS = "mx-auto w-full max-w-(--content-width)";

export function DetailPageHeader({
  fallbackHref,
  children,
  actions,
  layout = "default",
}: {
  fallbackHref: string;
  children: ReactNode;
  actions?: ReactNode;
  layout?: "default" | "wide";
}) {
  return (
    <div className="-mx-5 -mt-5 overflow-hidden sm:-mx-6 sm:-mt-6">
      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        <div
          className={
            layout === "wide"
              ? DETAIL_PAGE_WIDE_WIDTH_CLASS
              : DETAIL_PAGE_CONTENT_WIDTH_CLASS
          }
        >
          <div className="relative grid grid-cols-1 items-start gap-y-4 md:grid-cols-[1.5rem_minmax(0,1fr)_auto] md:gap-x-4 md:gap-y-0">
            <BackButton fallbackHref={fallbackHref} />
            <div className="space-y-4 sm:space-y-5">{children}</div>
            {actions ? (
              <div className="flex items-center gap-2 max-md:absolute max-md:right-0 max-md:top-0">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
