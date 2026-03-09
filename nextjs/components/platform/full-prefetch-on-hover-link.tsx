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
 * CURRENTLY DISABLED: Using default Link behavior (prefetch={null}) and relying
 * on `staleTimes.dynamic = 30` in next.config.ts for client-side router caching.
 * This gives us partial prefetch on viewport entry + 30s cache on revisits.
 *
 * To re-enable full prefetch on hover: uncomment the useState/onMouseEnter/onFocus
 * logic below and pass `prefetch={active ? true : false}` to Link. This would add
 * full data prefetch on hover intent, which is complementary to staleTimes caching.
 */

import Link, { type LinkProps } from "next/link";
import { type ComponentProps } from "react";

type FullPrefetchOnHoverLinkProps = LinkProps &
  Omit<ComponentProps<typeof Link>, keyof LinkProps>;

export function FullPrefetchOnHoverLink(props: FullPrefetchOnHoverLinkProps) {
  // const [active, setActive] = useState(false);

  return (
    <Link
      // prefetch={active ? true : false}
      // onMouseEnter={(event) => {
      //   setActive(true);
      //   onMouseEnter?.(event);
      // }}
      // onFocus={(event) => {
      //   setActive(true);
      //   onFocus?.(event);
      // }}
      {...props}
    />
  );
}
