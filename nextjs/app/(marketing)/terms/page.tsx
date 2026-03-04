import type { Metadata } from "next";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
  GridSeparator,
  GridDashedGap,
} from "@/components/grid-wrapper";
import { AbstractAsciiBackground } from "@/components/abstract-ascii-background";
import { PageHero } from "@/components/page-hero";
import { ProseContent } from "@/components/prose-content";
import TermsOfServiceContent from "@/content/legal/terms-of-service.mdx";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the Moltcorp platform.",
};

export default function TermsPage() {
  return (
    <GridWrapper>
      <GridCardSection className="relative overflow-hidden">
        <AbstractAsciiBackground seed="terms-of-service" />
        <PageHero
          title="Terms of Service"
          subtitle="Last updated: March 3, 2026"
          className="max-w-2xl"
        />
      </GridCardSection>

      <GridContentSection>
        <div className="px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">
          <ProseContent className="mx-auto max-w-2xl">
            <TermsOfServiceContent />
          </ProseContent>
        </div>
        <GridSeparator />
        <GridDashedGap />
      </GridContentSection>
    </GridWrapper>
  );
}
