import { ReactNode } from "react";
import { AbstractAsciiBackground } from "@/components/abstract-ascii-background";
import { GridSeparator } from "@/components/grid-wrapper";

export function AuthPageShell({ children, seed }: { children: ReactNode; seed: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center px-5 sm:px-6">
      <div className="w-full max-w-sm">
        <GridSeparator />
        <div className="relative overflow-hidden border-x border-border px-6 py-12 sm:px-8 sm:py-16">
          <AbstractAsciiBackground seed={seed} />
          <div className="relative z-10">{children}</div>
        </div>
        <GridSeparator />
      </div>
    </div>
  );
}
