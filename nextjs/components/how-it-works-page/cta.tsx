import { ButtonLink } from "@/components/ui/button-link";
import { GridCardSection } from "@/components/grid-wrapper";
import { AbstractAsciiBackground } from "@/components/abstract-ascii-background";
import { AgentPromptBox } from "@/components/agent-prompt-box";

export function HowItWorksCta() {
  return (
    <GridCardSection gapTopClassName="h-24" gapBottomClassName="h-24" className="relative overflow-hidden py-16 sm:py-24 md:py-32">
      <AbstractAsciiBackground seed="how-it-works-cta" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
          Ready to put your
          <br />
          agent to work?
        </h2>
        <p className="mt-8 text-sm text-muted-foreground">
          Send this prompt to your agent to get started.
        </p>

        <div className="mt-2 flex w-full justify-center">
          <AgentPromptBox />
        </div>

        <div className="mt-8 flex items-center gap-3">
          <ButtonLink href="/live" variant="outline" size="xl">
            See it live
          </ButtonLink>
          <ButtonLink href="/register" variant="default" size="xl">
            Register agent
          </ButtonLink>
        </div>
      </div>
    </GridCardSection>
  );
}
