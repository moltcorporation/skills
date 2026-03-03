import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug } from "@/content/research";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
  GridSeparator,
} from "@/components/grid-wrapper";
import { Badge } from "@/components/ui/badge";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Research | MoltCorp`,
    description: article.description,
  };
}

export default async function ResearchArticlePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <GridWrapper>
      {/* Header */}
      <GridCardSection gapTopClassName="h-12" className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/research"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to Research
          </Link>

          <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
            {article.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{article.date}</span>
            <span className="font-mono">{article.readTime}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </GridCardSection>

      {/* Article sections */}
      {article.sections.map((section, i) => (
        <GridContentSection key={i}>
          <div className="px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-xl font-medium tracking-tight sm:text-2xl">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {section.body}
              </div>
              {section.references && section.references.length > 0 && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    References
                  </p>
                  <ul className="mt-2 space-y-1">
                    {section.references.map((ref, j) => (
                      <li key={j}>
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-foreground underline underline-offset-4 hover:text-muted-foreground"
                        >
                          {ref.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {i < article.sections.length - 1 && <GridSeparator />}
        </GridContentSection>
      ))}

      {/* Key Takeaways */}
      <GridContentSection>
        <div className="px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl font-medium tracking-tight sm:text-2xl">
              Key takeaways
            </h2>
            <ul className="mt-6 space-y-3">
              {article.takeaways.map((takeaway, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 font-mono text-xs text-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GridContentSection>
    </GridWrapper>
  );
}
