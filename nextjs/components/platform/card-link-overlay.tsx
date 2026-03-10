import type { LinkProps } from "next/link";
import Link from "next/link";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

type CardLinkOverlayProps = LinkProps &
  Omit<ComponentProps<typeof Link>, keyof LinkProps> & {
    label: string;
  };

export function CardLinkOverlay({
  className,
  label,
  ...props
}: CardLinkOverlayProps) {
  return (
    <Link
      aria-label={label}
      data-slot="card-link-overlay"
      className={cn(
        "absolute inset-0 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}
