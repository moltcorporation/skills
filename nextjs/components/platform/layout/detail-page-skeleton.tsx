import { Skeleton } from "@/components/ui/skeleton";

import {
  PlatformRail,
  PlatformRailFeedSection,
  PlatformRailFeedSkeleton,
  PlatformRailSectionSkeleton,
} from "./platform-rail";

type DetailPageSkeletonProps = {
  header: "avatar" | "eyebrow" | "simple";
  tabs?: string[];
  titleWidth?: string;
  badgeWidth?: string;
  showBadge?: boolean;
  showAction?: boolean;
  descriptionLines?: string[];
  metaLines?: string[];
  contentRows?: string[];
  rail?: {
    kind: "feed" | "card";
    title?: string;
    description?: string;
    itemCount?: number;
  };
};

export function DetailPageSkeleton({
  header,
  tabs = [],
  titleWidth = "w-3/4",
  badgeWidth = "w-14",
  showBadge = true,
  showAction = true,
  descriptionLines = [],
  metaLines = [],
  contentRows = [],
  rail,
}: DetailPageSkeletonProps) {
  return (
    <div>
      <div className="-mx-5 -mt-5 overflow-hidden sm:-mx-6 sm:-mt-6">
        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-(--content-width)">
            <div className="relative grid grid-cols-1 items-start gap-y-4 md:grid-cols-[1.5rem_minmax(0,1fr)_auto] md:gap-x-4 md:gap-y-0">
              <div className="hidden md:block" />
              <div className="space-y-4 sm:space-y-5">
                {header === "avatar" ? (
                  <div className="flex items-start gap-4">
                    <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
                    <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className={`h-7 ${titleWidth}`} />
                      {showBadge ? (
                        <Skeleton className={`h-5 ${badgeWidth}`} />
                      ) : null}
                    </div>
                      {descriptionLines.map((width, index) => (
                        <Skeleton key={index} className={`h-4 ${width}`} />
                      ))}
                      {metaLines.map((width, index) => (
                        <Skeleton key={`meta-${index}`} className={`h-3 ${width}`} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {header === "eyebrow" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-5 rounded-full" />
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className={`h-7 ${titleWidth}`} />
                        {showBadge ? (
                          <Skeleton className={`h-5 ${badgeWidth}`} />
                        ) : null}
                      </div>
                      {descriptionLines.map((width, index) => (
                        <Skeleton key={index} className={`h-4 ${width}`} />
                      ))}
                      {metaLines.map((width, index) => (
                        <Skeleton key={`meta-${index}`} className={`h-3 ${width}`} />
                      ))}
                    </div>
                  </>
                ) : null}

                {header === "simple" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className={`h-7 ${titleWidth}`} />
                      {showBadge ? (
                        <Skeleton className={`h-5 ${badgeWidth}`} />
                      ) : null}
                    </div>
                    {descriptionLines.map((width, index) => (
                      <Skeleton key={index} className={`h-4 ${width}`} />
                    ))}
                    {metaLines.map((width, index) => (
                      <Skeleton key={`meta-${index}`} className={`h-3 ${width}`} />
                    ))}
                  </div>
                ) : null}
              </div>
              {showAction ? (
                <div className="flex items-center gap-2 max-md:absolute max-md:right-0 max-md:top-0">
                  <Skeleton className="h-8 w-8" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-(--content-width) gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-8">
        <div className="min-w-0">
          {tabs.length > 0 ? (
            <div className="md:pl-10">
              <div className="w-full border-b border-border/80">
                <div className="flex w-fit gap-4 pb-1">
                  {tabs.map((width, index) => (
                    <Skeleton key={index} className={`h-4 ${width}`} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <div className={`${tabs.length > 0 ? "pt-5" : "py-6"} space-y-3 md:pl-10`}>
            {contentRows.map((height, index) => (
              <Skeleton key={index} className={`${height} w-full`} />
            ))}
          </div>
        </div>

        {rail ? (
          <PlatformRail>
            {rail.kind === "feed" ? (
              <PlatformRailFeedSection title={rail.title ?? "Activity"}>
                <PlatformRailFeedSkeleton count={rail.itemCount ?? 6} />
              </PlatformRailFeedSection>
            ) : (
              <PlatformRailSectionSkeleton
                title={rail.title ?? "Latest posts"}
                description={rail.description}
                items={rail.itemCount ?? 5}
              />
            )}
          </PlatformRail>
        ) : null}
      </div>
    </div>
  );
}
