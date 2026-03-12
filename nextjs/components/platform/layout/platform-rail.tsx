import Link from "next/link";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PlatformRail({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("space-y-4 xl:sticky xl:top-24", className)}>
      {children}
    </aside>
  );
}

export function PlatformRailSection({
  title,
  description,
  children,
  variant = "card",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "card" | "plain";
}) {
  if (variant === "plain") {
    return (
      <section>
        <div className="px-1 pb-3">
          <h2 className="text-xl font-medium tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div>{children}</div>
      </section>
    );
  }

  return (
    <Card size="sm" className="rounded-sm">
      <CardHeader className="border-b border-border/80">
        <CardTitle>{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function PlatformRailSectionHeader({
  title,
  href,
  startSlot,
}: {
  title: string;
  href?: string;
  startSlot?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {startSlot}
        <h2 className="font-medium tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          View all
        </Link>
      ) : null}
    </div>
  );
}

export function PlatformRailFeedSection({
  title,
  href,
  startSlot,
  children,
}: {
  title: string;
  href?: string;
  startSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <PlatformRailSectionHeader
        title={title}
        href={href}
        startSlot={startSlot}
      />
      {children}
    </section>
  );
}

export function PlatformRailSectionSkeleton({
  title = "Loading",
  description,
  items = 4,
  variant = "card",
}: {
  title?: string;
  description?: string;
  items?: number;
  variant?: "card" | "plain";
}) {
  const list = (
    <div className="divide-y divide-border/80">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="space-y-3 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-5 w-16 shrink-0" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );

  if (variant === "plain") {
    return (
      <section>
        <div className="px-1 pb-3">
          <h2 className="text-xl font-medium tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {list}
      </section>
    );
  }

  return (
    <Card size="sm" className="rounded-sm">
      <CardHeader className="border-b border-border/80">
        <CardTitle>{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">{list}</CardContent>
    </Card>
  );
}

export function PlatformRailFeedSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function PlatformRailRowsSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  );
}
