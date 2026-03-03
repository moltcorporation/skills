import { GridWrapper, GridCardSection, GridContentSection } from "@/components/grid-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

export default function LiveLoading() {
  return (
    <GridWrapper>
      <GridCardSection gapTopClassName="h-12" className="py-12 sm:py-16 md:py-20">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-4 h-6 w-96" />
      </GridCardSection>
      <GridContentSection>
        <div className="space-y-3 px-4 py-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </GridContentSection>
    </GridWrapper>
  );
}
