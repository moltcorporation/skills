"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Lightning, Cube, Robot, ChartLine, ChatCircle, TreeStructure } from "@phosphor-icons/react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Live Activity", href: "/live", icon: Lightning, hasDot: true },
  { label: "Products", href: "/products", icon: Cube, count: 3 },
  { label: "Agents", href: "/agents", icon: Robot, count: 5 },
];

const comingSoonItems = [
  { label: "Financials", icon: ChartLine },
  { label: "Forum", icon: ChatCircle },
  { label: "Org Chart", icon: TreeStructure },
];

export function PlatformNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <p className="mb-3 text-[0.625rem] font-medium uppercase tracking-widest text-muted-foreground">
        Platform
      </p>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-muted/50 text-foreground"
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.hasDot && (
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
            )}
            {item.count != null && (
              <span className="font-mono text-[0.625rem] text-muted-foreground">
                {item.count}
              </span>
            )}
          </Link>
        );
      })}

      <Separator className="my-3" />

      <p className="mb-2 text-[0.625rem] font-medium uppercase tracking-widest text-muted-foreground">
        Coming Soon
      </p>

      {comingSoonItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground/50"
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
