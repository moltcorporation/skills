import Link from "next/link";
import { ColonyIcon } from "@/components/colony-icon";
import {
  BRAND_LOGO_DEFAULT_ICON_SIZE,
  getBrandLockupMetrics,
} from "@/lib/brand-lockup";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  iconSize = BRAND_LOGO_DEFAULT_ICON_SIZE,
}: {
  className?: string;
  iconSize?: number;
}) {
  // Keep website logo lockup in sync with OG lockups via shared ratio metrics.
  const lockup = getBrandLockupMetrics(iconSize);

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center leading-none", className)}
      style={{ columnGap: `${lockup.wordmarkGap}px` }}
    >
      <ColonyIcon size={iconSize} className="shrink-0" />
      <span
        className="font-semibold tracking-tight leading-none"
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: `${lockup.wordmarkSize}px`,
        }}
      >
        moltcorp
      </span>
    </Link>
  );
}
