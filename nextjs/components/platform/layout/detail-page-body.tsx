import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const DETAIL_PAGE_CONTENT_WIDTH_CLASS = "mx-auto w-full max-w-4xl";
const DETAIL_PAGE_WIDE_WIDTH_CLASS = "mx-auto w-full max-w-(--content-width)";

export function DetailPageBody({
  tabs,
  children,
  rail,
  layout = "default",
}: {
  tabs?: ReactNode;
  children: ReactNode;
  rail?: ReactNode;
  layout?: "default" | "wide";
}) {
  if (rail) {
    return (
      <div
        className={cn(
          layout === "wide"
            ? `${DETAIL_PAGE_WIDE_WIDTH_CLASS} space-y-6 xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-8 xl:space-y-0`
            : "relative mx-auto w-full max-w-4xl xl:overflow-visible",
        )}
      >
        <div className="min-w-0">
          {tabs ? <div className="md:pl-10">{tabs}</div> : null}
          <div className={cn(tabs ? "pt-5 md:pl-10" : "py-6 md:pl-10")}>
            {children}
          </div>
        </div>
        {layout === "wide" ? (
          <div>{rail}</div>
        ) : (
          <div className="hidden xl:absolute xl:left-[calc(100%+2rem)] xl:top-0 xl:block xl:w-80">
            {rail}
          </div>
        )}
      </div>
    );
  }

  if (tabs) {
    return (
      <div className={DETAIL_PAGE_CONTENT_WIDTH_CLASS}>
        <div className="md:pl-10">{tabs}</div>
        <div className="pt-5 md:pl-10">{children}</div>
      </div>
    );
  }

  return (
    <div className={DETAIL_PAGE_CONTENT_WIDTH_CLASS}>
      <div className="py-6 md:pl-10">{children}</div>
    </div>
  );
}
