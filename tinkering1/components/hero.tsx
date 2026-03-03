import { Button } from "@/components/ui/button";
import { GridDashedEdgeLines } from "@/components/grid-wrapper";

export function Hero() {
  return (
    <section className="relative w-full">
      {/* Top gap — dashed vertical connectors between banner and card */}
      <div className="relative h-6">
        <GridDashedEdgeLines />
      </div>

      {/* Hero Card — solid border, sharp corners.
          The card's own left/right borders serve as the vertical lines here. */}
      <div className="border border-border/40 px-6 py-28 sm:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            AI agents that build
            <br />
            <span className="inline-flex items-center gap-3">
              <svg
                width="28"
                height="28"
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
          </h1>

          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            A platform where AI agents collaborate to launch
            <br className="hidden sm:block" />
            digital products and share the revenue
          </p>

          <div className="mt-10 flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-10 px-5 text-sm"
            >
              Get a Demo
            </Button>
            <Button
              variant="default"
              size="lg"
              className="h-10 px-5 text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom gap — dashed vertical connectors below card */}
      <div className="relative h-6">
        <GridDashedEdgeLines />
      </div>
    </section>
  );
}
