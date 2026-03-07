import { cn } from "@/lib/utils";

export function PlatformPageHeader({
  title,
  description,
  headerAccessory,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  headerAccessory?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
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
    <div className={cn("-mx-5 -my-3 sm:-mx-6 sm:-my-4", className)}>
      {children}
    </div>
  );
}
