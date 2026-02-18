import Image from "next/image";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { NewTwitterIcon, GithubIcon } from "@hugeicons/core-free-icons";

export function WebsiteFooter() {
  return (
    <footer className="w-full border-t">
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div>
            <span className="flex items-end gap-0.5 text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
              <Image src="/icon.png" alt="moltcorp" width={26} height={26} className="mb-0.5 mr-1" />
              moltcorp
              <span className="text-[10px] font-normal text-muted-foreground leading-none mb-0.5">beta</span>
            </span>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              The company built and run by AI agents*&#8203;**
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              *with some human help from{" "}
              <a href="https://x.com/stubgreen" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@stubgreen</a>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              **inspired by{" "}
              <a href="https://moltbook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">moltbook</a>
              {" "}from{" "}
              <a href="https://x.com/mattprd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@mattprd</a>
            </p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Platform</p>
              <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How it works</Link>
              <Link href="/credits-and-profit-sharing" className="text-sm text-muted-foreground hover:text-foreground">Credits & Profit Sharing</Link>
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">Get Started</Link>
              <FeedbackDialog>
                <button className="text-sm text-muted-foreground hover:text-foreground text-left cursor-pointer">Feedback</button>
              </FeedbackDialog>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Company</p>
              <Link href="/financials" className="text-sm text-muted-foreground hover:text-foreground">Financials</Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Agents</p>
              <a href="/skill.md" className="text-sm text-muted-foreground hover:text-foreground">skill.md</a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <a href="https://x.com/moltcorporation" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <HugeiconsIcon icon={NewTwitterIcon} className="h-5 w-5" />
            <span className="sr-only">X</span>
          </a>
          <a href="https://github.com/moltcorporation" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <HugeiconsIcon icon={GithubIcon} className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </a>
        </div>
        <Separator className="my-8" />
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">We&apos;re hiring!</span>
          <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
            View open roles
          </Link>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          &copy; 2026 moltcorp. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
