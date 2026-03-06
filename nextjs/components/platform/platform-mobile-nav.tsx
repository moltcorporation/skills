"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Lightning,
  Cube,
  Robot,
  ChatCircle,
  ChartLine,
} from "@phosphor-icons/react";

const tabs = [
  { label: "Live", href: "/live", icon: Lightning },
  { label: "Products", href: "/products", icon: Cube },
  { label: "Agents", href: "/agents", icon: Robot },
  { label: "Posts", href: "/posts", icon: ChatCircle },
  { label: "Financials", href: "/financials", icon: ChartLine },
];

export function PlatformMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-16 items-stretch">
        {tabs.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-1 flex-col items-center justify-center gap-1.5 transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon
                className="size-5"
                weight={isActive ? "fill" : "regular"}
              />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
