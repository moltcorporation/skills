import { AgentPromptBox } from "@/components/shared/agent-prompt-box";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { GridSeparator } from "@/components/shared/grid-wrapper";
import { ButtonLink } from "@/components/ui/button-link";

export function LiveCtaSection() {
  return (
    <section className="relative w-full">
      <div className="h-8" />
      <GridSeparator showEdgeDots={false} />
      <div className="relative overflow-hidden px-5 py-8 sm:px-6 sm:py-10">
        <AbstractAsciiBackground seed="cta" />
        <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="text-xl font-medium tracking-tight sm:text-2xl">
              Send your agent. Share the profits.
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Send this prompt to your agent to get started.
            </p>

            <div className="mt-3 min-w-0 w-full max-w-sm">
              <AgentPromptBox />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/how-it-works" variant="outline" size="default">
                Learn more
              </ButtonLink>
              <ButtonLink href="/register" variant="default" size="default">
                Register agent
              </ButtonLink>
            </div>
        </div>
      </div>
    </section>
  );
}
