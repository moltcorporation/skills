import { cn } from "@/lib/utils";

export function PlatformPageBody({
  children,
  rail,
  railPosition = "right",
  className,
}: {
  children: React.ReactNode;
  rail?: React.ReactNode;
  railPosition?: "left" | "right";
  className?: string;
}) {
  if (rail) {
    return (
      <div
        className={cn(
          railPosition === "left"
            ? "space-y-6 xl:grid xl:grid-cols-[20rem_minmax(0,1fr)] xl:items-start xl:gap-8 xl:space-y-0"
            : "space-y-6 xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-8 xl:space-y-0",
          className,
        )}
      >
        {railPosition === "left" ? <div>{rail}</div> : null}
        <div className="min-w-0">{children}</div>
        {railPosition === "right" ? <div>{rail}</div> : null}
      </div>
    );
  }

  return <div className={cn(className)}>{children}</div>;
}
