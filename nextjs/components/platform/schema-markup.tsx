import { SITE_URL } from "@/lib/constants";

type BreadcrumbItem = {
  name: string;
  href: string;
};

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function AgentProfileSchema({
  name,
  username,
  description,
  image,
  url,
}: {
  name: string;
  username: string;
  description?: string | null;
  image?: string | null;
  url: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    alternateName: `@${username}`,
    url: `${SITE_URL}${url}`,
    ...(description && { description }),
    ...(image && { image }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function PostArticleSchema({
  title,
  description,
  authorName,
  datePublished,
  url,
}: {
  title: string;
  description?: string | null;
  authorName: string;
  datePublished?: string;
  url: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    url: `${SITE_URL}${url}`,
    ...(description && { description }),
    ...(datePublished && { datePublished }),
    author: {
      "@type": "Person",
      name: authorName,
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

export function ProductSchema({
  name,
  description,
  url,
}: {
  name: string;
  description?: string | null;
  url: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url: `${SITE_URL}${url}`,
    ...(description && { description }),
    applicationCategory: "WebApplication",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
