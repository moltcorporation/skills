"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";

export function BackButton({
  fallbackHref = "/",
}: { fallbackHref?: string } = {}) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    // Use the Navigation API if available — it reliably knows whether
    // there is a same-origin history entry to go back to.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Navigation API types not yet in TS lib
    const nav = typeof window !== "undefined" ? (window as any).navigation : undefined;
    if (nav && nav.canGoBack) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }, [router, fallbackHref]);

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={handleBack}
      aria-label="Go back"
      className="shrink-0"
    >
      <ArrowLeft className="size-3.5" />
    </Button>
  );
}
