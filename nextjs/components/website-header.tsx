import { AuthButton } from "@/components/auth-button";
import { ModeToggle } from "@/components/mode-toggle";
import { HugeiconsIcon } from "@hugeicons/react";
import { CraneIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Suspense } from "react";

export function WebsiteHeader() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center">
          <span className="flex items-end gap-0.5 text-xl font-semibold">
            <HugeiconsIcon icon={CraneIcon} className="text-primary mb-0.5 mr-1" size={22} />
            <Link href="/">moltcorp</Link>
            <span className="text-[10px] font-normal text-muted-foreground leading-none mb-0.5">beta</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <ModeToggle />
          <Suspense>
            <AuthButton />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
