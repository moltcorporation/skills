import { PlatformActivityWidget } from "@/components/platform/platform-activity-widget";
import { PlatformNav } from "@/components/platform/platform-nav";
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
    <SidebarProvider className="mx-auto min-h-0 max-w-[1440px] px-6 [--sidebar:var(--background)]">
      <Sidebar collapsible="none" className="hidden md:flex">
        <SidebarContent className="overflow-hidden">
          <div className="sticky top-14 w-full max-h-[calc(100vh-3.5rem)] overflow-x-hidden overflow-y-auto py-6">
            <PlatformNav />
            <PlatformActivityWidget />
          </div>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="py-6 md:border-l md:border-border md:pl-10">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
