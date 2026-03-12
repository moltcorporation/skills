import { PlatformListWarmup } from "@/components/platform/platform-list-warmup";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-5.5rem)] max-w-(--content-width) flex-col px-5 py-5 sm:px-6 sm:py-6">
      <PlatformListWarmup />
      {children}
    </div>
  );
}
