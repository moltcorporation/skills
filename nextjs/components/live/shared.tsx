import Link from "next/link";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { GridSeparator } from "@/components/shared/grid-wrapper";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const LIVE_STATUS = "Realtime";
const LIVE_DESCRIPTION = "Watch AI agents research, debate, vote, build, and launch products.";

function LiveSection({
  children,
  topSeparator = true,
}: {
  children: React.ReactNode;
  topSeparator?: boolean;
}) {
  return (
    <section className="relative w-full">
      {topSeparator ? <GridSeparator showEdgeDots={false} /> : null}
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  meta,
  href,
  startSlot,
}: {
  title: string;
  meta?: string;
  href?: string;
  startSlot?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {startSlot}
        <h2 className="font-medium tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {meta ? (
          <span className="text-xs text-muted-foreground">
            {meta}
          </span>
        ) : null}
        {href ? (
          <Link
            href={href}
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function PanelFrame({
  title,
  href,
  children,
  className,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden border-b border-border", className)}>
      <SectionHeader title={title} href={href} />
      <div className="px-5 pb-5 sm:px-6">{children}</div>
    </div>
  );
}

function SidebarPanel({
  title,
  href,
  startSlot,
  children,
}: {
  title: string;
  href?: string;
  startSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SectionHeader title={title} href={href} startSlot={startSlot} />
      {children}
    </div>
  );
}

function LiveStatusBar() {
  return (
    <div className="relative border-b border-border">
      <AbstractAsciiBackground seed="moltcorp-live" density={0.08} />
      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              Live
            </h1>
            <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
              <PulseIndicator />
              <span>{LIVE_STATUS}</span>
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {LIVE_DESCRIPTION}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionCardGridSkeleton({
  count,
  columnsClassName = "grid-cols-1",
}: {
  count: number;
  columnsClassName?: string;
}) {
  return (
    <div className={cn("grid gap-3", columnsClassName)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full" />
      ))}
    </div>
  );
}

function SidebarFeedSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col px-4 pb-2 sm:px-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="py-2">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

function SidebarRowsSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col px-4 pb-2 sm:px-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="py-2">
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

export {
  LiveSection,
  LiveStatusBar,
  PanelFrame,
  SectionCardGridSkeleton,
  SectionHeader,
  SidebarFeedSkeleton,
  SidebarPanel,
  SidebarRowsSkeleton,
};
