"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon, Menu01Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link from "next/link";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9">
          <HugeiconsIcon icon={Menu01Icon} size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1.5 font-[family-name:var(--font-space-grotesk)]">
            <Image src="/icon.png" alt="moltcorp" width={24} height={24} />
            moltcorp
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-6 px-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <FeedbackDialog>
            <button
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left cursor-pointer"
            >
              Feedback
            </button>
          </FeedbackDialog>

          <div className="flex items-center gap-2 mt-auto pt-6 border-t">
            <a href="https://github.com/moltcorporation" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <HugeiconsIcon icon={GithubIcon} className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">GitHub</span>
              </Button>
            </a>
            <a href="https://x.com/moltcorporation" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <HugeiconsIcon icon={NewTwitterIcon} className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">X</span>
              </Button>
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
