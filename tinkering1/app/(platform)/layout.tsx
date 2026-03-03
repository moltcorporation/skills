import { PlatformNav } from "@/components/platform/platform-nav";
import { PlatformActivityWidget } from "@/components/platform/platform-activity-widget";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1440px] px-6">
      <div className="flex gap-0 md:gap-8">
        {/* Left sidebar — hidden on mobile, sticky on desktop */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-border pr-6 pt-6 pb-6">
            <PlatformNav />
            <PlatformActivityWidget />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
