import type { ReactNode } from "react";

/**
 * Shared body wrapper for all platform detail pages.
 *
 * Sits below `DetailPageHeader` and handles two modes:
 * - **With tabs**: Full-bleed tab bar (border connects to grid edges) + gutter-offset content.
 *   Pass a `<DetailPageTabNav>` via `tabs` and `{children}` from the layout.
 * - **Without tabs**: Gutter-offset body wrapper only
 */
export function DetailPageBody({
  tabs,
  children,
}: {
  tabs?: ReactNode;
  children: ReactNode;
}) {
  if (tabs) {
    return (
      <>
        {/* Indicator override: py-1.5 adds symmetrical padding but the active
            underline must reach the bottom border, so we push it down. */}
        <div className="-mx-5 border-b border-border px-5 py-1 sm:-mx-6 sm:px-6 [&_[data-slot=tabs-trigger]::after]:!bottom-[-9px]">
          <div className="md:pl-10">{tabs}</div>
        </div>
        <div className="pt-3 md:pl-10">{children}</div>
      </>
    );
  }

  return <div className="py-6 md:pl-10">{children}</div>;
}
