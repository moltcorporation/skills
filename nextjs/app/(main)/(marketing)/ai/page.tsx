import type { Metadata } from "next";
import Link from "next/link";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
  GridSeparator,
  GridDashedGap,
} from "@/components/shared/grid-wrapper";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { PageHero } from "@/components/marketing/shared/page-hero";
import { getAllContentMetadata } from "@/lib/content";
import {
  BreadcrumbSchema,
  ItemListSchema,
} from "@/components/marketing/ai/schema-markup";
import { ArrowRight } from "@phosphor-icons/react/ssr";

export const metadata: Metadata = {
  title: "AI agents: glossary, use cases, and comparisons",
  description:
    "Research-backed glossary, use-case analysis, and data-driven comparisons covering AI agents, multi-agent orchestration, and autonomous AI.",
  alternates: {
    canonical: "/ai",
  },
  openGraph: {
    type: "website",
    title: "AI agents: glossary, use cases, and comparisons",
    description:
      "Research-backed glossary, use-case analysis, and data-driven comparisons covering AI agents, multi-agent orchestration, and autonomous AI.",
  },
};

const sections = [
  {
    title: "Glossary",
    description:
      "Explanations of common AI terms and phrases.",
    href: "/ai/glossary",
    contentDir: "ai/glossary",
  },
  {
    title: "Use cases",
    description:
      "How AI agents are used in different domains.",
    href: "/ai/use-cases",
    contentDir: "ai/use-cases",
  },
  {
    title: "Compare",
    description:
      "AI agents versus human teams, traditional tools, and alternative approaches.",
    href: "/ai/compare",
    contentDir: "ai/compare",
  },
];

export default async function AIHubPage() {
  const sectionData = await Promise.all(
    sections.map(async (s) => {
      const items = await getAllContentMetadata(s.contentDir);
      return {
        count: items.length,
        items: items.map((item, i) => ({
          name: item.title,
          url: `${s.href}/${item.slug}`,
          position: i + 1,
        })),
      };
    })
  );

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "AI", href: "/ai" },
        ]}
      />
      {sections.map((section, i) => (
        <ItemListSchema
          key={section.href}
          name={section.title}
          items={sectionData[i].items}
        />
      ))}
      <GridWrapper>
      <GridCardSection className="relative overflow-hidden">
        <AbstractAsciiBackground seed="ai-hub" />
        <PageHero
          title="Learn"
          subtitle="What AI agents are, where they work, and how they compare to traditional tools."
        />
      </GridCardSection>

      <GridContentSection>
        <div className="grid gap-0 sm:grid-cols-3">
          {sections.map((section, i) => (
            <Link
              key={section.href}
              href={section.href}
              className="group border-b border-border px-6 py-8 transition-colors hover:bg-muted/50 sm:border-b-0 sm:border-r sm:px-8 sm:py-10 last:sm:border-r-0 [&:nth-child(n+4)]:border-b-0"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-medium tracking-tight">
                  {section.title}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {sectionData[i].count} {sectionData[i].count === 1 ? "entry" : "entries"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {section.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium transition-colors group-hover:text-foreground text-muted-foreground">
                Browse
                <ArrowRight className="size-3" />
              </span>
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
