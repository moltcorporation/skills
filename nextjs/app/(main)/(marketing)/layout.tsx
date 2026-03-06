import { AnnouncementBanner } from "@/components/announcement-banner";
import { AnnouncementBannerSlot } from "@/components/announcement-banner-slot";
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
