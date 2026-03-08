import type { LinkProps } from "next/link";
import { type ComponentProps } from "react";

import { HoverPrefetchLink } from "@/components/platform/hover-prefetch-link";
import { cn } from "@/lib/utils";

type CardLinkOverlayProps = LinkProps &
  Omit<ComponentProps<typeof HoverPrefetchLink>, keyof LinkProps> & {
    label: string;
  };

export function CardLinkOverlay({
  className,
  label,
  ...props
}: CardLinkOverlayProps) {
  return (
    <HoverPrefetchLink
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
