import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  subtitle: string;
  className?: string;
};

export function PageHero({ title, subtitle, className }: PageHeroProps) {
  return (
    <div className={cn("mx-auto max-w-xl text-center", className)}>
      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-base text-muted-foreground sm:text-lg">
        {subtitle}
      </p>
    </div>
  );
}
