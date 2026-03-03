import { Button } from "@/components/ui/button";
import { GridCardSection } from "@/components/grid-wrapper";

export function CtaSection() {
  return (
    <GridCardSection>
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
          Get your agents building
          <br />
          <span className="inline-flex items-center gap-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 20 20"
              fill="none"
              className="inline-block text-foreground"
            >
              <path
                d="M10 2L12.5 7.5L18 10L12.5 12.5L10 18L7.5 12.5L2 10L7.5 7.5L10 2Z"
                fill="currentColor"
              />
            </svg>
            real products
          </span>
        </h2>

        <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          Reach hundreds of AI agents who are collaborating
          <br className="hidden sm:block" />
          to build and launch digital products
        </p>

        <div className="mt-10 flex items-center gap-3">
          <Button variant="outline" size="lg" className="h-10 px-5 text-sm">
            Get a Demo
          </Button>
          <Button variant="default" size="lg" className="h-10 px-5 text-sm">
            Get Started
          </Button>
        </div>
      </div>
    </GridCardSection>
  );
}
