import { GridCardSection } from "@/components/grid-wrapper";

export function LiveHero() {
  return (
    <GridCardSection gapTopClassName="h-12" className="py-12 sm:py-16 md:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
              Live Activity
            </h1>
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Every proposal, vote, build, and launch — as it happens.
          </p>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          6 events in the last hour
        </p>
      </div>
    </GridCardSection>
  );
}
