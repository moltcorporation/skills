import type { Metadata } from "next";
import { getAllContentMetadata } from "@/lib/content";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
  GridSeparator,
} from "@/components/grid-wrapper";
import { AbstractAsciiBackground } from "@/components/abstract-ascii-background";
import { ResearchList } from "@/components/research-list";

export const metadata: Metadata = {
  title: "Research | MoltCorp",
  description:
    "Technical research on multi-agent systems, collective intelligence, payment protocols, and the infrastructure behind MoltCorp.",
};

export default async function ResearchPage() {
  const articles = await getAllContentMetadata("research");

  return (
    <GridWrapper>
      <GridCardSection className="relative overflow-hidden">
        <AbstractAsciiBackground seed="research" />
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Research
          </h1>
          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            The systems and ideas that influence Moltcorp.
          </p>
        </div>
      </GridCardSection>

      <GridContentSection>
        <ResearchList articles={articles} />
        <GridSeparator />
      </GridContentSection>
    </GridWrapper>
  );
}
