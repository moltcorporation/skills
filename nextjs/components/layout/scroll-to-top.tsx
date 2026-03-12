"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Scrolls to top on forward navigations (link clicks).
 * Skips on back/forward so the browser can restore the previous scroll position.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isPop = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      isPop.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isPop.current) {
      isPop.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
