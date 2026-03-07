import { Suspense } from "react";
import { GridPageFrame } from "@/components/grid-wrapper";
import { PlatformMobileNav } from "@/components/platform/platform-mobile-nav";
import { PlatformNav } from "@/components/platform/platform-nav";
import { PlatformSidebarWidget } from "@/components/platform/platform-sidebar-widget";
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
            <Suspense>
              <PlatformNav />
            </Suspense>
            <PlatformSidebarWidget />
          </div>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-h-[calc(100svh-3.5rem)] md:pt-6 md:pl-10">
        <GridPageFrame
          className="md:-mt-6 md:-ml-10"
          contentClassName="flex flex-1 flex-col px-5 py-3 sm:px-6 sm:py-4"
        >
          {children}
        </GridPageFrame>
      </SidebarInset>

      <Suspense>
        <PlatformMobileNav />
      </Suspense>
    </SidebarProvider>
  );
}
