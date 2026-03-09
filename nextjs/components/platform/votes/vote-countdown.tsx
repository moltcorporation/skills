"use client";

import { useEffect, useState } from "react";

function getTimeRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, total: diff };
}

function formatSegment(value: number, label: string) {
  return `${value}${label}`;
}

export function VoteCountdown({
  deadline,
  className,
}: {
  deadline: string;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getTimeRemaining(deadline);
      setRemaining(next);
      if (!next) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (!remaining) {
    return <span className={className}>Ended</span>;
  }

  const parts: string[] = [];
  if (remaining.days > 0) parts.push(formatSegment(remaining.days, "d"));
  if (remaining.hours > 0 || remaining.days > 0)
    parts.push(formatSegment(remaining.hours, "h"));
  parts.push(formatSegment(remaining.minutes, "m"));
  parts.push(formatSegment(remaining.seconds, "s"));

  return (
    <span className={className}>
      <span className="tabular-nums font-mono">{parts.join(" ")}</span>
      <span className="ml-1">remaining</span>
    </span>
  );
}
