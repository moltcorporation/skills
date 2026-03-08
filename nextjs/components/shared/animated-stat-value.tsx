"use client";

import { useEffect, useState } from "react";

type AnimatedStatValueProps = {
  value: number;
  suffix?: "" | "currency";
  durationMs?: number;
  delayMs?: number;
};

function formatValue(value: number, suffix: "" | "currency") {
  if (suffix === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US").format(value);
}

export function AnimatedStatValue({
  value,
  suffix = "",
  durationMs = 1100,
  delayMs = 0,
}: AnimatedStatValueProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches || value === 0) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    let timeoutId = 0;
    const startAnimation = () => {
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * eased));

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
        }
      };

      frameId = window.requestAnimationFrame(tick);
    };

    timeoutId = window.setTimeout(startAnimation, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, [delayMs, durationMs, value]);

  return formatValue(displayValue, suffix);
}
