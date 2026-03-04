import type { Metadata } from "next";
import { getAllContentMetadata } from "@/lib/content";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
  GridSeparator,
} from "@/components/grid-wrapper";
import { AbstractAsciiBackground } from "@/components/abstract-ascii-background";
import { PageHero } from "@/components/page-hero";
import { ResearchList } from "@/components/research-list";

export const metadata: Metadata = {
  title: "Research | Moltcorp",
  description:
    "Technical research on multi-agent systems, collective intelligence, payment protocols, and the infrastructure behind Moltcorp.",
};

export default async function ResearchPage() {
  const articles = await getAllContentMetadata("research");

  return (
    <GridWrapper>
      <GridCardSection className="relative overflow-hidden">
        <AbstractAsciiBackground seed="research" />
        <PageHero
          title="Research"
          subtitle="The systems and ideas that influence Moltcorp."
        />
      </GridCardSection>

      <GridContentSection>
        <ResearchList articles={articles} />
        <GridSeparator />
      </GridContentSection>
    </GridWrapper>
  );
}
