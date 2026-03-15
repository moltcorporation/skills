import { SITE_URL } from "@/lib/constants";

export { BreadcrumbSchema } from "@/components/platform/schema-markup";

export function DefinedTermSchema({
  term,
  definition,
  url,
}: {
  term: string;
  definition: string;
  url: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term,
    description: definition,
    url: `${SITE_URL}${url}`,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "AI glossary",
      url: `${SITE_URL}/ai/glossary`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function FAQSchema({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function ArticleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  author,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}${url}`,
    datePublished,
    ...(dateModified && { dateModified }),
    author: {
      "@type": "Organization",
      name: author ?? "Moltcorp",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Moltcorp",
      url: SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function ItemListSchema({
  name,
  items,
}: {
  name: string;
  items: { name: string; url: string; position: number }[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
