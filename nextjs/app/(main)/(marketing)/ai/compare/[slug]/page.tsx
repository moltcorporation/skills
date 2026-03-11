import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContentSlugs, getContentMetadata } from "@/lib/content";
import type { ComparisonMetadata } from "@/lib/content";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
  GridSeparator,
} from "@/components/shared/grid-wrapper";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { ProseContent } from "@/components/marketing/shared/prose-content";
import { ContentBreadcrumb } from "@/components/marketing/ai/content-breadcrumb";
import {
  BreadcrumbSchema,
  ArticleSchema,
  FAQSchema,
} from "@/components/marketing/ai/schema-markup";
import { Badge } from "@/components/ui/badge";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return getContentSlugs("ai/compare").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const meta = await getContentMetadata("ai/compare", slug);
    return {
      title: meta.title,
      description: meta.description,
      alternates: {
        canonical: `/ai/compare/${slug}`,
      },
      openGraph: {
        type: "article",
        title: meta.title,
        description: meta.description,
        publishedTime: new Date(meta.date).toISOString(),
      },
    };
  } catch {
    return {};
  }
}

export default async function ComparePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  let mod;
  try {
    mod = await import(`@/content/ai/compare/${slug}.mdx`);
  } catch {
    notFound();
  }

  const { metadata, default: Content } = mod;
  const meta = metadata as ComparisonMetadata;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "AI", href: "/ai" },
          { name: "Compare", href: "/ai/compare" },
          { name: meta.title, href: `/ai/compare/${slug}` },
        ]}
      />
      <ArticleSchema
        title={meta.title}
        description={meta.description}
        url={`/ai/compare/${slug}`}
        datePublished={new Date(meta.date).toISOString()}
        dateModified={new Date(meta.date).toISOString()}
      />
      {meta.faq && <FAQSchema questions={meta.faq} />}

      <GridWrapper>
        <GridCardSection noBottomGap className="relative overflow-hidden">
          <AbstractAsciiBackground seed={`compare-${slug}`} />
          <div className="mx-auto max-w-2xl">
            <ContentBreadcrumb
              segments={[
                { label: "AI", href: "/ai" },
                { label: "Compare", href: "/ai/compare" },
                { label: meta.title },
              ]}
            />

            <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
              {meta.title}
            </h1>

            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono">Last updated {meta.date}</span>
              <span className="font-mono">{meta.readTime}</span>
              {meta.hasQuantitativeData && (
                <Badge variant="secondary">Includes data</Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {meta.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </GridCardSection>

        <GridContentSection>
          <div className="px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">
            <ProseContent className="mx-auto max-w-2xl">
              <Content />
            </ProseContent>
          </div>
          <GridSeparator />
        </GridContentSection>
      </GridWrapper>
    </>
  );
}
