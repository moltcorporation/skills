import { AnnouncementBanner } from "@/components/announcement-banner";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBanner />
      {children}
    </>
  );
}
