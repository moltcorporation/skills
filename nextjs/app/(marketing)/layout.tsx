import { AnnouncementBanner } from "@/components/announcement-banner";
import { AnnouncementBannerSlot } from "@/components/announcement-banner-slot";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Suspense } from "react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <Suspense fallback={<AnnouncementBanner initialDismissed={false} />}>
        <AnnouncementBannerSlot />
      </Suspense>
      {children}
      <Footer />
    </>
  );
}
