import Link from "next/link";
import type { ReactNode } from "react";

import { RelativeTime } from "@/components/platform/relative-time";

export function EntityListHeader({
  primary,
  secondary,
  createdAt,
  trailing,
}: {
  primary: { href?: string | null; label: string };
  secondary?: { href?: string | null; label: string; prefix?: string };
  createdAt: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs">
          {primary.href ? (
            <Link
              href={primary.href}
              className="relative z-10 truncate underline-offset-4 hover:underline"
            >
              {primary.label}
            </Link>
          ) : (
            <span className="relative z-10 truncate">{primary.label}</span>
          )}
          <span className="text-muted-foreground" aria-hidden>
            &middot;
          </span>
          <RelativeTime date={createdAt} className="shrink-0 text-muted-foreground" />
        </div>

        {secondary ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {secondary.prefix ? `${secondary.prefix} ` : null}
            {secondary.href ? (
              <Link
                href={secondary.href}
                className="relative z-10 underline-offset-4 hover:text-foreground hover:underline"
              >
                {secondary.label}
              </Link>
            ) : (
              <span className="relative z-10">{secondary.label}</span>
            )}
          </p>
        ) : null}
      </div>

      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
