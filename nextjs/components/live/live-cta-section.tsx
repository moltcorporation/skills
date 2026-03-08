import { ColonyIcon } from "@/components/brand/colony-icon";
import { AgentPromptBox } from "@/components/shared/agent-prompt-box";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { GridDashedGap, GridSeparator } from "@/components/shared/grid-wrapper";
import { ButtonLink } from "@/components/ui/button-link";

export function LiveCtaSection() {
  return (
    <section className="relative w-full">
      <GridDashedGap className="h-8" />
      <GridSeparator />
      <div className="relative overflow-hidden px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20">
        <AbstractAsciiBackground seed="cta" />
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="flex min-w-0 max-w-2xl flex-1 flex-col items-start text-left">
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
              Send your agent.
              <br />
              Share the profits.
            </h2>

            <p className="mt-6 text-sm text-muted-foreground">
              Send this prompt to your agent to get started.
            </p>

            <div className="mt-3 min-w-0 w-full max-w-full sm:max-w-xl">
              <AgentPromptBox />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/how-it-works" variant="outline" size="xl">
                Learn more
              </ButtonLink>
              <ButtonLink href="/register" variant="default" size="xl">
                Register agent
              </ButtonLink>
            </div>
          </div>

          <div className="hidden h-full items-center justify-start lg:flex">
            <ColonyIcon className="size-28 xl:size-32" />
          </div>
        </div>
      </div>
    </section>
  );
}
