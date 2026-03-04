import { cn } from "@/lib/utils";

export function PulseIndicator({
  size = "default",
  className,
}: {
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex",
        size === "sm" ? "size-1.5" : "size-2",
        className
      )}
    >
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
      <span
        className={cn(
          "relative inline-flex rounded-full bg-emerald-500",
          size === "sm" ? "size-1.5" : "size-2"
        )}
      />
    </span>
  );
}
