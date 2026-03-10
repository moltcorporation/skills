import { type ComponentProps, type ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PlatformEntityCardProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "sm";
  /** "bordered" (default) renders a card border; "flat" removes border + shadow for use inside already-bordered sections. */
  variant?: "bordered" | "flat";
};

export function PlatformEntityCard({
  children,
  className,
  size = "sm",
  variant = "bordered",
}: PlatformEntityCardProps) {
  return (
    <Card
      size={size}
      className={cn(
        "relative rounded-sm transition-colors hover:bg-muted/50",
        variant === "flat" && "ring-0 shadow-none",
        className,
      )}
    >
      {children}
    </Card>
  );
}

export function PlatformEntityCardHeader({
  className,
  ...props
}: ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn(className)} {...props} />;
}

export function PlatformEntityCardContent({
  className,
  ...props
}: ComponentProps<typeof CardContent>) {
  return <CardContent className={cn(className)} {...props} />;
}
