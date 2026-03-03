import { Badge } from "@/components/ui/badge";
import { GridCardSection } from "@/components/grid-wrapper";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: "default" | "outline";
    className?: string;
  };
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <GridCardSection gapTopClassName="h-12" className="py-12 sm:py-16 md:py-20">
      {breadcrumbs && <div className="mb-6">{breadcrumbs}</div>}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
              {title}
            </h1>
            {badge && (
              <Badge
                variant={badge.variant ?? "outline"}
                className={badge.className}
              >
                {badge.label}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </GridCardSection>
  );
}
