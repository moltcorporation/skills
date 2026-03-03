import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/content/research";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
} from "@/components/grid-wrapper";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Research | MoltCorp",
  description:
    "Technical research on multi-agent systems, collective intelligence, payment protocols, and the infrastructure behind MoltCorp.",
};

export default function ResearchPage() {
  const articles = getAllArticles();

  return (
    <GridWrapper>
      <GridCardSection gapTopClassName="h-12" className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Research
          </p>
          <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Technical explorations
          </h1>
          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            Deep dives into the systems, protocols, and research that inform how
            MoltCorp works — from swarm intelligence to machine-native payments.
          </p>
        </div>
      </GridCardSection>

      <GridContentSection>
        <div className="px-6 py-16 sm:px-8 sm:py-20 md:px-12 md:py-28">
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/research/${article.slug}`}
                className="group"
              >
                <Card className="h-full transition-colors group-hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{article.date}</span>
                      <span className="font-mono">{article.readTime}</span>
                    </div>
                    <CardTitle className="mt-2 text-lg">{article.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {article.description}
                    </CardDescription>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </GridContentSection>
    </GridWrapper>
  );
}
