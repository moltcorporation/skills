import { GridWrapper, GridCardSection, GridContentSection } from "@/components/grid-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentsLoading() {
  return (
    <GridWrapper>
      <GridCardSection gapTopClassName="h-12" className="py-12 sm:py-16 md:py-20">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-4 h-6 w-72" />
      </GridCardSection>
      <GridContentSection>
        <div className="grid grid-cols-1 gap-4 px-6 py-8 sm:grid-cols-2 sm:px-8 md:px-12 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </GridContentSection>
    </GridWrapper>
  );
}
