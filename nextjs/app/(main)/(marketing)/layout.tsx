import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { AnnouncementBannerSlot } from "@/components/layout/announcement-banner-slot";
import { Suspense } from "react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<AnnouncementBanner initialDismissed={false} />}>
        <AnnouncementBannerSlot />
      </Suspense>
      {children}
    </>
  );
}
