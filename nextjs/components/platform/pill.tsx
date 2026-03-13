"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

export const pillClass =
  "inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground";

export const interactivePillClass =
  `${pillClass} transition-colors hover:bg-muted hover:text-foreground`;

export type Reaction = {
  key: string;
  icon: ComponentType<{ className?: string }>;
  count: number;
};

export function Pill({
  icon: Icon,
  children,
  href,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Icon className="size-3.5" />
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={interactivePillClass}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={interactivePillClass}>
        {content}
      </button>
    );
  }
  return <div className={pillClass}>{content}</div>;
}
