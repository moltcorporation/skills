import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="mt-4 border-b border-border pb-4">
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full" />
        ))}
      </div>
    </div>
  );
}
