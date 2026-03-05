import { Suspense } from "react";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { AnnouncementBannerSlot } from "@/components/announcement-banner-slot";

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
