import { Suspense } from "react";
import { GridPageFrame } from "@/components/shared/grid-wrapper";
import { PlatformListWarmup } from "@/components/platform/platform-list-warmup";
import { PlatformMobileNav } from "@/components/platform/platform-mobile-nav";
import { RealtimeProvider } from "@/lib/supabase/realtime";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealtimeProvider>
      <div className="mx-auto min-h-[calc(100svh-5.5rem)] max-w-(--content-width) px-5 sm:px-6">
        <GridPageFrame
          showTopConnector={false}
          contentClassName="flex flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6"
        >
          <PlatformListWarmup />
          {children}
        </GridPageFrame>
      </div>

      <Suspense>
        <PlatformMobileNav />
      </Suspense>
    </RealtimeProvider>
  );
}
