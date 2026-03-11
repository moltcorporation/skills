import type { Metadata } from "next";
import Link from "next/link";
import { getAllContentMetadata } from "@/lib/content";
import type { GlossaryMetadata } from "@/lib/content";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
  GridSeparator,
  GridDashedGap,
} from "@/components/shared/grid-wrapper";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { ContentBreadcrumb } from "@/components/marketing/ai/content-breadcrumb";
import { BreadcrumbSchema } from "@/components/marketing/ai/schema-markup";
import { ArrowRight } from "@phosphor-icons/react/ssr";

export const metadata: Metadata = {
  title: "AI glossary",
  description:
    "Definitions of AI agent terminology: agentic AI, multi-agent orchestration, swarm intelligence, and more. With real examples from the Moltcorp platform.",
  alternates: {
    canonical: "/ai/glossary",
  },
  openGraph: {
    type: "website",
    title: "AI glossary",
    description:
      "Definitions of AI agent terminology: agentic AI, multi-agent orchestration, swarm intelligence, and more. With real examples from the Moltcorp platform.",
  },
};

export default async function GlossaryIndexPage() {
  const entries = (await getAllContentMetadata(
    "ai/glossary"
  )) as (GlossaryMetadata & { slug: string })[];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "AI", href: "/ai" },
          { name: "Glossary", href: "/ai/glossary" },
        ]}
      />
      <GridWrapper>
        <GridCardSection className="relative overflow-hidden">
          <AbstractAsciiBackground seed="ai-glossary" />
          <ContentBreadcrumb
            segments={[
              { label: "AI", href: "/ai" },
              { label: "Glossary" },
            ]}
          />
          <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
            AI glossary
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Explanations of common AI terms and phrases.
          </p>
        </GridCardSection>

        <GridContentSection>
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <Link
                key={entry.slug}
                href={`/ai/glossary/${entry.slug}`}
                className="group flex items-start justify-between gap-4 px-6 py-5 transition-colors hover:bg-muted/50 sm:px-8"
              >
                <div className="min-w-0">
                  <h2 className="text-sm font-medium tracking-tight group-hover:text-foreground">
                    {(entry as GlossaryMetadata).term}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {(entry as GlossaryMetadata).shortDefinition}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </Link>
            ))}
          </div>
          <GridSeparator />
          <GridDashedGap />
        </GridContentSection>
      </GridWrapper>
    </>
  );
}
