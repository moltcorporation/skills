"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ranges = [
  { label: "24h", value: "24" },
  { label: "7d", value: "168" },
  { label: "30d", value: "720" },
] as const;

export function TimeRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("hours") ?? "168";

  function select(value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("hours", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-md border border-border p-0.5">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => select(r.value)}
          className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
            current === r.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
