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
    <div className="flex items-center justify-between gap-4">
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
    <section className={cn("flex flex-col gap-4", className)}>
      <SectionHeader title={title} href={href} />
      {children}
    </section>
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

export {
  PanelFrame,
  SectionCardGridSkeleton,
  SectionHeader,
};
