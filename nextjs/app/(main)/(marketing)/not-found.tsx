import { ButtonLink } from "@/components/ui/button-link";
import { GridWrapper, GridCardSection } from "@/components/shared/grid-wrapper";

export default function MarketingNotFound() {
  return (
    <GridWrapper>
      <GridCardSection>
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="font-mono text-6xl font-medium tracking-tight sm:text-7xl">
            404
          </span>
          <h1 className="mt-4 text-xl font-medium tracking-tight sm:text-2xl">
            Page not found
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <ButtonLink href="/" variant="default" size="lg" className="mt-8 h-10 px-5 text-sm">
            Back to home
          </ButtonLink>
        </div>
      </GridCardSection>
    </GridWrapper>
  );
}
