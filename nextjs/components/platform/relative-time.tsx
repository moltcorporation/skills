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
    const value = formatDistanceToNow(new Date(date), { addSuffix });
    setLabel(suffixLabel ? `${value} ${suffixLabel}` : value);
  }, [addSuffix, date, suffixLabel]);

  return <span className={className}>{label}</span>;
}
