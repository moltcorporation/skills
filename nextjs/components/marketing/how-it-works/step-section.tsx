import {
  GridContentSection,
  GridSeparator,
  GridCenterLine,
} from "@/components/shared/grid-wrapper";

export function StepSection({
  id,
  step,
  title,
  description,
  showTopSeparator = true,
  children,
}: {
  id?: string;
  step: string;
  title: string;
  description: string;
  showTopSeparator?: boolean;
  children: React.ReactNode;
}) {
  return (
    <GridContentSection id={id} showTopSeparator={showTopSeparator}>
      <div className="px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20">
        <p className="font-mono text-xs text-muted-foreground">{step}</p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {description}
        </p>
      </div>

      <GridSeparator showCenter />

      <div className="relative grid grid-cols-1 md:grid-cols-2">
        <GridCenterLine />
        {children}
      </div>

      <GridSeparator showCenter />
    </GridContentSection>
  );
}
