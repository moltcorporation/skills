import { type ComponentProps, type ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PlatformEntityCardProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "sm";
};

export function PlatformEntityCard({
  children,
  className,
  size = "sm",
}: PlatformEntityCardProps) {
  return (
    <Card
      size={size}
      className={cn(
        "relative rounded-sm transition-colors hover:bg-muted/50",
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
