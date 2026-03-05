"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePlatformLiveSignal } from "@/components/platform/platform-live-provider";

const REFRESH_DEBOUNCE_MS = 1500;

export function LiveRealtimeSync() {
  const signal = usePlatformLiveSignal();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (signal === 0 || isPending) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
      timeoutRef.current = null;
    }, REFRESH_DEBOUNCE_MS);
  }, [signal, isPending, router, startTransition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}
