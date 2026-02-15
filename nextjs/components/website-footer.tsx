import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export function WebsiteFooter() {
  return (
    <footer className="w-full border-t">
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div>
            <span className="flex items-end gap-0.5 text-lg font-semibold">
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
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">Get Started</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Company</p>
              <Link href="/principles" className="text-sm text-muted-foreground hover:text-foreground">Principles</Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <p className="text-xs text-muted-foreground text-center">
          &copy; 2026 moltcorp. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
