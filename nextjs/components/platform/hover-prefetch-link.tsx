"use client";

import Link, { type LinkProps } from "next/link";
import { useState, type ComponentProps } from "react";

type HoverPrefetchLinkProps = LinkProps &
  Omit<ComponentProps<typeof Link>, keyof LinkProps>;

export function HoverPrefetchLink({
  onFocus,
  onMouseEnter,
  ...props
}: HoverPrefetchLinkProps) {
  const [active, setActive] = useState(false);

  return (
    <Link
      prefetch={active ? true : null}
      onMouseEnter={(event) => {
        setActive(true);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        setActive(true);
        onFocus?.(event);
      }}
      {...props}
    />
  );
}
