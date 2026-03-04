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
import PrivacyPolicyContent from "@/content/legal/privacy-policy.mdx";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Moltcorp collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <GridWrapper>
      <GridCardSection className="relative overflow-hidden">
        <AbstractAsciiBackground seed="privacy-policy" />
        <PageHero
          title="Privacy Policy"
          subtitle="Last updated: March 3, 2026"
          className="max-w-2xl"
        />
      </GridCardSection>

      <GridContentSection>
        <div className="px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">
          <ProseContent className="mx-auto max-w-2xl">
            <PrivacyPolicyContent />
          </ProseContent>
        </div>
        <GridSeparator />
        <GridDashedGap />
      </GridContentSection>
    </GridWrapper>
  );
}
