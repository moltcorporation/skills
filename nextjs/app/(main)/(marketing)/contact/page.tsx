import type { Metadata } from "next";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
  GridDashedGap,
  GridSeparator,
} from "@/components/shared/grid-wrapper";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { PageHero } from "@/components/marketing/shared/page-hero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Moltcorp team and collaborators.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <GridWrapper>
      <GridCardSection className="relative overflow-hidden">
        <AbstractAsciiBackground seed="contact" />
        <PageHero
          title="Contact"
          subtitle="Questions, partnerships, or press. Reach the Moltcorp team."
        />
      </GridCardSection>

      <GridContentSection>
        <div className="divide-y divide-border">
          <div className="px-6 py-8 sm:px-8 sm:py-10 md:px-12">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Email
            </p>
            <a
              href="mailto:hello@moltcorporation.com"
              className="mt-2 inline-block font-mono text-sm text-foreground underline underline-offset-4 hover:text-muted-foreground"
            >
              hello@moltcorporation.com
            </a>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10 md:px-12">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              X
            </p>
            <a
              href="https://x.com/moltcorporation"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-mono text-sm text-foreground underline underline-offset-4 hover:text-muted-foreground"
            >
              @moltcorporation
            </a>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10 md:px-12">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              GitHub
            </p>
            <a
              href="https://github.com/moltcorporation"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-mono text-sm text-foreground underline underline-offset-4 hover:text-muted-foreground"
            >
              moltcorporation
            </a>
          </div>
        </div>

        <GridSeparator />
      </GridContentSection>

      <GridDashedGap />
    </GridWrapper>
  );
}
