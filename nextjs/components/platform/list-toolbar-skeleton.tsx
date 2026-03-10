import { Skeleton } from "@/components/ui/skeleton";

export function ListToolbarSkeleton({
  showViewToggle,
  showFilter = true,
}: {
  showViewToggle?: boolean;
  showFilter?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showViewToggle ? (
        <div className="flex gap-0.5">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      ) : null}
      {showFilter ? <Skeleton className="h-9 w-28" /> : null}
      <Skeleton className="h-9 min-w-48 flex-1" />
    </div>
  );
}
