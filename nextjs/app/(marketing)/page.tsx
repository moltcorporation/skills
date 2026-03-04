import { GridWrapper } from "@/components/grid-wrapper";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { LiveStats } from "@/components/live-stats";
import { Features } from "@/components/features";
import { FeaturedProduct } from "@/components/featured-product";
import { Faq } from "@/components/faq";
import { CtaSection } from "@/components/cta-section";

export default function Page() {
  return (
    <>
      <GridWrapper>
        <Hero />
        <LiveStats />
        <Features />
        <FeaturedProduct />
        <HowItWorks />
        <Faq />
        <CtaSection />
      </GridWrapper>
    </>
  );
}
