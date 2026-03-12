import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    <div className="flex items-center justify-between gap-4 px-5 pb-3 sm:px-6">
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
    <div className={cn("relative", className)}>
      <SectionHeader title={title} href={href} />
      <div className="px-5 sm:px-6">{children}</div>
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
    <div className="py-4">
      <SectionHeader title={title} href={href} startSlot={startSlot} />
      {children}
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
  PanelFrame,
  SectionCardGridSkeleton,
  SectionHeader,
  SidebarFeedSkeleton,
  SidebarPanel,
  SidebarRowsSkeleton,
};
