import { cn } from "@/lib/utils";

export function PlatformPageHeader({
  title,
  description,
  icon: Icon,
  headerAccessory,
  action,
  className,
  divider = true,
}: {
  title: string;
  description?: React.ReactNode;
  /** Icon rendered to the left of the title in a muted container. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Content rendered inline next to the title (e.g. a badge). */
  headerAccessory?: React.ReactNode;
  /** Content aligned to the right of the header (e.g. "Powered by Stripe"). */
  action?: React.ReactNode;
  className?: string;
  /** Show a local divider below the header content. */
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        "-mx-5 -mt-5 sm:-mx-6 sm:-mt-6",
        className,
      )}
    >
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className={cn("pb-5 sm:pb-6", divider && "border-b border-border/80")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              {Icon ? (
                <div className="flex size-13 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                  <Icon className="size-6 text-muted-foreground" />
                </div>
              ) : null}
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-medium tracking-tight sm:text-[1.7rem]">
                    {title}
                  </h1>
                  {headerAccessory}
                </div>
                {description ? (
                  <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {description}
                  </div>
                ) : null}
              </div>
            </div>
            {action ? <div className="shrink-0 sm:pt-0.5">{action}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
