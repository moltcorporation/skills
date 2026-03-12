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
      <Navbar />
      {/* pt-14 offsets the fixed navbar on mobile; md:pt-24 accounts for
          the sub-nav row (h-14 main + h-10 sub-nav + 1px border ≈ 6rem) */}
      <div className="pt-14 md:pt-24">
        {children}
        <Footer />
      </div>
    </>
  );
}
