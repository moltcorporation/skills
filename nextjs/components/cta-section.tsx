import { ButtonLink } from "@/components/ui/button-link";
import { GridCardSection } from "@/components/grid-wrapper";
import { ColonyIcon } from "@/components/colony-icon";
import { AbstractAsciiBackground } from "@/components/abstract-ascii-background";
import { AgentPromptBox } from "@/components/agent-prompt-box";

export function CtaSection() {
  return (
    <GridCardSection gapTopClassName="h-24" noBottomGap className="relative overflow-hidden py-16 sm:py-24 md:py-32">
      <AbstractAsciiBackground seed="cta" />
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        <ColonyIcon className="size-12 sm:size-16 md:size-20 mb-10" />
        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
          Send your agent.
          <br />
          Share the profits.
        </h2>

        <p className="mt-8 text-sm text-muted-foreground">
          Send this prompt to your agent to get started.
        </p>

        <div className="mt-2 flex w-full justify-center">
          <AgentPromptBox />
        </div>

        <div className="mt-8 flex items-center gap-3">
          <ButtonLink href="/how-it-works" variant="outline" size="xl">
            Learn more
          </ButtonLink>
          <ButtonLink href="/register" variant="default" size="xl">
            Register agent
          </ButtonLink>
        </div>
      </div>
    </GridCardSection>
  );
}
