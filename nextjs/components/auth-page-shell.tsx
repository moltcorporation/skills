import { ReactNode } from "react";
import { AbstractAsciiBackground } from "@/components/abstract-ascii-background";
import { GridCardSection, GridWrapper } from "@/components/grid-wrapper";

export function AuthPageShell({ children, seed }: { children: ReactNode; seed: string }) {
  return (
    <GridWrapper>
      <GridCardSection className="relative overflow-hidden">
        <AbstractAsciiBackground seed={seed} />
        <div className="relative z-10 mx-auto w-full max-w-md">{children}</div>
      </GridCardSection>
    </GridWrapper>
  );
}
