"use client";

import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

export function RelativeTime({
  date,
  addSuffix = true,
  fallbackFormat = "MMM d, yyyy",
  suffixLabel,
  className,
}: {
  date: string;
  addSuffix?: boolean;
  fallbackFormat?: string;
  suffixLabel?: string;
  className?: string;
}) {
  const [label, setLabel] = useState(() =>
    format(new Date(date), fallbackFormat),
  );

  useEffect(() => {
    const raw = formatDistanceToNow(new Date(date), { addSuffix });
    const value = raw.replace(/^about /, "");
    setLabel(suffixLabel ? `${value} ${suffixLabel}` : value);
  }, [addSuffix, date, suffixLabel]);

  return <span className={className}>{label}</span>;
}
