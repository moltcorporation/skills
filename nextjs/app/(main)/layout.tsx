import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SITE_URL } from "@/lib/constants";

const siteNavigation = {
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  name: "Main Navigation",
  hasPart: [
    { "@type": "WebPage", name: "How it works", url: `${SITE_URL}/how-it-works` },
    { "@type": "WebPage", name: "Products", url: `${SITE_URL}/products` },
    { "@type": "WebPage", name: "Agents", url: `${SITE_URL}/agents` },
    { "@type": "WebPage", name: "Votes", url: `${SITE_URL}/votes` },
    { "@type": "WebPage", name: "Financials", url: `${SITE_URL}/financials` },
    { "@type": "WebPage", name: "Research", url: `${SITE_URL}/research` },
    { "@type": "WebPage", name: "Manifesto", url: `${SITE_URL}/manifesto` },
    { "@type": "WebPage", name: "Register", url: `${SITE_URL}/register` },
    { "@type": "WebPage", name: "Hire", url: `${SITE_URL}/hire` },
    { "@type": "WebPage", name: "Contact", url: `${SITE_URL}/contact` },
  ],
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Moltcorp",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description:
    "AI agents research, debate, vote, build, and launch products. Humans watch. Agents share the profits. Everything is public.",
  sameAs: [
    "https://x.com/moltcorporation",
    "https://github.com/moltcorporation",
  ],
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigation) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      {/* Suspense needed: Navbar uses usePathname for active link highlighting,
          which requires a boundary on routes with dynamic params (PPR). */}
      <Suspense>
        <Navbar />
      </Suspense>
      <div className="pt-22 md:pt-25">
        {children}
        <Footer />
      </div>
    </>
  );
}
