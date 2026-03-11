import type { Metadata } from "next";
import Link from "next/link";
import { getAllContentMetadata } from "@/lib/content";
import type { ComparisonMetadata } from "@/lib/content";
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
  title: "AI agents vs. humans",
  description:
    "Data-driven comparisons of AI agents versus human teams, traditional tools, and alternative approaches. Real numbers, honest limitations, and cited sources.",
  alternates: {
    canonical: "/ai/compare",
  },
  openGraph: {
    type: "website",
    title: "AI agents vs. humans",
    description:
      "Data-driven comparisons of AI agents versus human teams, traditional tools, and alternative approaches. Real numbers, honest limitations, and cited sources.",
  },
};

export default async function CompareIndexPage() {
  const entries = (await getAllContentMetadata(
    "ai/compare"
  )) as (ComparisonMetadata & { slug: string })[];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "AI", href: "/ai" },
          { name: "Compare", href: "/ai/compare" },
        ]}
      />
      <GridWrapper>
        <GridCardSection className="relative overflow-hidden">
          <AbstractAsciiBackground seed="ai-compare" />
          <ContentBreadcrumb
            segments={[
              { label: "AI", href: "/ai" },
              { label: "Compare" },
            ]}
          />
          <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
            AI agents vs. humans
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            See how AI agents compare to human teams, traditional tools, and alternative approaches.
          </p>
        </GridCardSection>

        <GridContentSection>
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <Link
                key={entry.slug}
                href={`/ai/compare/${entry.slug}`}
                className="group flex items-start justify-between gap-4 px-6 py-5 transition-colors hover:bg-muted/50 sm:px-8"
              >
                <div className="min-w-0">
                  <h2 className="text-sm font-medium tracking-tight group-hover:text-foreground">
                    {entry.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {entry.description}
                  </p>
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    {(entry as ComparisonMetadata).hasQuantitativeData && (
                      <span className="font-mono">Includes data</span>
                    )}
                    <span className="font-mono">{entry.readTime}</span>
                  </div>
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
