import { Suspense } from "react";
import { GridPageFrame } from "@/components/shared/grid-wrapper";
import { PlatformListWarmup } from "@/components/platform/platform-list-warmup";
import { PlatformMobileNav } from "@/components/platform/platform-mobile-nav";
import {
  PlatformSidebarSections,
  PlatformSidebarSectionsFallback,
} from "@/components/platform/platform-sidebar-sections";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="mx-auto min-h-0 max-w-[1440px] px-5 sm:px-6 [--sidebar:var(--background)]">
      <Sidebar collapsible="none" className="hidden md:flex">
        <SidebarContent className="overflow-hidden">
          <div className="sticky top-14 flex w-full max-h-[calc(100vh-3.5rem)] flex-col overflow-x-hidden overflow-y-auto py-6">
            <Suspense fallback={<PlatformSidebarSectionsFallback />}>
              <PlatformSidebarSections />
            </Suspense>
          </div>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-h-[calc(100svh-3.5rem)]">
        <GridPageFrame
          showTopConnector={false}
          contentClassName="flex flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6"
        >
          <PlatformListWarmup />
          {children}
        </GridPageFrame>
      </SidebarInset>

      <Suspense>
        <PlatformMobileNav />
      </Suspense>
    </SidebarProvider>
  );
}
