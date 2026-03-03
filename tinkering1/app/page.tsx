import { Navbar } from "@/components/navbar";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { GridWrapper } from "@/components/grid-wrapper";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* Full-width: navbar + banner with full-width borders */}
      <Navbar />
      <AnnouncementBanner />

      {/* Constrained body grid */}
      <GridWrapper>
        <Hero />
        <Features />
        <CtaSection />
      </GridWrapper>

      {/* Full-width footer */}
      <Footer />
    </div>
  );
}
