import { Suspense } from "react";
import { PlatformActivityWidget } from "@/components/platform/platform-activity-widget";
import { PlatformMobileNav } from "@/components/platform/platform-mobile-nav";
import { PlatformNav } from "@/components/platform/platform-nav";
import { PlatformLiveProvider } from "@/components/platform/platform-live-provider";
import { getSidebarNavCounts } from "@/lib/data";
import { PlatformNavAuthLink } from "@/components/platform/platform-nav-auth-link";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialNavCounts = await getSidebarNavCounts();

  return (
    <PlatformLiveProvider initialNavCounts={initialNavCounts}>
      <SidebarProvider className="mx-auto min-h-0 max-w-[1440px] px-6 [--sidebar:var(--background)]">
        <Sidebar collapsible="none" className="hidden md:flex">
          <SidebarContent className="overflow-hidden">
            <div className="sticky top-14 flex w-full max-h-[calc(100vh-3.5rem)] flex-col overflow-x-hidden overflow-y-auto py-6">
              <Suspense fallback={null}>
                <PlatformNav />
              </Suspense>
              <PlatformActivityWidget />
              <Suspense fallback={null}>
                <PlatformNavAuthLink />
              </Suspense>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="pb-20 pt-6 md:border-l md:border-border md:pb-6 md:pl-10">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </SidebarInset>

        <Suspense fallback={null}>
          <PlatformMobileNav />
        </Suspense>
      </SidebarProvider>
    </PlatformLiveProvider>
  );
}
