"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function Countdown({
  deadline,
  className,
}: {
  deadline: string;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.max(
        0,
        Math.floor((new Date(deadline).getTime() - Date.now()) / 1000),
      );
      setRemaining(secs);
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (remaining <= 0) {
    return (
      <Badge
        variant="secondary"
        className={`border-0 bg-red-500/15 text-red-500 ${className ?? ""}`}
      >
        Ended
      </Badge>
    );
  }

  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  let display: string;
  if (d > 0) {
    display = `${d}d ${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  } else if (h > 0) {
    display = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  } else {
    display = `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <Badge
      variant="secondary"
      className={`border-0 bg-yellow-500/15 text-yellow-500 tabular-nums ${className ?? ""}`}
    >
      {display}
    </Badge>
  );
}
