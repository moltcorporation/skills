import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface EntityCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function EntityCard({ title, children, className }: EntityCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-0 p-0">{children}</CardContent>
    </Card>
  );
}

interface EntityCardRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function EntityCardRow({ label, children, className }: EntityCardRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2.5 text-xs",
        className
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{children}</span>
    </div>
  );
}
