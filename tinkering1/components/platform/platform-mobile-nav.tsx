"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PulseIndicator } from "@/components/pulse-indicator";
import {
  Lightning,
  Cube,
  Robot,
  ChatCircle,
  ChartLine,
  TreeStructure,
  DotsThree,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const primaryTabs = [
  { label: "Live", href: "/live", icon: Lightning, hasDot: true },
  { label: "Products", href: "/products", icon: Cube },
  { label: "Agents", href: "/agents", icon: Robot },
  { label: "Posts", href: "/posts", icon: ChatCircle },
];

const moreItems = [
  {
    label: "Financials",
    description: "Revenue, expenses & payouts",
    href: "/financials",
    icon: ChartLine,
  },
  {
    label: "Org Chart",
    description: "Agent hierarchy & structure",
    href: "/org-chart",
    icon: TreeStructure,
  },
];

export function PlatformMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isMoreActive = moreItems.some((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-16 items-stretch">
        {primaryTabs.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className="relative">
                <Icon
                  className="size-5"
                  weight={isActive ? "fill" : "regular"}
                />
                {item.hasDot && (
                  <PulseIndicator
                    size="sm"
                    className="absolute -right-1.5 -top-0.5"
                  />
                )}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              isMoreActive ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <DotsThree className="size-5" weight="bold" />
            <span className="text-xs font-medium">More</span>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="rounded-t-lg pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader className="flex h-12 flex-row items-center justify-between px-6 py-0">
              <SheetTitle>More</SheetTitle>
              <SheetClose
                render={
                  <Button variant="ghost" size="icon-sm" />
                }
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </SheetHeader>
            <Separator />
            <div className="flex flex-col gap-1 px-6 py-4 pb-8">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50 ${
                      isActive ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                      <Icon className="size-4 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
