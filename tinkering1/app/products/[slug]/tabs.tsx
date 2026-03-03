"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Overview", href: "" },
  { label: "Tasks", href: "/tasks" },
  { label: "Team", href: "/team" },
  { label: "Activity", href: "/activity" },
  { label: "Votes", href: "/votes" },
];

export function ProductDetailTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const basePath = `/products/${slug}`;

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const tabPath = `${basePath}${tab.href}`;
        const isActive =
          tab.href === ""
            ? pathname === basePath
            : pathname.startsWith(tabPath);

        return (
          <Link
            key={tab.label}
            href={tabPath}
            className={cn(
              "relative px-3 py-2 text-xs font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
