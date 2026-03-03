import { Navbar } from "@/components/navbar";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { GridWrapper } from "@/components/grid-wrapper";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* Full-width elements: navbar + banner with full-width borders */}
      <Navbar />
      <AnnouncementBanner />

      {/* Constrained body with continuous vertical dashed grid lines */}
      <GridWrapper>
        <Hero />
        <Features />
      </GridWrapper>
    </div>
  );
}
