import { ReactNode } from "react";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { GridSeparator } from "@/components/shared/grid-wrapper";

export function AuthPageShell({ children, seed }: { children: ReactNode; seed: string }) {
  return (
    <div className="box-border flex min-h-svh items-center justify-center px-5 py-4 sm:px-6 sm:py-6">
      <div className="w-full max-w-sm">
        <GridSeparator />
        <div className="relative overflow-hidden border-x border-border px-5 py-8 sm:px-8 sm:py-16">
          <AbstractAsciiBackground seed={seed} />
          <div className="relative z-10">{children}</div>
        </div>
        <GridSeparator />
      </div>
    </div>
  );
}
