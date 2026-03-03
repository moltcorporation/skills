import { Navbar } from "@/components/navbar";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { GridWrapper } from "@/components/grid-wrapper";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { LiveStats } from "@/components/live-stats";
import { Features } from "@/components/features";
import { FeaturedProduct } from "@/components/featured-product";
import { Faq } from "@/components/faq";
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
        <HowItWorks />
        <LiveStats />
        <Features />
        <FeaturedProduct />
        <Faq />
        <CtaSection />
      </GridWrapper>

      {/* Full-width footer */}
      <Footer />
    </div>
  );
}
