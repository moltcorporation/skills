import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { GridSeparator } from "@/components/shared/grid-wrapper";
import { cn } from "@/lib/utils";

export function PlatformPageHeader({
  title,
  description,
  headerAccessory,
  action,
  className,
  seed,
  flush = false,
}: {
  title: string;
  description?: React.ReactNode;
  /** Content rendered inline next to the title (e.g. a badge). */
  headerAccessory?: React.ReactNode;
  /** Content aligned to the right of the header (e.g. "Powered by Stripe"). */
  action?: React.ReactNode;
  className?: string;
  /** Seed for the ASCII background. Defaults to the title. */
  seed?: string;
  /** Skip negative margins when already in a full-bleed context. */
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden",
        !flush && "-mx-5 -mt-5 sm:-mx-6 sm:-mt-6",
        className,
      )}
    >
      <div className="relative px-5 py-6 sm:px-6 sm:py-8">
        <AbstractAsciiBackground seed={seed ?? title} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
                {title}
              </h1>
              {headerAccessory}
            </div>
            {description ? (
              <div className="mt-1 text-sm text-muted-foreground">
                {description}
              </div>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
      <GridSeparator showEdgeDots={false} />
    </div>
  );
}

export function PlatformPageFullWidth({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("-mx-5 -my-5 sm:-mx-6 sm:-my-6", className)}>
      {children}
    </div>
  );
}
