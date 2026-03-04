"use client";

import { useState } from "react";
import Link from "next/link";
import type { ContentMetadata } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GridSeparator, GridDashedGap } from "@/components/grid-wrapper";

const AUTHOR = {
  name: "Stuart Green",
  avatar:
    "https://pbs.twimg.com/profile_images/1830924550227304452/dTw4m-FD_400x400.jpg",
};

type Article = ContentMetadata & { slug: string };

/** Continuous vertical center line for sm+ two-column grids. */
function SmCenterLine() {
  return (
    <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 border-l border-border sm:block" />
  );
}

function ArticleCellContent({ article }: { article: Article }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar className="size-6">
          <AvatarImage src={AUTHOR.avatar} alt={AUTHOR.name} />
          <AvatarFallback className="text-[10px]">SG</AvatarFallback>
        </Avatar>
        <span className="text-sm text-muted-foreground">{AUTHOR.name}</span>
        <span className="ml-auto flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>{article.date}</span>
          <span>/</span>
          <span className="font-medium text-foreground">
            {article.category}
          </span>
        </span>
      </div>
      <h3 className="mt-8 text-lg font-semibold leading-snug sm:mt-10">
        {article.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
        {article.description}
      </p>
      <span className="mt-4 block font-mono text-xs text-muted-foreground">
        {article.readTime}
      </span>
    </>
  );
}

/**
 * Renders articles in a 2-column grid with proper full-width row dividers.
 * Each row is its own 2-col grid so row borders span the full width.
 */
function ArticleGrid({ articles }: { articles: Article[] }) {
  // Group articles into pairs (rows)
  const rows: Article[][] = [];
  for (let i = 0; i < articles.length; i += 2) {
    rows.push(articles.slice(i, i + 2));
  }

  return (
    <div className="relative">
      <SmCenterLine />
      {rows.map((row, rowIndex) => (
        <div key={row.map((a) => a.slug).join("-")}>
          {/* Full-width row border between rows */}
          {rowIndex > 0 && (
            <div className="hidden h-px w-full border-t border-border sm:block" />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {row.map((article, colIndex) => (
              <Link
                key={article.slug}
                href={`/research/${article.slug}`}
                className="relative block px-6 py-8 transition-colors hover:bg-muted/50 sm:px-8 sm:py-10 md:px-12"
              >
                {/* Mobile row border */}
                {(rowIndex > 0 || colIndex > 0) && (
                  <div className="pointer-events-none absolute top-0 right-0 left-0 h-px border-t border-border sm:hidden" />
                )}
                <ArticleCellContent article={article} />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResearchList({ articles }: { articles: Article[] }) {
  const categories = Array.from(new Set(articles.map((a) => a.category)));
  const [active, setActive] = useState<string | null>(null);

  const hero = articles[0];
  const featured = articles.slice(1, 3);
  // All posts section includes every article (independent of featured)
  const filtered = active
    ? articles.filter((a) => a.category === active)
    : articles;

  return (
    <>
      {/* Hero — full-width top article */}
      <Link
        href={`/research/${hero.slug}`}
        className="block px-6 py-8 transition-colors hover:bg-muted/50 sm:px-8 sm:py-10 md:px-12"
      >
        <div className="flex items-center gap-3">
          <Avatar className="size-6">
            <AvatarImage src={AUTHOR.avatar} alt={AUTHOR.name} />
            <AvatarFallback className="text-[10px]">SG</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {AUTHOR.name}
          </span>
          <span className="ml-auto flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span>{hero.date}</span>
            <span>/</span>
            <span className="font-medium text-foreground">
              {hero.category}
            </span>
          </span>
        </div>
        <h3 className="mt-8 text-2xl font-semibold leading-snug sm:mt-10 sm:text-3xl">
          {hero.title}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {hero.description}
        </p>
        <span className="mt-4 block font-mono text-xs text-muted-foreground">
          {hero.readTime}
        </span>
      </Link>

      {/* Two side-by-side featured articles */}
      <div className="relative">
        <SmCenterLine />
        <div className="h-px w-full border-t border-border" />
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {featured.map((article, i) => (
            <Link
              key={article.slug}
              href={`/research/${article.slug}`}
              className="relative block px-6 py-8 transition-colors hover:bg-muted/50 sm:px-8 sm:py-10 md:px-12"
            >
              {/* Mobile border between featured items */}
              {i > 0 && (
                <div className="pointer-events-none absolute top-0 right-0 left-0 h-px border-t border-border sm:hidden" />
              )}
              <div className="flex items-center gap-3">
                <Avatar className="size-6">
                  <AvatarImage src={AUTHOR.avatar} alt={AUTHOR.name} />
                  <AvatarFallback className="text-[10px]">SG</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{AUTHOR.name}</span>
                <span className="ml-auto flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span>{article.date}</span>
                  <span>/</span>
                  <span className="font-medium text-foreground">
                    {article.category}
                  </span>
                </span>
              </div>
              <h3 className="mt-12 text-lg font-semibold leading-snug sm:mt-14">
                {article.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {article.description}
              </p>
              <span className="mt-4 block font-mono text-xs text-muted-foreground">
                {article.readTime}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Gap between featured and rest */}
      <GridSeparator />
      <GridDashedGap />
      <GridSeparator />

      {/* Category filter tags */}
      <div className="flex flex-wrap gap-2 px-6 py-6 sm:px-8 md:px-12">
        <Button
          variant={active === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActive(null)}
          className="h-8 text-xs"
        >
          All posts
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={active === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActive(cat)}
            className="h-8 text-xs"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Separator */}
      <GridSeparator />

      {/* Articles grid */}
      {filtered.length > 0 ? (
        <ArticleGrid articles={filtered} />
      ) : (
        <div className="px-6 py-16 text-center text-sm text-muted-foreground sm:px-8 md:px-12">
          No articles in this category.
        </div>
      )}
    </>
  );
}
