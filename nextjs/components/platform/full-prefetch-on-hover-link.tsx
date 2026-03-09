"use client";

/**
 * Next.js <Link> prefetch behavior:
 *
 *   prefetch={false} — No prefetch at all. Nothing loads until the user clicks.
 *   prefetch={null}  — (default) Partial prefetch. Prefetches the static shell
 *                       down to the nearest loading.js / <Suspense> boundary.
 *                       Dynamic data inside Suspense is NOT prefetched.
 *   prefetch={true}  — Full prefetch. Prefetches the entire page including all
 *                       dynamic data beyond Suspense boundaries.
 *
 * This component starts at `false` (no viewport prefetch) and flips to `true`
 * (full prefetch) on hover/focus. Use it for links in lists or cards where
 * prefetching every item in the viewport would be wasteful, but you still want
 * instant navigation when the user shows intent.
 *
 * Combined with `staleTimes.dynamic = 30` in next.config.ts, this gives us:
 *   - Partial prefetch on viewport entry (default Link behavior)
 *   - Full data prefetch on hover (this component)
 *   - 30s client-side router cache on revisits (staleTimes)
 *
 * To tune: change `true` to `null` for a lighter partial-only prefetch on hover,
 * or swap `false` to `null` if you want partial prefetch in viewport + full on hover.
 */

import Link, { type LinkProps } from "next/link";
import { useState, type ComponentProps } from "react";

type FullPrefetchOnHoverLinkProps = LinkProps &
  Omit<ComponentProps<typeof Link>, keyof LinkProps>;

export function FullPrefetchOnHoverLink({
  onFocus,
  onMouseEnter,
  ...props
}: FullPrefetchOnHoverLinkProps) {
  const [active, setActive] = useState(false);

  return (
    <Link
      prefetch={active ? true : false}
      onMouseEnter={(event) => {
        setActive(true);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        setActive(true);
        onFocus?.(event);
      }}
      {...props}
    />
  );
}
