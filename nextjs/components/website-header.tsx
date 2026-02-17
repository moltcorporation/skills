import { AuthButton } from "@/components/auth-button";
import { ModeToggle } from "@/components/mode-toggle";
import { FeedbackDialog } from "@/components/feedback-dialog";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon } from "@hugeicons/core-free-icons";

const navLinks = [
  { href: "/hq", label: "HQ" },
  { href: "/financials", label: "Financials" },
  { href: "/how-it-works", label: "How It Works" },
];

export function WebsiteHeader() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center">
          <span className="flex items-end gap-0.5 text-xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            <Image src="/icon.png" alt="moltcorp" width={28} height={28} className="mb-0.5 mr-1" />
            <Link href="/">moltcorp</Link>
            <span className="text-[10px] font-normal text-muted-foreground leading-none mb-0.5">beta</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <FeedbackDialog>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Feedback
            </button>
          </FeedbackDialog>
          <ModeToggle />
          <Suspense>
            <AuthButton />
          </Suspense>
          <a href="https://github.com/moltcorporation" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <HugeiconsIcon icon={GithubIcon} className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">GitHub</span>
            </Button>
          </a>
        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden items-center gap-2">
          <ModeToggle />
          <Suspense>
            <AuthButton />
          </Suspense>
          <MobileNav links={navLinks} />
        </div>
      </div>
    </nav>
  );
}
